/**
 * useSynthEngine — owns the AudioContext, worklet, channels, event pipe,
 * transport, and all synth-related state. UI components stay presentational.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SF2Service from "../../sf2-service/index.js";
import {
  bankOf,
  createChannel,
  pidOf,
} from "../createChannel.js";
import { DRUMSCHANNEL, midi_ch_cmds, midi_effects } from "../constants.js";
import { mkeventsPipe } from "../mkeventsPipe.js";
import { readMidi } from "../midiread.js";
import { mkpath } from "../mkpath.js";
import { mfilelist } from "../../mfilelist.js";
import { sf2list } from "../../sflist.js";
import { fetchmidilist } from "../midilist.js";
import useTM from "../sequence/useTM.js";
import { TIMER_STATE, cmd2stateChange } from "../sequence/constants.js";
import { GEN, GROUP_GENS, SLIDERS, SLIDER_KEYS } from "../genMapping.js";

const CHANNEL_IDS = Array.from({ length: 16 }, (_, index) => index);
const DEFAULT_SF2 = sf2list[0] ?? "./static/VintageDreamsWaves-v2.sf2";
const LOOKAHEAD_SECONDS = 0.1;

export const CHANNEL_ACCENTS = [
  "#f8bf7a", "#ef8f6d", "#ea6f7b", "#ce6898",
  "#a96bbb", "#7684d9", "#58a1d7", "#4eb7c2",
  "#65ca9c", "#92d375", "#c8cf60", "#f1be57",
  "#f4a259", "#f28482", "#84a59d", "#90caf9",
];

export function normalizeMidiMessage(message) {
  const data = Array.isArray(message)
    ? message
    : Array.from(message ?? []);
  if (!data.length) return null;
  const status = data[0];
  if (status < 0x80 || status >= 0xf0) return null; // ignore system messages
  const cmd = status & 0xf0;
  const channel = status & 0x0f;
  if (cmd === 0xc0 || cmd === 0xd0) {
    // 2-byte messages: program change, channel pressure
    if (data.length < 2) return null;
    return [cmd, channel, data[1] & 0x7f, 0];
  }
  if (data.length < 3) return null;
  return [cmd, channel, data[1], data[2]];
}

function buildInitialTrack(channelId) {
  return {
    id: channelId,
    name: channelId === DRUMSCHANNEL ? "Drum Kit" : `Channel ${channelId + 1}`,
    presetId: null,
    bankId: channelId === DRUMSCHANNEL ? 128 : 0,
    loaded: false,
    muted: false,
    soloed: false,
    activeNotes: 0,
    sounding: [],
    lastNote: null,
    volume: 100,
    pan: 64,
    expression: 127,
    lastZoneRef: null,
  };
}

function labelFromPath(path) {
  return decodeURI(path.split("/").pop() ?? path);
}

function getErrorMessage(error) {
  if (error instanceof Error) return error.message;
  return String(error ?? "Unknown error");
}

function buildLocalMidiChoices() {
  return mfilelist.map((url) => ({ Name: labelFromPath(url), Url: url }));
}

function getTimeBase(midiInfo) {
  return {
    ppqn: midiInfo.division,
    msqn: midiInfo.tempos?.[0]?.tempo || 500000,
    ts: midiInfo.time_base.relative_ts,
    ts1: midiInfo.time_base.numerator,
    ts2: midiInfo.time_base.denum,
  };
}

export function useSynthEngine() {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Booting the synth engine...");
  const [error, setError] = useState("");
  const [audioState, setAudioState] = useState("suspended");
  const [tracks, setTracks] = useState(() =>
    CHANNEL_IDS.map((id) => buildInitialTrack(id))
  );
  const [activeChannel, setActiveChannel] = useState(0);
  const [programOptions, setProgramOptions] = useState([]);
  const [selectedSf2, setSelectedSf2] = useState(DEFAULT_SF2);
  const [midiInfo, setMidiInfo] = useState(null);
  const [midiTitle, setMidiTitle] = useState("No MIDI");
  const [midiChoices, setMidiChoices] = useState(() => buildLocalMidiChoices());
  const [selectedMidi, setSelectedMidi] = useState("");
  const [sf2Meta, setSf2Meta] = useState([]);
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [queryResponse, setQueryResponse] = useState(null);
  const [midiInputs, setMidiInputs] = useState([]);
  const [selectedMidiInputId, setSelectedMidiInputId] = useState("");
  const [masterGain, setMasterGainState] = useState(100);
  const [hideEmpty, setHideEmpty] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [zoneEditor, setZoneEditor] = useState(null);
  const [sliderValues, setSliderValues] = useState({});
  const [overrides, setOverrides] = useState({});

  // Transport state
  const [tm, { setTM, setTS1, setTS2 }] = useTM({
    ppqn: 480,
    msqn: 500000,
    ts: 4,
    ts1: 4,
    ts2: 4,
  });
  const [now, setNow] = useState({ ticks: 0, clock: 0 });
  const [timerState, setTimerState] = useState(TIMER_STATE.INIT);

  const runtimeRef = useRef({
    apath: null,
    channels: [],
    ctx: null,
    eventPipe: null,
    midiAccess: null,
    sf2Service: null,
    unsubscribePort: null,
    timerWorker: null,
  });
  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;
  const activeChannelRef = useRef(activeChannel);
  activeChannelRef.current = activeChannel;
  const tmRef = useRef(tm);
  tmRef.current = tm;
  const overridesRef = useRef(overrides);
  overridesRef.current = overrides;
  const meterRef = useRef(new Float32Array(16));
  const summaryRef = useRef(null);
  const analysisRef = useRef({
    waveForm: () => [],
    frequencyBins: () => [],
  });
  const lastSummaryAt = useRef(0);
  const originalTracksRef = useRef([]);
  const playbackTracksRef = useRef([]);
  const tempoEventsRef = useRef([]);
  const zoneAckTimer = useRef(0);

  // Throttled port posts (sliders fire at 60 Hz; send latest only per rAF).
  const portQueue = useRef(new Map());
  const portRaf = useRef(0);
  const queuePortMsg = useCallback((key, msg) => {
    portQueue.current.set(key, msg);
    if (!portRaf.current) {
      portRaf.current = requestAnimationFrame(() => {
        portRaf.current = 0;
        const port = runtimeRef.current.apath?.spinner.port;
        if (port) {
          for (const m of portQueue.current.values()) port.postMessage(m);
        }
        portQueue.current.clear();
      });
    }
  }, []);

  const appendLog = useCallback((message) => {
    const stamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLogs((current) => [...current.slice(-159), `[${stamp}] ${message}`]);
  }, []);

  const patchTrack = useCallback((channelId, patch) => {
    setTracks((current) =>
      current.map((track) =>
        track.id === channelId ? { ...track, ...patch } : track
      )
    );
  }, []);

  const sendRawMidi = useCallback((message) => {
    runtimeRef.current.eventPipe?.postMessage(message);
  }, []);

  const ensureAudioRunning = useCallback(async () => {
    const ctx = runtimeRef.current.ctx;
    if (!ctx || ctx.state === "running") return;
    await ctx.resume();
    setAudioState(ctx.state);
  }, []);

  // --- program loading ----------------------------------------------------
  const ensureChannelProgramLoaded = useCallback((channelId) => {
    const channel = runtimeRef.current.channels[channelId];
    if (!channel || channel.hasProgram() || channel.isProgramChangePending()) {
      return Promise.resolve();
    }
    const fallbackBank = channelId === DRUMSCHANNEL ? 128 : 0;
    return channel.setProgram(0, fallbackBank);
  }, []);

  async function loadDefaultPrograms() {
    if (!runtimeRef.current.channels.length) return;
    await runtimeRef.current.channels[0].setProgram(0, 0);
    await runtimeRef.current.channels[DRUMSCHANNEL].setProgram(0, 128);
  }

  const initSlidersFromZone = useCallback(
    (channelId, zone) => {
      const chOverrides = overridesRef.current[channelId] ?? {};
      // Re-apply surviving overrides to the new preset's voices.
      const port = runtimeRef.current.apath?.spinner.port;
      if (port) {
        for (const [gen, value] of Object.entries(chOverrides)) {
          port.postMessage({
            cmd: "setGen",
            channel: channelId,
            gen: Number(gen),
            value,
          });
        }
      }
      const next = {};
      for (const key of SLIDER_KEYS) {
        const def = SLIDERS[key];
        const genVal =
          chOverrides[def.gen] ?? zone?.arr[def.gen] ?? defaultGenFor(def.gen);
        next[key] = def.fromGen(genVal);
      }
      setSliderValues((prev) => ({ ...prev, [channelId]: next }));
    },
    []
  );

  function defaultGenFor(gen) {
    // sensible defaults when no zone is available
    switch (gen) {
      case GEN.VolEnvAttack:
      case GEN.VolEnvDecay:
      case GEN.VolEnvRelease:
      case GEN.ModEnvAttack:
      case GEN.ModEnvDecay:
      case GEN.ModEnvRelease:
        return -4000;
      case GEN.VolEnvSustain:
        return 0;
      case GEN.ModEnvSustain:
        return 1000;
      case GEN.FilterFc:
        return 13500;
      default:
        return 0;
    }
  }

  const loadSf2 = useCallback(
    async (nextUrl) => {
      if (!nextUrl) return;
      setSelectedSf2(nextUrl);
      setError("");
      setStatus(`Loading ${labelFromPath(nextUrl)}...`);
      appendLog(`Loading SoundFont ${labelFromPath(nextUrl)}.`);
      try {
        const service = new SF2Service(nextUrl);
        await service.load();
        runtimeRef.current.sf2Service = service;
        runtimeRef.current.channels.forEach((channel) =>
          channel.setSF2(service)
        );
        const nextPrograms = service.programNames
          .map((name, presetId) => (name ? { name, presetId } : null))
          .filter(Boolean);
        setProgramOptions(nextPrograms);
        setSf2Meta(service.meta ?? []);
        appendLog(
          `Loaded ${nextPrograms.length} presets from ${labelFromPath(nextUrl)}.`
        );
        const loadedTracks = tracksRef.current.filter(
          (track) => track.loaded && track.presetId != null
        );
        if (loadedTracks.length) {
          for (const track of loadedTracks) {
            await runtimeRef.current.channels[track.id].setProgram(
              pidOf(track.presetId),
              bankOf(track.presetId)
            );
          }
        } else {
          await loadDefaultPrograms();
        }
        setStatus(`${labelFromPath(nextUrl)} is ready.`);
      } catch (loadError) {
        const message = getErrorMessage(loadError);
        setError(message);
        setStatus("SoundFont load failed.");
        appendLog(`SoundFont load failed: ${message}`);
      }
    },
    [appendLog]
  );

  const loadMidiPrograms = useCallback(
    async (nextMidiInfo) => {
      if (!runtimeRef.current.channels.length || !nextMidiInfo) return;
      const initialPresetPerChannel = new Map();
      const noteChannels = getNoteChannels(nextMidiInfo);
      nextMidiInfo.presets.forEach((preset) => {
        const current = initialPresetPerChannel.get(preset.channel);
        if (!current || preset.t < current.t) {
          initialPresetPerChannel.set(preset.channel, preset);
        }
      });
      if (!initialPresetPerChannel.size && !noteChannels.length) {
        await loadDefaultPrograms();
        return;
      }
      for (const channelId of noteChannels) {
        if (initialPresetPerChannel.has(channelId)) continue;
        const channel = runtimeRef.current.channels[channelId];
        const fallbackBank = channelId === DRUMSCHANNEL ? 128 : 0;
        await channel.setProgram(0, fallbackBank);
      }
      for (const [channelId, preset] of initialPresetPerChannel) {
        const channel = runtimeRef.current.channels[channelId];
        await channel.setProgram(preset.pid, preset.bank);
      }
      if (
        noteChannels.includes(DRUMSCHANNEL) &&
        !initialPresetPerChannel.has(DRUMSCHANNEL)
      ) {
        await runtimeRef.current.channels[DRUMSCHANNEL].setProgram(0, 128);
      }
    },
    []
  );

  const loadMidiFromUrl = useCallback(
    async (url, label = labelFromPath(url)) => {
      if (!url) return;
      setSelectedMidi(url);
      setError("");
      setStatus(`Loading ${label}...`);
      appendLog(`Loading MIDI ${label}.`);
      try {
        const response = await fetch(url);
        const buffer = new Uint8Array(await response.arrayBuffer());
        const parsed = readMidi(buffer);
        setMidiInfo(parsed);
        setMidiTitle(label);
        await loadMidiPrograms(parsed);
        setStatus(`${label} loaded.`);
        setActiveChannel(parsed.presets[0]?.channel ?? 0);
        appendLog(
          `Parsed ${parsed.ntracks} tracks and ${parsed.presets.length} program changes from ${label}.`
        );
      } catch (loadError) {
        const message = getErrorMessage(loadError);
        setError(message);
        setStatus("MIDI load failed.");
        appendLog(`MIDI load failed: ${message}`);
      }
    },
    [appendLog, loadMidiPrograms]
  );

  const loadMidiFromFile = useCallback(
    async (file) => {
      if (!file) return;
      setSelectedMidi("");
      setError("");
      setStatus(`Importing ${file.name}...`);
      appendLog(`Importing MIDI file ${file.name}.`);
      try {
        const buffer = new Uint8Array(await file.arrayBuffer());
        const parsed = readMidi(buffer);
        setMidiInfo(parsed);
        setMidiTitle(file.name);
        await loadMidiPrograms(parsed);
        setStatus(`${file.name} loaded.`);
        setActiveChannel(parsed.presets[0]?.channel ?? 0);
        appendLog(
          `Parsed ${parsed.ntracks} tracks and ${parsed.presets.length} program changes from ${file.name}.`
        );
      } catch (loadError) {
        const message = getErrorMessage(loadError);
        setError(message);
        setStatus("MIDI import failed.");
        appendLog(`MIDI import failed: ${message}`);
      }
    },
    [appendLog, loadMidiPrograms]
  );

  // --- transport ----------------------------------------------------------
  function updateTM(patch) {
    const worker = runtimeRef.current.timerWorker;
    setTM((current) => {
      const next =
        typeof patch === "function" ? patch(current) : { ...current, ...patch };
      worker?.postMessage({ tm: next });
      return next;
    });
  }

  function resetPlaybackAt(ticks) {
    playbackTracksRef.current = originalTracksRef.current.map((track) =>
      track.filter((event) => event.t > ticks).map(cloneEvent)
    );
    const info = midiInfoRef.current;
    const tempos = [...(info?.tempos ?? [])].sort((a, b) => a.t - b.t);
    let active = tempos[0] ?? { t: 0, tempo: 500000 };
    const upcoming = [];
    for (const tempo of tempos) {
      if (tempo.t <= ticks) active = tempo;
      else upcoming.push({ ...tempo });
    }
    tempoEventsRef.current = [{ ...active, t: ticks }, ...upcoming];
    updateTM((current) => ({ ...current, msqn: active.tempo }));
  }
  const midiInfoRef = useRef(midiInfo);
  midiInfoRef.current = midiInfo;

  const allNotesOff = useCallback(() => {
    for (const ch of CHANNEL_IDS) {
      sendRawMidi([midi_ch_cmds.continuous_change | ch, 123, 0]);
      sendRawMidi([midi_ch_cmds.continuous_change | ch, 120, 0]);
    }
    runtimeRef.current.channels.forEach((channel) => channel.releaseAllKeys());
  }, [sendRawMidi]);

  async function runTransportCommand(command) {
    const worker = runtimeRef.current.timerWorker;
    if (!worker) return;
    if (command === "start" || command === "resume") {
      await ensureAudioRunning();
    }
    if (command === "start" || command === "reset") {
      allNotesOff();
      resetPlaybackAt(0);
      setNow({ ticks: 0, clock: 0 });
      worker.postMessage({ cmd: command });
    } else if (command === "stop" || command === "pause") {
      allNotesOff();
      worker.postMessage({ cmd: command });
    } else if (command === "rwd" || command === "fwd") {
      const delta = tmRef.current.ppqn * 8;
      const nextTicks = Math.max(
        0,
        now.ticks + (command === "fwd" ? delta : -delta)
      );
      allNotesOff();
      resetPlaybackAt(nextTicks);
      setNow((current) => ({ ...current, ticks: nextTicks }));
      worker.postMessage({ tick: nextTicks, clock: ticksToMs(nextTicks) });
    } else {
      worker.postMessage({ cmd: command });
    }
    if (Object.prototype.hasOwnProperty.call(cmd2stateChange, command)) {
      setTimerState(cmd2stateChange[command]);
    }
  }

  function ticksToMs(ticks) {
    const tmNow = tmRef.current;
    const tempos = [...(midiInfoRef.current?.tempos ?? [])].sort(
      (a, b) => a.t - b.t
    );
    let ms = 0;
    let lastTick = 0;
    let msqn = tempos[0]?.tempo ?? 500000;
    for (const te of tempos) {
      if (te.t >= ticks) break;
      ms += ((te.t - lastTick) * msqn) / tmNow.ppqn / 1000;
      lastTick = te.t;
      msqn = te.tempo;
    }
    ms += ((ticks - lastTick) * msqn) / tmNow.ppqn / 1000;
    return ms;
  }

  const setBpm = useCallback((bpm) => {
    updateTM((current) => {
      const ts = current.ts1 / current.ts2;
      return { ...current, msqn: 60000000 / bpm / ts };
    });
  }, []);

  const seekTo = useCallback(
    (ticks) => {
      const worker = runtimeRef.current.timerWorker;
      if (!worker) return;
      const target = Math.max(0, Math.round(ticks));
      allNotesOff();
      resetPlaybackAt(target);
      setNow((current) => ({ ...current, ticks: target }));
      worker.postMessage({ tick: target, clock: ticksToMs(target) });
    },
    [allNotesOff]
  );

  // --- mixer --------------------------------------------------------------
  const effectiveMuted = useCallback(
    (track) => {
      const anySolo = tracksRef.current.some((t) => t.soloed);
      return track.muted || (anySolo && !track.soloed);
    },
    []
  );

  const toggleMute = useCallback(
    (channelId) => {
      const track = tracksRef.current[channelId];
      const nextMuted = !track.muted;
      patchTrack(channelId, { muted: nextMuted });
      const nextTracks = tracksRef.current.map((t) =>
        t.id === channelId ? { ...t, muted: nextMuted } : t
      );
      const anySolo = nextTracks.some((t) => t.soloed);
      nextTracks.forEach((t) => {
        runtimeRef.current.apath?.setMuted(
          t.id,
          t.muted || (anySolo && !t.soloed)
        );
      });
    },
    [patchTrack]
  );

  const toggleSolo = useCallback(
    (channelId) => {
      const track = tracksRef.current[channelId];
      const nextSolo = !track.soloed;
      const nextTracks = tracksRef.current.map((t) => ({
        ...t,
        soloed: t.id === channelId ? nextSolo : false,
      }));
      setTracks(nextTracks);
      const anySolo = nextTracks.some((t) => t.soloed);
      nextTracks.forEach((t) => {
        runtimeRef.current.apath?.setMuted(
          t.id,
          t.muted || (anySolo && !t.soloed)
        );
      });
    },
    []
  );

  function sendControlChange(channelId, controller, value) {
    sendRawMidi([midi_ch_cmds.continuous_change | channelId, controller, value]);
  }

  const setMixControl = useCallback(
    (channelId, control, rawValue) => {
      const value = Math.round(Number(rawValue));
      patchTrack(channelId, { [control]: value });
      switch (control) {
        case "volume":
          sendControlChange(channelId, midi_effects.volumecoarse, value);
          break;
        case "pan":
          sendControlChange(channelId, midi_effects.pancoarse, value);
          break;
        case "expression":
          sendControlChange(channelId, midi_effects.expressioncoarse, value);
          break;
        default:
          break;
      }
    },
    [patchTrack, sendRawMidi]
  );

  // --- inspector sliders -> generator overrides ----------------------------
  const setGen = useCallback(
    (channelId, sliderKey, sliderValue) => {
      const def = SLIDERS[sliderKey];
      if (!def) return;
      const genValue = def.toGen(Number(sliderValue));
      setOverrides((prev) => ({
        ...prev,
        [channelId]: { ...prev[channelId], [def.gen]: genValue },
      }));
      setSliderValues((prev) => ({
        ...prev,
        [channelId]: { ...prev[channelId], [sliderKey]: Number(sliderValue) },
      }));
      queuePortMsg(`${channelId}:${def.gen}`, {
        cmd: "setGen",
        channel: channelId,
        gen: def.gen,
        value: genValue,
      });
    },
    [queuePortMsg]
  );

  const resetGenGroup = useCallback(
    (channelId, group) => {
      const gens = GROUP_GENS[group] ?? [];
      const port = runtimeRef.current.apath?.spinner.port;
      setOverrides((prev) => {
        const next = { ...(prev[channelId] ?? {}) };
        for (const gen of gens) delete next[gen];
        return { ...prev, [channelId]: next };
      });
      if (port) {
        for (const gen of gens) {
          port.postMessage({ cmd: "clearGen", channel: channelId, gen });
        }
      }
      const channel = runtimeRef.current.channels[channelId];
      const zone = channel?.getProgram()?.filterKV(-1, -1)[0] ?? null;
      initSlidersFromZone(channelId, zone);
    },
    [initSlidersFromZone]
  );

  const selectProgram = useCallback(
    (channelId, presetId) => {
      const bank = Math.floor(presetId / 128);
      const pid = presetId % 128;
      // Standard MIDI: bank select CCs followed by a 2-byte program change.
      sendRawMidi([midi_ch_cmds.continuous_change | channelId, 0, bank >> 7]);
      sendRawMidi([
        midi_ch_cmds.continuous_change | channelId,
        32,
        bank & 0x7f,
      ]);
      sendRawMidi([midi_ch_cmds.change_program | channelId, pid]);
    },
    [sendRawMidi]
  );

  // --- zone editor --------------------------------------------------------
  const openZoneEditor = useCallback(
    (channelId) => {
      const channel = runtimeRef.current.channels[channelId];
      const program = channel?.getProgram();
      if (!program) return;
      const track = tracksRef.current[channelId];
      const zones = program.zMap;
      const selectedRef = track.lastZoneRef ?? zones[0]?.ref ?? null;
      const zone = zones.find((z) => z.ref === selectedRef) ?? zones[0];
      if (!zone) return;
      const values = Array.from(zone.arr);
      setZoneEditor({
        channelId,
        presetId: track.presetId,
        zones: zones.map((z) => ({
          ref: z.ref,
          keyLo: z.KeyRange.lo,
          keyHi: z.KeyRange.hi,
          velLo: z.VelRange.lo,
          velHi: z.VelRange.hi,
          sampleName: z.shdr?.name ?? "",
        })),
        selectedRef: zone.ref,
        values,
        snapshot: values.slice(),
        error: "",
      });
    },
    []
  );

  const closeZoneEditor = useCallback(() => {
    if (zoneAckTimer.current) clearTimeout(zoneAckTimer.current);
    setZoneEditor(null);
  }, []);

  const pickZoneEditorZone = useCallback(
    (ref) => {
      const ed = zoneEditorRef.current;
      if (!ed) return;
      const channel = runtimeRef.current.channels[ed.channelId];
      const zone = channel?.getProgram()?.zMap.find((z) => z.ref === ref);
      if (!zone) return;
      const values = Array.from(zone.arr);
      setZoneEditor({ ...ed, selectedRef: ref, values, snapshot: values.slice(), error: "" });
    },
    []
  );
  const zoneEditorRef = useRef(zoneEditor);
  zoneEditorRef.current = zoneEditor;

  const postZoneLive = useCallback(
    (ed, values) => {
      const channel = runtimeRef.current.channels[ed.channelId];
      const zone = channel?.getProgram()?.zMap.find((z) => z.ref === ed.selectedRef);
      if (!zone) return;
      // Update the main-thread zone so the UI and filterKV stay in sync.
      zone.arr.set(values.map((v) => Number(v) || 0));
      queuePortMsg(`zone:${ed.channelId}:${ed.selectedRef}`, {
        cmd: "setZone",
        presetId: ed.presetId,
        ref: ed.selectedRef,
        arr: Array.from(zone.arr),
      });
      // Watch for the ack; surface an error if the worklet never applies it.
      if (zoneAckTimer.current) clearTimeout(zoneAckTimer.current);
      zoneAckTimer.current = setTimeout(() => {
        setZoneEditor((cur) =>
          cur ? { ...cur, error: "The synth did not acknowledge the zone edit." } : cur
        );
      }, 2000);
    },
    [queuePortMsg]
  );

  const setZoneField = useCallback(
    (index, rawValue) => {
      setZoneEditor((ed) => {
        if (!ed) return ed;
        const values = ed.values.slice();
        values[index] = rawValue;
        const next = { ...ed, values, error: "" };
        postZoneLive(next, values);
        return next;
      });
    },
    [postZoneLive]
  );

  const revertZone = useCallback(() => {
    setZoneEditor((ed) => {
      if (!ed) return ed;
      const next = { ...ed, values: ed.snapshot.slice(), error: "" };
      postZoneLive(next, next.values);
      return next;
    });
  }, [postZoneLive]);

  // --- diagnostics --------------------------------------------------------
  const queryChannel = useCallback(
    async (channelId) => {
      try {
        const response = await runtimeRef.current.apath?.querySpState(channelId);
        setQueryResponse(response ?? null);
        appendLog(`Fetched synth state for channel ${channelId + 1}.`);
      } catch (queryError) {
        appendLog(
          `Unable to query channel ${channelId + 1}: ${getErrorMessage(queryError)}`
        );
      }
    },
    [appendLog]
  );

  const previewNote = useCallback(
    async (channelId, note = 60, velocity = 108, ms = 320) => {
      await ensureChannelProgramLoaded(channelId);
      await ensureAudioRunning();
      sendRawMidi([midi_ch_cmds.note_on | channelId, note, velocity]);
      setTimeout(() => {
        sendRawMidi([midi_ch_cmds.note_off | channelId, note, 0]);
      }, ms);
    },
    [ensureAudioRunning, ensureChannelProgramLoaded, sendRawMidi]
  );

  const noteOn = useCallback(
    async (note, velocity = 100, channelId = activeChannelRef.current) => {
      await ensureAudioRunning();
      await ensureChannelProgramLoaded(channelId);
      sendRawMidi([midi_ch_cmds.note_on | channelId, note, velocity]);
    },
    [ensureAudioRunning, ensureChannelProgramLoaded, sendRawMidi]
  );

  const noteOff = useCallback(
    (note, channelId = activeChannelRef.current) => {
      sendRawMidi([midi_ch_cmds.note_off | channelId, note, 0]);
    },
    [sendRawMidi]
  );

  const setMasterGain = useCallback((rawValue) => {
    const value = Number(rawValue);
    setMasterGainState(value);
    runtimeRef.current.apath?.setMasterGain(value / 100);
  }, []);

  const refreshMidiInputs = useCallback(
    async ({ silent = false } = {}) => {
      if (!navigator.requestMIDIAccess) {
        if (!silent) appendLog("This browser does not expose Web MIDI input.");
        return;
      }
      try {
        const midiAccess = await navigator.requestMIDIAccess();
        runtimeRef.current.midiAccess = midiAccess;
        const nextInputs = Array.from(midiAccess.inputs.values()).map(
          (input) => ({ id: input.id, name: input.name })
        );
        setMidiInputs(nextInputs);
        if (nextInputs.length && !selectedMidiInputIdRef.current) {
          connectMidiInput(nextInputs[0].id, midiAccess);
        }
        if (!silent) {
          appendLog(
            `Found ${nextInputs.length} MIDI input${nextInputs.length === 1 ? "" : "s"}.`
          );
        }
      } catch (midiError) {
        if (!silent) {
          appendLog(`Unable to access MIDI inputs: ${getErrorMessage(midiError)}`);
        }
      }
    },
    [appendLog]
  );
  const selectedMidiInputIdRef = useRef(selectedMidiInputId);
  selectedMidiInputIdRef.current = selectedMidiInputId;

  const connectMidiInput = useCallback(
    (inputId, midiAccess = runtimeRef.current.midiAccess) => {
      if (!midiAccess) return;
      Array.from(midiAccess.inputs.values()).forEach((input) => {
        input.onmidimessage = null;
      });
      const input = midiAccess.inputs.get(inputId);
      if (!input) return;
      input.onmidimessage = ({ data }) => {
        runtimeRef.current.eventPipe?.postMessage(Array.from(data));
      };
      setSelectedMidiInputId(inputId);
      appendLog(`Connected MIDI input: ${input.name}.`);
    },
    [appendLog]
  );

  // --- init ---------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    // webpack emits the timer module as a content-hashed chunk and resolves
    // this URL relative to the page, so it works under /sf2rend/ too.
    const timerWorker = new Worker(
      new URL("../sequence/timer.js", import.meta.url)
    );
    runtimeRef.current.timerWorker = timerWorker;

    const handleWindowError = (event) => {
      appendLog(`Runtime error: ${event.message}`);
    };
    const handleUnhandledRejection = (event) => {
      appendLog(`Unhandled rejection: ${getErrorMessage(event.reason)}`);
    };
    const handleSynthLog = (event) => {
      appendLog(String(event.detail ?? "synth message"));
    };
    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("sf2rend-log", handleSynthLog);

    async function init() {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        setError("Web Audio is not available in this browser.");
        setStatus("Audio unavailable.");
        return;
      }
      // Match the device sample rate instead of forcing 44.1 kHz.
      const ctx = new AudioContextClass();
      const eventPipe = mkeventsPipe();
      runtimeRef.current.ctx = ctx;
      runtimeRef.current.eventPipe = eventPipe;
      setAudioState(ctx.state);
      ctx.onstatechange = () => setAudioState(ctx.state);
      await ctx.suspend();

      const apath = await mkpath(ctx, eventPipe);
      if (cancelled) {
        await ctx.close();
        return;
      }
      runtimeRef.current.apath = apath;
      analysisRef.current = {
        waveForm: () => apath.analysis.waveForm,
        frequencyBins: () => apath.analysis.frequencyBins,
      };
      runtimeRef.current.unsubscribePort = apath.observeMessages((data) => {
        if (data.queryResponse) {
          setQueryResponse(data.queryResponse);
        }
        if (data.ack === "setZone" && zoneAckTimer.current) {
          clearTimeout(zoneAckTimer.current);
          zoneAckTimer.current = 0;
        }
        if (data.rend_summary) {
          summaryRef.current = data.rend_summary;
          meterRef.current.set(data.rend_summary.rms ?? []);
          const nowMs = performance.now();
          if (nowMs - lastSummaryAt.current > 1000) {
            lastSummaryAt.current = nowMs;
            setSummary(data.rend_summary);
          }
        }
      });

      runtimeRef.current.channels = CHANNEL_IDS.map((channelId) =>
        createChannel(channelId, null, apath, {
          onProgramLoaded: ({ name, presetId, zone, bankId }) => {
            patchTrack(channelId, {
              loaded: true,
              name,
              presetId,
              bankId,
              lastZoneRef: zone?.ref ?? null,
            });
            initSlidersFromZone(channelId, zone);
          },
          onProgramMissing: ({ bankId }) => {
            patchTrack(channelId, { loaded: false, bankId });
          },
          onCCChange: ({ bankId }) => {
            // File CC7/10/11 go to the engine but never move the mix sliders.
            patchTrack(channelId, { bankId });
          },
          onKeyOn: ({ key, activeNotes, zone }) => {
            const channel = runtimeRef.current.channels[channelId];
            patchTrack(channelId, {
              activeNotes,
              lastNote: key,
              lastZoneRef: zone?.ref ?? tracksRef.current[channelId].lastZoneRef,
              sounding: channel?.soundingKeys() ?? [],
            });
          },
          onKeyOff: ({ activeNotes }) => {
            const channel = runtimeRef.current.channels[channelId];
            patchTrack(channelId, {
              activeNotes,
              sounding: channel?.soundingKeys() ?? [],
            });
          },
        })
      );

      eventPipe.onmessage(async (message) => {
        // Sequencer messages arrive wrapped as {midi, atTime}; everything
        // else is a plain MIDI byte array.
        const wrapped =
          message && typeof message === "object" && !Array.isArray(message)
            ? message
            : { midi: message };
        const midi = normalizeMidiMessage(wrapped.midi);
        if (!midi) return;
        const [cmd, channelId, value1, value2] = midi;
        const channel = runtimeRef.current.channels[channelId];
        if (!channel) return;
        switch (cmd) {
          case midi_ch_cmds.continuous_change:
            channel.setCC({ cc: value1, value: value2 });
            runtimeRef.current.apath?.spinner.port.postMessage(wrapped.midi);
            break;
          case midi_ch_cmds.change_program: {
            // Bank-select CCs precede the program change in the stream, so
            // the channel already knows its bank. Never awaited here: the
            // per-channel token chain serializes loads without smearing
            // the timing of following notes.
            const fallbackBank = channelId === DRUMSCHANNEL ? 128 : 0;
            const bankId = channel.getBankId() || fallbackBank;
            channel.setProgram(value1, bankId);
            break;
          }
          case midi_ch_cmds.note_on:
            if (value2 === 0) {
              channel.keyOff(value1, value2);
            } else {
              await ensureChannelProgramLoaded(channelId);
              channel.keyOn(value1, value2, wrapped.atTime);
            }
            break;
          case midi_ch_cmds.note_off:
            channel.keyOff(value1, value2);
            break;
          case midi_ch_cmds.pitchbend:
          default:
            runtimeRef.current.apath?.spinner.port.postMessage(wrapped.midi);
            break;
        }
      });

      setReady(true);
      setStatus("Engine ready.");
      appendLog("Audio engine initialized.");
      await loadSf2(DEFAULT_SF2);
      const defaultMidis = buildLocalMidiChoices();
      if (defaultMidis[0]) {
        setSelectedMidi(defaultMidis[0].Url);
        await loadMidiFromUrl(defaultMidis[0].Url, defaultMidis[0].Name);
      }
    }

    init().catch((initError) => {
      const message = getErrorMessage(initError);
      setError(message);
      setStatus("Initialization failed.");
      appendLog(`Initialization failed: ${message}`);
    });

    return () => {
      cancelled = true;
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("sf2rend-log", handleSynthLog);
      runtimeRef.current.unsubscribePort?.();
      timerWorker.terminate();
      if (zoneAckTimer.current) clearTimeout(zoneAckTimer.current);
      if (portRaf.current) cancelAnimationFrame(portRaf.current);
      runtimeRef.current.ctx?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Remote MIDI list (once).
  useEffect(() => {
    const defaultMidis = buildLocalMidiChoices();
    fetchmidilist()
      .then((remoteChoices) => {
        setMidiChoices(mergeMidiChoices(defaultMidis, remoteChoices));
      })
      .catch(() => {
        setMidiChoices(defaultMidis);
      });
  }, []);

  // --- transport: rebuild + tick dispatch ---------------------------------
  useEffect(() => {
    if (!midiInfo) return;
    originalTracksRef.current = midiInfo.tracks.map((track) =>
      track.map(cloneEvent)
    );
    resetPlaybackAt(0);
    setTM(getTimeBase(midiInfo));
    setNow({ ticks: 0, clock: 0 });
    setTimerState(TIMER_STATE.INIT);
    runtimeRef.current.timerWorker?.postMessage({ cmd: "reset" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [midiInfo]);

  useEffect(() => {
    runtimeRef.current.timerWorker?.postMessage({ tm });
  }, [tm]);

  useEffect(() => {
    const worker = runtimeRef.current.timerWorker;
    if (!worker) return;
    const onMessage = ({ data }) => {
      if (typeof data.ticks !== "number") return;
      // Lookahead scheduling: dispatch events for the next ~100 ms with
      // their target AudioContext time; the worklet holds them until due.
      const tmNow = tmRef.current;
      const tickDur = tmNow.msqn / tmNow.ppqn / 1e6;
      const horizon = data.ticks + Math.ceil(LOOKAHEAD_SECONDS / tickDur);
      const ctxNow = runtimeRef.current.ctx?.currentTime ?? 0;
      playbackTracksRef.current.forEach((track) => {
        while (track.length && track[0].t <= horizon) {
          const event = track.shift();
          if (event.channel) {
            const atTime = ctxNow + Math.max(0, (event.t - data.ticks) * tickDur);
            runtimeRef.current.eventPipe?.postMessage({
              midi: event.channel,
              atTime,
            });
          }
        }
      });
      while (
        tempoEventsRef.current[1] &&
        data.ticks >= tempoEventsRef.current[1].t
      ) {
        const nextTempo = tempoEventsRef.current[1];
        updateTM((current) => ({ ...current, msqn: nextTempo.tempo }));
        tempoEventsRef.current.shift();
      }
      setNow({
        ticks: Math.max(0, data.ticks),
        clock: Math.max(0, data.clock ?? 0),
      });
    };
    worker.addEventListener("message", onMessage);
    return () => worker.removeEventListener("message", onMessage);
  }, []);

  // --- hardware keyboard ----------------------------------------------------
  useEffect(() => {
    const keyLayout = [
      "KeyA", "KeyW", "KeyS", "KeyE", "KeyD", "KeyF",
      "KeyT", "KeyG", "KeyY", "KeyH", "KeyU", "KeyJ",
    ];
    const held = new Map(); // code -> {note, channel}
    const releaseHeld = (code) => {
      const h = held.get(code);
      if (!h) return;
      held.delete(code);
      sendRawMidi([midi_ch_cmds.note_off | h.channel, h.note, 0]);
    };
    const handleKeyDown = async (event) => {
      if (event.repeat) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)
      ) {
        return;
      }
      const index = keyLayout.indexOf(event.code);
      if (index < 0 || held.has(event.code)) return;
      const note = 48 + index;
      const channel = activeChannelRef.current;
      held.set(event.code, { note, channel });
      await ensureAudioRunning();
      await ensureChannelProgramLoaded(channel);
      sendRawMidi([midi_ch_cmds.note_on | channel, note, 100]);
    };
    const handleKeyUp = (event) => releaseHeld(event.code);
    const handleBlur = () => {
      for (const code of [...held.keys()]) releaseHeld(code);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      for (const code of [...held.keys()]) releaseHeld(code);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [ensureAudioRunning, ensureChannelProgramLoaded, sendRawMidi]);

  // --- derived ---------------------------------------------------------------
  const midiStats = useMemo(
    () =>
      midiInfo
        ? {
            tracks: midiInfo.ntracks,
            ppqn: midiInfo.division,
          }
        : null,
    [midiInfo]
  );

  const banksInUse = useMemo(() => {
    const banks = new Set(programOptions.map((p) => Math.floor(p.presetId / 128)));
    return [...banks].sort((a, b) => a - b);
  }, [programOptions]);

  const visibleChannels = useMemo(
    () =>
      hideEmpty
        ? CHANNEL_IDS.filter((id) => tracksRef.current[id]?.loaded)
        : CHANNEL_IDS,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hideEmpty, tracks]
  );

  const activeTrack = tracks[activeChannel] ?? tracks[0];

  return {
    ready,
    status,
    error,
    setError,
    audioState,
    tracks,
    activeChannel,
    setActiveChannel,
    activeTrack,
    programOptions,
    banksInUse,
    selectedSf2,
    loadSf2,
    midiInfo,
    midiTitle,
    midiChoices,
    selectedMidi,
    loadMidiFromUrl,
    loadMidiFromFile,
    midiStats,
    sf2Meta,
    logs,
    summary,
    summaryRef,
    queryResponse,
    queryChannel,
    midiInputs,
    selectedMidiInputId,
    connectMidiInput,
    refreshMidiInputs,
    masterGain,
    setMasterGain,
    hideEmpty,
    setHideEmpty,
    visibleChannels,
    diagnosticsOpen,
    setDiagnosticsOpen,
    // transport
    timerState,
    now,
    tm,
    runTransportCommand,
    setBpm,
    setTS1,
    setTS2,
    seekTo,
    allNotesOff,
    // mixer
    toggleMute,
    toggleSolo,
    setMixControl,
    // inspector
    sliderValues,
    overrides,
    setGen,
    resetGenGroup,
    selectProgram,
    previewNote,
    // zone editor
    zoneEditor,
    openZoneEditor,
    closeZoneEditor,
    pickZoneEditorZone,
    setZoneField,
    revertZone,
    // keyboard
    noteOn,
    noteOff,
    // misc
    meterRef,
    analysisRef,
    ensureAudioRunning,
    appendLog,
    sf2list,
  };
}

function cloneEvent(event) {
  return {
    ...event,
    channel: event.channel ? [...event.channel] : event.channel,
  };
}

function getNoteChannels(midiInfo) {
  const channels = new Set();
  midiInfo.tracks.forEach((track) => {
    track.forEach((event) => {
      if (!event.channel) return;
      const [status, , velocity] = event.channel;
      if ((status & 0xf0) === midi_ch_cmds.note_on && velocity > 0) {
        channels.add(status & 0x0f);
      }
    });
  });
  return Array.from(channels);
}

function mergeMidiChoices(...choiceLists) {
  const map = new Map();
  choiceLists.flat().forEach((item) => {
    if (item?.Url && !map.has(item.Url)) {
      map.set(item.Url, item);
    }
  });
  return Array.from(map.values());
}
