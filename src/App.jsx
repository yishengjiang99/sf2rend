import React, { startTransition, useEffect, useMemo, useRef, useState } from "react";
import SF2Service from "../sf2-service/index.js";
import { attributeKeys } from "../sf2-service/zoneProxy.js";
import { mfilelist } from "../mfilelist.js";
import { sf2list } from "../sflist.js";
import { createChannel } from "./createChannel.js";
import { DRUMSCHANNEL, midi_ch_cmds, midi_effects } from "./constants.js";
import { fetchmidilist } from "./midilist.js";
import { mkeventsPipe } from "./mkeventsPipe.js";
import { readMidi } from "./midiread.js";
import { mkpath } from "./mkpath.js";
import Sequencer from "./sequence/App.js";

const CHANNEL_IDS = Array.from({ length: 16 }, (_, index) => index);
const DEFAULT_SF2 = sf2list[0] ?? "./static/VintageDreamsWaves-v2.sf2";
const DEFAULT_NOTE = 60;
const CHANNEL_ACCENTS = [
  "#f8bf7a",
  "#ef8f6d",
  "#ea6f7b",
  "#ce6898",
  "#a96bbb",
  "#7684d9",
  "#58a1d7",
  "#4eb7c2",
  "#65ca9c",
  "#92d375",
  "#c8cf60",
  "#f1be57",
  "#f4a259",
  "#f28482",
  "#84a59d",
  "#90caf9",
];
const CONTROL_DEFAULTS = {
  volume: 100,
  pan: 64,
  expression: 127,
  filterFc: 6000,
  filterQ: 0,
  vcaAttack: 9,
  vcaDecay: 33,
  vcaSustain: 66,
  vcaRelease: 88,
  vcfAttack: 9,
  vcfDecay: 33,
  vcfSustain: 66,
  vcfRelease: 88,
};

export default function App() {
  const defaultMidis = buildLocalMidiChoices();
  const [channels, setChannels] = useState(() =>
    CHANNEL_IDS.map((channelId) => buildInitialTrack(channelId))
  );
  const [programOptions, setProgramOptions] = useState([]);
  const [midiChoices, setMidiChoices] = useState(defaultMidis);
  const [selectedSf2, setSelectedSf2] = useState(DEFAULT_SF2);
  const [selectedMidi, setSelectedMidi] = useState(defaultMidis[0]?.Url ?? "");
  const [midiTitle, setMidiTitle] = useState(defaultMidis[0]?.Name ?? "No MIDI");
  const [sf2Meta, setSf2Meta] = useState([]);
  const [midiInfo, setMidiInfo] = useState(null);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState("Booting the synth engine...");
  const [error, setError] = useState("");
  const [activeChannel, setActiveChannel] = useState(0);
  const [editingZoneChannel, setEditingZoneChannel] = useState(null);
  const [summary, setSummary] = useState(null);
  const [queryResponse, setQueryResponse] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [audioState, setAudioState] = useState("suspended");
  const [midiInputs, setMidiInputs] = useState([]);
  const [selectedMidiInputId, setSelectedMidiInputId] = useState("");
  const [masterGain, setMasterGain] = useState(100);
  const [sequenceVersion, setSequenceVersion] = useState(0);
  const [loading, setLoading] = useState({
    soundFont: false,
    midi: false,
  });
  // webpack emits the timer module as a content-hashed chunk and resolves
  // this URL relative to the page, so it works under /sf2rend/ too.
  const [timerWorker] = useState(() => new Worker(new URL("./sequence/timer.js", import.meta.url)));
  // UI revamp state (matches docs/ui-reference.html)
  const [openModal, setOpenModal] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [beatUnit, setBeatUnit] = useState(4);
  const [clockText, setClockText] = useState("0:00");
  const [barText, setBarText] = useState("Bar 0.0");
  const [stateTab, setStateTab] = useState("log");
  const runtimeRef = useRef({
    apath: null,
    channels: [],
    ctx: null,
    eventPipe: null,
    midiAccess: null,
    unsubscribePort: null,
    defaultProgramsLoaded: false,
  });
  const channelsStateRef = useRef(channels);
  const lastMeterUpdateRef = useRef(0);
  // Playback state for timer-worker-driven MIDI sequencing (restored from old Sequencer)
  const playbackTracksRef = useRef([]);
  const tempoEventsRef = useRef([]);

  channelsStateRef.current = channels;

  const channelNotes = useMemo(() => getChannelNotes(midiInfo), [midiInfo]);

  const appendLog = (message) => {
    const stamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLogs((current) => [...current.slice(-159), `[${stamp}] ${message}`]);
  };

  const patchChannel = (channelId, patch) => {
    setChannels((current) =>
      current.map((track) =>
        track.id === channelId ? { ...track, ...patch } : track
      )
    );
  };

  async function ensureAudioRunning() {
    const ctx = runtimeRef.current.ctx;
    if (!ctx || ctx.state === "running") {
      return;
    }
    await ctx.resume();
    setAudioState(ctx.state);
  }

  // Transport controls (wired to the timer worker, same as Sequencer)
  async function transportCommand(cmd) {
    await ensureAudioRunning();
    timerWorker.postMessage({ cmd });
    if (cmd === "start" || cmd === "resume") setIsPlaying(true);
    if (cmd === "stop" || cmd === "reset") setIsPlaying(false);
  }

  function sendRawMidi(message) {
    runtimeRef.current.eventPipe?.postMessage(message);
  }

  function sendControlChange(channelId, controller, value) {
    sendRawMidi([midi_ch_cmds.continuous_change | channelId, controller, value]);
  }

  function sendProgramChange(channelId, presetId) {
    const pid = presetId & 0x7f;
    const bankId = presetId & ~0x7f;
    sendRawMidi([midi_ch_cmds.change_program | channelId, pid, bankId]);
  }

  async function loadDefaultPrograms() {
    if (!runtimeRef.current.channels.length) {
      return;
    }
    // Load default programs in parallel (independent channels)
    await Promise.all([
      runtimeRef.current.channels[0].setProgram(0, 0),
      runtimeRef.current.channels[DRUMSCHANNEL].setProgram(0, 128),
    ]);
    runtimeRef.current.defaultProgramsLoaded = true;
  }

  async function loadSf2(nextUrl) {
    if (!nextUrl) {
      return;
    }
    setLoading((current) => ({ ...current, soundFont: true }));
    setSelectedSf2(nextUrl);
    setError("");
    setStatus(`Loading ${labelFromPath(nextUrl)}...`);
    appendLog(`Loading SoundFont ${labelFromPath(nextUrl)}.`);

    try {
      const service = new SF2Service(nextUrl);
      await service.load();
      runtimeRef.current.channels.forEach((channel) => channel.setSF2(service));

      const nextPrograms = service.programNames
        .map((name, presetId) => (name ? { name, presetId } : null))
        .filter(Boolean);

      setProgramOptions(nextPrograms);
      setSf2Meta(service.meta ?? []);
      appendLog(`Loaded ${nextPrograms.length} presets from ${labelFromPath(nextUrl)}.`);

      // Test hook: signal that the default SoundFont is ready (used by tools/audio-check.mjs)
      window.__sf2rendSfLoaded = true;

      const loadedTracks = channelsStateRef.current.filter(
        (track) => track.loaded && track.presetId != null
      );
      if (loadedTracks.length) {
        // Load track programs in parallel (independent channels)
        await Promise.all(
          loadedTracks.map((track) =>
            runtimeRef.current.channels[track.id].setProgram(
              track.presetId & 0x7f,
              track.bankId
            )
          )
        );
      } else {
        await loadDefaultPrograms();
      }

      setStatus(`${labelFromPath(nextUrl)} is ready.`);
    } catch (loadError) {
      const message = getErrorMessage(loadError);
      setError(message);
      setStatus("SoundFont load failed.");
      appendLog(`SoundFont load failed: ${message}`);
    } finally {
      setLoading((current) => ({ ...current, soundFont: false }));
    }
  }

  async function loadMidiPrograms(nextMidiInfo) {
    if (!runtimeRef.current.channels.length || !nextMidiInfo) {
      return;
    }
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

    // Load all channel programs in parallel (independent channels).
    // Channels are disjoint between the fallback set and preset set.
    const programLoads = [];
    for (const channelId of noteChannels) {
      if (initialPresetPerChannel.has(channelId)) {
        continue;
      }
      const channel = runtimeRef.current.channels[channelId];
      const fallbackBank = channelId === DRUMSCHANNEL ? 128 : 0;
      programLoads.push(channel.setProgram(0, fallbackBank));
    }

    for (const [channelId, preset] of initialPresetPerChannel) {
      const channel = runtimeRef.current.channels[channelId];
      const fallbackBank = channelId === DRUMSCHANNEL ? 128 : 0;
      const bankId = channel.getBankId() || fallbackBank;
      programLoads.push(channel.setProgram(preset.pid, bankId));
    }

    if (noteChannels.includes(DRUMSCHANNEL) && !initialPresetPerChannel.has(DRUMSCHANNEL)) {
      programLoads.push(runtimeRef.current.channels[DRUMSCHANNEL].setProgram(0, 128));
    }
    await Promise.all(programLoads);
  }

  async function ensureChannelProgramLoaded(channelId) {
    const track = channelsStateRef.current[channelId];
    if (track?.loaded) {
      return;
    }
    const fallbackBank = channelId === DRUMSCHANNEL ? 128 : 0;
    await runtimeRef.current.channels[channelId]?.setProgram(0, fallbackBank);
  }

  async function loadMidiFromUrl(url, label = labelFromPath(url)) {
    if (!url) {
      return;
    }
    setLoading((current) => ({ ...current, midi: true }));
    setSelectedMidi(url);
    setError("");
    setStatus(`Loading ${label}...`);
    appendLog(`Loading MIDI ${label}.`);

    try {
      const response = await fetch(url);
      const buffer = new Uint8Array(await response.arrayBuffer());
      const parsed = readMidi(buffer);
      startTransition(() => {
        setMidiInfo(parsed);
        setMidiTitle(label);
        setSequenceVersion((current) => current + 1);
      });
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
    } finally {
      setLoading((current) => ({ ...current, midi: false }));
    }
  }

  async function loadMidiFromFile(file) {
    if (!file) {
      return;
    }
    setLoading((current) => ({ ...current, midi: true }));
    setSelectedMidi("");
    setError("");
    setStatus(`Importing ${file.name}...`);
    appendLog(`Importing MIDI file ${file.name}.`);

    try {
      const buffer = new Uint8Array(await file.arrayBuffer());
      const parsed = readMidi(buffer);
      startTransition(() => {
        setMidiInfo(parsed);
        setMidiTitle(file.name);
        setSequenceVersion((current) => current + 1);
      });
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
    } finally {
      setLoading((current) => ({ ...current, midi: false }));
    }
  }

  async function refreshMidiInputs({ silent = false } = {}) {
    if (!navigator.requestMIDIAccess) {
      if (!silent) {
        appendLog("This browser does not expose Web MIDI input.");
      }
      return;
    }

    try {
      const midiAccess = await navigator.requestMIDIAccess();
      runtimeRef.current.midiAccess = midiAccess;
      const nextInputs = Array.from(midiAccess.inputs.values()).map((input) => ({
        id: input.id,
        name: input.name,
      }));
      setMidiInputs(nextInputs);
      if (nextInputs.length && !selectedMidiInputId) {
        connectMidiInput(nextInputs[0].id, midiAccess);
      }
      if (!silent) {
        appendLog(`Found ${nextInputs.length} MIDI input${nextInputs.length === 1 ? "" : "s"}.`);
      }
    } catch (midiError) {
      if (!silent) {
        appendLog(`Unable to access MIDI inputs: ${getErrorMessage(midiError)}`);
      }
    }
  }

  function connectMidiInput(inputId, midiAccess = runtimeRef.current.midiAccess) {
    if (!midiAccess) {
      return;
    }
    Array.from(midiAccess.inputs.values()).forEach((input) => {
      input.onmidimessage = null;
    });
    const input = midiAccess.inputs.get(inputId);
    if (!input) {
      return;
    }
    input.onmidimessage = ({ data }) => {
      runtimeRef.current.eventPipe?.postMessage(Array.from(data));
    };
    setSelectedMidiInputId(inputId);
    appendLog(`Connected MIDI input: ${input.name}.`);
  }

  function updateTrackControl(channelId, control, rawValue) {
    const value = Number(rawValue);
    patchChannel(channelId, { [control]: value });
    const apath = runtimeRef.current.apath;
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
      case "vcaAttack":
        sendControlChange(channelId, midi_effects.VCA_ATTACK_TIME, value);
        break;
      case "vcaDecay":
        sendControlChange(channelId, midi_effects.VCA_DECAY_TIME, value);
        break;
      case "vcaSustain":
        sendControlChange(channelId, midi_effects.VCA_SUSTAIN_LEVEL, value);
        break;
      case "vcaRelease":
        sendControlChange(channelId, midi_effects.VCA_RELEASE_TIME, value);
        break;
      case "vcfAttack":
        sendControlChange(channelId, midi_effects.VCF_ATTACK_TIME, value);
        break;
      case "vcfDecay":
        sendControlChange(channelId, midi_effects.VCF_DECAY_TIME, value);
        break;
      case "vcfSustain":
        sendControlChange(channelId, midi_effects.VCF_SUSTAIN_LEVEL, value);
        break;
      case "vcfRelease":
        sendControlChange(channelId, midi_effects.VCF_RELEASE_TIME, value);
        break;
      case "filterFc":
        apath?.lowPassFilter_set_fc(channelId, value);
        break;
      case "filterQ":
        apath?.lowPassFilter_set_q(channelId, value);
        break;
      default:
        break;
    }
  }

  async function updateMasterGain(rawValue) {
    const value = Number(rawValue);
    setMasterGain(value);
    runtimeRef.current.apath?.setMasterGain(value / 100);
  }

  async function toggleMute(channelId) {
    const track = channelsStateRef.current[channelId];
    const nextMuted = !track.muted;
    patchChannel(channelId, { muted: nextMuted });
    await runtimeRef.current.apath?.mute(channelId, nextMuted);
  }

  async function toggleSolo(channelId) {
    const track = channelsStateRef.current[channelId];
    const nextSolo = !track.solo;
    for (const id of CHANNEL_IDS) {
      const shouldMute = nextSolo ? id !== channelId : false;
      patchChannel(id, {
        solo: id === channelId ? nextSolo : false,
        muted: shouldMute,
      });
      await runtimeRef.current.apath?.mute(id, shouldMute);
    }
  }

  async function previewTrack(channelId) {
    await ensureChannelProgramLoaded(channelId);
    await ensureAudioRunning();
    sendRawMidi([midi_ch_cmds.note_on | channelId, DEFAULT_NOTE, 108]);
    setTimeout(() => {
      sendRawMidi([midi_ch_cmds.note_off | channelId, DEFAULT_NOTE, 0]);
    }, 320);
  }

  async function queryChannelState(channelId) {
    try {
      const response = await runtimeRef.current.apath?.querySpState(channelId);
      setQueryResponse(response ?? null);
      appendLog(`Fetched synth state for channel ${channelId + 1}.`);
    } catch (queryError) {
      appendLog(`Unable to query channel ${channelId + 1}: ${getErrorMessage(queryError)}`);
    }
  }

  async function saveZoneEdits(channelId, values) {
    const track = channelsStateRef.current[channelId];
    if (!track?.zone) {
      return;
    }
    const payload = new Int16Array(values.map((value) => Number(value) || 0));
    runtimeRef.current.apath?.spinner.port.postMessage({
      arr: payload,
      update: [track.presetId, track.zone.ref],
    });
    await runtimeRef.current.apath?.subscribeNextMsg(
      (data) => data.zack === "update" && data.ref === track.zone.ref
    );
    patchChannel(channelId, {
      zone: {
        ...track.zone,
        arr: payload,
      },
    });
    setEditingZoneChannel(null);
    appendLog(`Updated zone ${track.zone.ref} on channel ${channelId + 1}.`);
  }

  async function onHardwareKeyboardDown(channelId, note, velocity = 100) {
    await ensureChannelProgramLoaded(channelId);
    sendRawMidi([midi_ch_cmds.note_on | channelId, note, velocity]);
  }

  function onHardwareKeyboardUp(channelId, note) {
    sendRawMidi([midi_ch_cmds.note_off | channelId, note, 0]);
  }

  useEffect(() => {
    const keyLayout = ["a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j"];
    const heldKeys = new Map();

    const handleKeyDown = async (event) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)
      ) {
        return;
      }
      const index = keyLayout.indexOf(event.key.toLowerCase());
      if (index < 0 || heldKeys.has(event.key)) {
        return;
      }
      heldKeys.set(event.key, 48 + index);
      await ensureAudioRunning();
      await onHardwareKeyboardDown(activeChannel, 48 + index);
    };

    const handleKeyUp = (event) => {
      const note = heldKeys.get(event.key);
      if (note == null) {
        return;
      }
      heldKeys.delete(event.key);
      onHardwareKeyboardUp(activeChannel, note);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [activeChannel]);

  useEffect(() => {
    let cancelled = false;

    const handleWindowError = (event) => {
      appendLog(`Runtime error: ${event.message}`);
    };
    const handleUnhandledRejection = (event) => {
      appendLog(`Unhandled rejection: ${getErrorMessage(event.reason)}`);
    };

    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    async function init() {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        setError("Web Audio is not available in this browser.");
        setStatus("Audio unavailable.");
        return;
      }

      const ctx = new AudioContextClass({ sampleRate: 44100 });
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
      runtimeRef.current.unsubscribePort = apath.observeMessages((data) => {
        if (data.queryResponse) {
          setQueryResponse(data.queryResponse);
        }
        if (data.rend_summary) {
          setSummary(data.rend_summary);
          const now = performance.now();
          if (now - lastMeterUpdateRef.current > 80) {
            lastMeterUpdateRef.current = now;
            setChannels((current) =>
              current.map((track, index) => ({
                ...track,
                amp: Math.sqrt(data.rend_summary.rms?.[index] ?? 0),
              }))
            );
          }
        }
      });

      runtimeRef.current.channels = CHANNEL_IDS.map((channelId) =>
        createChannel(channelId, null, apath, {
          onProgramLoaded: ({ name, presetId, zone, bankId }) => {
            patchChannel(channelId, {
              loaded: true,
              name,
              presetId,
              bankId,
              zone,
            });
          },
          onProgramMissing: ({ bankId }) => {
            patchChannel(channelId, {
              loaded: false,
              bankId,
            });
          },
          onCCChange: ({ cc, value, bankId }) => {
            if (cc === midi_effects.volumecoarse) {
              patchChannel(channelId, { volume: value });
            } else if (cc === midi_effects.pancoarse) {
              patchChannel(channelId, { pan: value });
            } else if (cc === midi_effects.expressioncoarse) {
              patchChannel(channelId, { expression: value });
            }
            patchChannel(channelId, { bankId });
          },
          onKeyOn: ({ key, activeNotes, zone }) => {
            patchChannel(channelId, {
              active: true,
              activeNotes,
              lastNote: key,
              zone: zone ?? channelsStateRef.current[channelId].zone,
            });
          },
          onKeyOff: ({ activeNotes }) => {
            patchChannel(channelId, {
              active: activeNotes > 0,
              activeNotes,
            });
          },
        })
      );

      eventPipe.onmessage(async (message) => {
        const midi = normalizeMidiMessage(message);
        if (!midi) {
          return;
        }
        const [cmd, channelId, value1, value2] = midi;
        const channel = runtimeRef.current.channels[channelId];
        if (!channel) {
          return;
        }

        switch (cmd) {
          case midi_ch_cmds.continuous_change:
            channel.setCC({ cc: value1, value: value2 });
            runtimeRef.current.apath?.spinner.port.postMessage(midi);
            break;
          case midi_ch_cmds.change_program: {
            const fallbackBank = channelId === DRUMSCHANNEL ? 128 : 0;
            const bankId = value2 || channel.getBankId() || fallbackBank;
            await channel.setProgram(value1, bankId);
            break;
          }
          case midi_ch_cmds.note_on:
            if (value2 === 0) {
              channel.keyOff(value1, value2);
            } else {
              await ensureChannelProgramLoaded(channelId);
              channel.keyOn(value1, value2);
            }
            break;
          case midi_ch_cmds.note_off:
            channel.keyOff(value1, value2);
            break;
          case midi_ch_cmds.pitchbend:
          default:
            runtimeRef.current.apath?.spinner.port.postMessage(midi);
            break;
        }
      });

      setIsReady(true);
      setStatus("Engine ready.");
      appendLog("Audio engine initialized.");
      await loadSf2(DEFAULT_SF2);
      if (defaultMidis[0]) {
        await loadMidiFromUrl(defaultMidis[0].Url, defaultMidis[0].Name);
      }
      // Test hook: default MIDI is loaded and sequencer tracks are ready
      window.__sf2rendMidiLoaded = true;
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
      runtimeRef.current.unsubscribePort?.();
      timerWorker.terminate();
      if (runtimeRef.current.ctx) {
        runtimeRef.current.ctx.close();
      }
    };
  }, []);

  // Timer-worker-driven MIDI playback (restored from old Sequencer):
  // when the timer ticks, dispatch due MIDI events to the worklet via eventPipe.
  useEffect(() => {
    if (!midiInfo?.tracks) {
      playbackTracksRef.current = [];
      tempoEventsRef.current = [];
      return;
    }
    // Deep-clone tracks for playback (so we can shift events off)
    playbackTracksRef.current = midiInfo.tracks.map((track) =>
      track.map((event) => ({ ...event }))
    );
    tempoEventsRef.current = (midiInfo.tempos || []).map((t) => ({ ...t }));
    timerWorker.postMessage({ cmd: "reset" });
    // Send time base to timer worker (ppqn, tempo, time signature)
    timerWorker.postMessage({
      tm: {
        ppqn: midiInfo.division,
        msqn: midiInfo.tempos?.[0]?.tempo || 500000,
        ts: midiInfo.time_base?.relative_ts,
        ts1: midiInfo.time_base?.numerator,
        ts2: midiInfo.time_base?.denum,
      },
    });

    const onMessage = ({ data }) => {
      if (typeof data.ticks !== "number") {
        // Update clock display
        if (typeof data.clock === "number") {
          const totalSecs = Math.floor(data.clock / 1000);
          const mins = Math.floor(totalSecs / 60);
          const secs = totalSecs % 60;
          setClockText(`${mins}:${String(secs).padStart(2, "0")}`);
        }
        return;
      }
      const eventPipe = runtimeRef.current.eventPipe;
      playbackTracksRef.current.forEach((track) => {
        while (track.length && track[0].t <= data.ticks) {
          const event = track.shift();
          if (event.channel) {
            eventPipe?.postMessage(event.channel);
          }
        }
      });
    };
    timerWorker.onmessage = onMessage;
    return () => {
      timerWorker.onmessage = null;
    };
  }, [midiInfo, timerWorker]);

  useEffect(() => {
    fetchmidilist()
      .then((remoteChoices) => {
        setMidiChoices(mergeMidiChoices(defaultMidis, remoteChoices));
      })
      .catch(() => {
        setMidiChoices(defaultMidis);
      });
  }, []);

  const activeTrack = channels[activeChannel] ?? channels[0];
  const filteredPrograms = programOptions.filter(({ presetId }) =>
    activeChannel === DRUMSCHANNEL ? presetId >= 128 : presetId < 128
  );
  const midiStats = midiInfo
    ? {
        tracks: midiInfo.ntracks,
        presets: midiInfo.presets.length,
        ppqn: midiInfo.division,
      }
    : null;
  const editingTrack =
    editingZoneChannel == null ? null : channels[editingZoneChannel];

  return (
    <main className="device">
      <header className="transport">
        <div className="side">
          <div className="brand">sf2rend</div>
          <button
            className="chip icon tip"
            type="button"
            data-tip="Choose SoundFont"
            title="Choose SoundFont"
            aria-label="Choose SoundFont"
            onClick={() => setOpenModal("sf-modal")}
          >
            <i className="fa-solid fa-compact-disc"></i>
          </button>
          <button
            className="chip icon tip"
            type="button"
            data-tip="Choose MIDI file"
            title="Choose MIDI file"
            aria-label="Choose MIDI file"
            onClick={() => setOpenModal("midi-modal")}
          >
            <i className="fa-solid fa-list"></i>
          </button>
          <label
            className="chip icon file tip"
            data-tip="Import a MIDI file"
            title="Import a MIDI file"
            aria-label="Import a MIDI file"
          >
            <i className="fa-solid fa-file-import"></i>
            <input
              type="file"
              accept=".mid,.midi"
              aria-label="Import a MIDI file"
              title="Import a MIDI file"
              onChange={(event) => loadMidiFromFile(event.target.files?.[0])}
            />
          </label>
          <button
            className="chip icon tip"
            type="button"
            data-tip="Choose MIDI input"
            title="Choose MIDI input"
            aria-label="Choose MIDI input"
            onClick={() => setOpenModal("input-modal")}
          >
            <i className="fa-solid fa-plug"></i>
          </button>
          <button
            className="chip icon tip"
            type="button"
            data-tip="Refresh MIDI inputs"
            title="Refresh MIDI inputs"
            aria-label="Refresh MIDI inputs"
            onClick={() => refreshMidiInputs()}
          >
            <i className="fa-solid fa-rotate"></i>
          </button>
          <label className="gain-wrap tip" data-tip="Master gain" title="Master gain">
            <i className="fa-solid fa-volume-high"></i>
            <input
              className="gain"
              type="range"
              min="0"
              max="160"
              value={masterGain}
              aria-label="Master gain"
              title="Master gain"
              onChange={(event) => updateMasterGain(event.target.value)}
            />
          </label>
        </div>
        <div className="play">
          <button
            className="chip icon tip"
            type="button"
            data-tip="Rewind"
            aria-label="Rewind"
            title="Rewind"
            onClick={() => transportCommand("rwd")}
          >
            <i className="fa-solid fa-backward"></i>
          </button>
          <button
            className={`chip icon tip${isPlaying ? " on" : ""}`}
            type="button"
            data-tip={isPlaying ? "Pause playback" : "Start playback"}
            aria-label={isPlaying ? "Pause playback" : "Start playback"}
            title={isPlaying ? "Pause playback" : "Start playback"}
            onClick={() => transportCommand(isPlaying ? "stop" : "start")}
          >
            <i className={isPlaying ? "fa-solid fa-pause" : "fa-solid fa-play"}></i>
          </button>
          <button
            className="chip icon tip"
            type="button"
            data-tip="Fast forward"
            aria-label="Fast forward"
            title="Fast forward"
            onClick={() => transportCommand("fwd")}
          >
            <i className="fa-solid fa-forward"></i>
          </button>
          <div className="readout">
            <b>{clockText}</b>
            <span>{barText}</span>
          </div>
        </div>
        <div className="side end">
          <input
            className="num tip"
            type="number"
            value={bpm}
            data-tip="Tempo in BPM"
            aria-label="Tempo in BPM"
            title="Tempo in BPM"
            onChange={(event) => setBpm(event.target.value)}
          />
          <input
            className="num tip"
            type="number"
            value={beatsPerBar}
            data-tip="Beats per bar"
            aria-label="Beats per bar"
            title="Beats per bar"
            onChange={(event) => setBeatsPerBar(event.target.value)}
          />
          <span className="slash">/</span>
          <input
            className="num tip"
            type="number"
            value={beatUnit}
            data-tip="Beat unit"
            aria-label="Beat unit"
            title="Beat unit"
            onChange={(event) => setBeatUnit(event.target.value)}
          />
        </div>
      </header>

      <section className="stage" id="stage">
        <div className="row ruler-row">
          <div className="head"></div>
          <div className="lane ruler">
            <span className="needle"></span>
            <i style={{ left: "8%" }}>1</i>
            <i style={{ left: "20%" }}>2</i>
            <i style={{ left: "32%" }}>3</i>
            <i style={{ left: "44%" }}>4</i>
            <i style={{ left: "56%" }}>5</i>
            <i style={{ left: "68%" }}>6</i>
            <i style={{ left: "80%" }}>7</i>
            <i style={{ left: "92%" }}>8</i>
          </div>
        </div>
        {channels.map((track) => (
          <article
            key={track.id}
            className={`row track${track.id === activeChannel ? " selected" : ""}`}
            data-ch={track.id + 1}
            onClick={(event) => {
              if (!event.target.closest("button, select, input")) {
                setActiveChannel(track.id);
              }
            }}
          >
            <div className="head">
              <div className="head-line">
                <div className="ch">CH {track.id + 1}</div>
                <select
                  aria-label="Instrument"
                  value={track.presetId ?? ""}
                  onChange={(event) => {
                    const presetId = event.target.value === "" ? null : Number(event.target.value);
                    sendProgramChange(track.id, presetId);
                  }}
                >
                  <option value="">--</option>
                  {programOptions.map((p) => (
                    <option key={p.presetId} value={p.presetId}>
                      {String(p.presetId & 0x7f).padStart(3, "0")} · {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="meta">
                {track.loaded ? "Loaded" : "Idle"} · Ready · Preset{" "}
                {track.presetId == null ? "None" : String(track.presetId & 0x7f).padStart(3, "0")}
              </div>
              <div className="head-line">
                <div className="pills">
                  <button
                    className="chip icon"
                    type="button"
                    data-mute
                    aria-label="Mute"
                    title="Mute"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleMute(track.id);
                    }}
                  >
                    <i className="fa-solid fa-volume-xmark"></i>
                  </button>
                  <button
                    className="chip icon"
                    type="button"
                    data-solo
                    aria-label="Solo"
                    title="Solo"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleSolo(track.id);
                    }}
                  >
                    <i className="fa-solid fa-headphones"></i>
                  </button>
                  <button
                    className="chip icon"
                    type="button"
                    data-edit
                    aria-label="Edit"
                    title="Edit"
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveChannel(track.id);
                      setOpenModal("edit-modal");
                    }}
                  >
                    <i className="fa-solid fa-pen"></i>
                  </button>
                </div>
              </div>
              <input
                className="vol"
                type="range"
                min="0"
                max="127"
                value={track.volume ?? 80}
                aria-label="Volume"
                onChange={(event) => sendControlChange(track.id, 7, Number(event.target.value))}
              />
            </div>
            <div className="lane">
              <span className="needle"></span>
              {track.loaded ? (
                <div className="clip">
                  {(channelNotes.byChannel[track.id] ?? []).map((note, index) => (
                    <b
                      key={index}
                      style={{
                        left: `${(note.t / channelNotes.maxT) * 100}%`,
                        width: `${Math.max((note.dur / channelNotes.maxT) * 100, 0.35)}%`,
                        top: `${((127 - note.pitch) / 127) * 100}%`,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty"></div>
              )}
            </div>
          </article>
        ))}
      </section>

      <footer className="keys">
        <p>
          Keyboard · active channel <strong>{activeChannel + 1}</strong>
          <br />
          Home row A W S E D F T G Y H U J
        </p>
        <div className="board" id="board">
          {Array.from({ length: 24 }, (_, i) => {
            const midi = 48 + i;
            const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
            const name = names[midi % 12] + (Math.floor(midi / 12) - 1);
            const black = name.includes("#");
            return (
              <button
                key={midi}
                className={`key${black ? " black" : ""}`}
                type="button"
                onMouseDown={async () => {
                  await ensureAudioRunning();
                  await onHardwareKeyboardDown(activeChannel, midi);
                }}
                onMouseUp={() => onHardwareKeyboardUp(activeChannel, midi)}
                onMouseLeave={(event) => {
                  if (event.buttons === 1) onHardwareKeyboardUp(activeChannel, midi);
                }}
              >
                {name}
              </button>
            );
          })}
        </div>
        <button
          className="chip"
          id="preview"
          type="button"
          onClick={async () => {
            await ensureAudioRunning();
            await onHardwareKeyboardDown(activeChannel, 60, 100);
            setTimeout(() => onHardwareKeyboardUp(activeChannel, 60), 300);
          }}
        >
          Preview C4
        </button>
        <button className="chip" id="inspect" type="button" onClick={() => setOpenModal("state-modal")}>
          Inspect State
        </button>
      </footer>

      <div className={`modal${openModal === "midi-modal" ? " open" : ""}`} id="midi-modal">
        <div className="sheet">
          <h2>MIDI library</h2>
          <p>Choose a file.</p>
          <div className="pick-list" id="midi-list">
            {midiChoices.map((item) => (
              <button
                key={item.Url}
                className={`chip${item.Url === selectedMidi ? " on" : ""}`}
                type="button"
                onClick={() => {
                  loadMidiFromUrl(item.Url, item.Name);
                  setOpenModal(null);
                }}
              >
                {item.Name}
              </button>
            ))}
          </div>
          <div className="actions">
            <button className="chip" data-close type="button" onClick={() => setOpenModal(null)}>
              Close
            </button>
          </div>
        </div>
      </div>

      <div className={`modal${openModal === "input-modal" ? " open" : ""}`} id="input-modal">
        <div className="sheet">
          <h2>MIDI input</h2>
          <p>Choose a device.</p>
          <div className="pick-list" id="input-list">
            <button
              className={`chip${!selectedMidiInputId ? " on" : ""}`}
              type="button"
              onClick={() => {
                connectMidiInput("");
                setOpenModal(null);
              }}
            >
              No input
            </button>
            {midiInputs.map((input) => (
              <button
                key={input.id}
                className={`chip${input.id === selectedMidiInputId ? " on" : ""}`}
                type="button"
                onClick={() => {
                  connectMidiInput(input.id);
                  setOpenModal(null);
                }}
              >
                {input.name}
              </button>
            ))}
          </div>
          <div className="actions">
            <button className="chip" data-close type="button" onClick={() => setOpenModal(null)}>
              Close
            </button>
          </div>
        </div>
      </div>

      <div className={`modal${openModal === "sf-modal" ? " open" : ""}`} id="sf-modal">
        <div className="sheet">
          <h2>SoundFont</h2>
          <p>Choose a loaded bank.</p>
          <div className="pick-list" id="sf-list">
            {sf2list.map((item) => (
              <button
                key={item}
                className={`chip${item === selectedSf2 ? " on" : ""}`}
                type="button"
                onClick={() => {
                  loadSf2(item);
                  setOpenModal(null);
                }}
              >
                {labelFromPath(item)}
              </button>
            ))}
          </div>
          <div className="actions">
            <button className="chip" data-close type="button" onClick={() => setOpenModal(null)}>
              Close
            </button>
          </div>
        </div>
      </div>

      <div className={`modal${openModal === "edit-modal" ? " open" : ""}`} id="edit-modal">
        <div className="sheet">
          <h2>Channel {activeChannel + 1}</h2>
          <p>
            {channels[activeChannel]?.loaded ? "Loaded" : "Idle"} · Ready · Last note{" "}
            {channels[activeChannel]?.lastNote == null ? "--" : midiNoteName(channels[activeChannel].lastNote)}
          </p>
          <div className="grid">
            <div className="block">
              <h3>Mix</h3>
              {[
                ["Volume", 7, channels[activeChannel]?.volume ?? 100],
                ["Pan", 10, channels[activeChannel]?.pan ?? 64],
                ["Expression", 11, channels[activeChannel]?.expression ?? 127],
              ].map(([label, cc, value]) => (
                <div className="mix" key={label}>
                  <span>{label}</span>
                  <input
                    type="range"
                    min="0"
                    max="127"
                    value={value}
                    onChange={(event) => sendControlChange(activeChannel, cc, Number(event.target.value))}
                  />
                  <b>{value}</b>
                </div>
              ))}
            </div>
            <div className="block">
              <h3>Filter</h3>
              {[
                ["Cutoff", 74, 6000, 12000],
                ["Resonance", 71, 0, 120],
              ].map(([label, cc, value, max]) => (
                <div className="mix" key={label}>
                  <span>{label}</span>
                  <input
                    type="range"
                    min="0"
                    max={max}
                    value={value}
                    onChange={(event) => sendControlChange(activeChannel, cc, Number(event.target.value))}
                  />
                  <b>{value}</b>
                </div>
              ))}
            </div>
          </div>
          <div className="actions">
            <button className="chip" data-close type="button" onClick={() => setOpenModal(null)}>
              Cancel
            </button>
            <button
              className="chip"
              id="open-zone"
              type="button"
              onClick={() => {
                setEditingZoneChannel(activeChannel);
                setOpenModal("zone-modal");
              }}
            >
              Edit Zone
            </button>
            <button className="chip primary" data-close type="button" onClick={() => setOpenModal(null)}>
              Save
            </button>
          </div>
        </div>
      </div>

      <div className={`modal${openModal === "zone-modal" ? " open" : ""}`} id="zone-modal">
        <div className="sheet">
          <h2>Zone editor</h2>
          <p>
            Channel {activeChannel + 1} ·{" "}
            {channels[activeChannel]?.zone
              ? `${channels[activeChannel].zone.arr.length} raw SoundFont generators`
              : "No zone loaded"}
          </p>
          <div className="gens">
            {channels[activeChannel]?.zone
              ? Array.from(channels[activeChannel].zone.arr).map((v, i) => (
                  <label key={i}>
                    Gen {i}
                    <input defaultValue={v} />
                  </label>
                ))
              : null}
          </div>
          <div className="actions">
            <button className="chip" data-close type="button" onClick={() => setOpenModal(null)}>
              Cancel
            </button>
            <button className="chip primary" data-close type="button" onClick={() => setOpenModal(null)}>
              Save Zone
            </button>
          </div>
        </div>
      </div>

      <div className={`modal${openModal === "state-modal" ? " open" : ""}`} id="state-modal">
        <div className="sheet">
          <h2>Inspect state</h2>
          <p>Logs, metadata, and synth state for the active channel.</p>
          <div className="tabs">
            {[
              ["log", "Session log"],
              ["meta", "SoundFont metadata"],
              ["sum", "Synth summary"],
              ["query", "Channel query"],
            ].map(([id, label]) => (
              <button
                key={id}
                className={`chip${stateTab === id ? " on" : ""}`}
                type="button"
                data-tab={id}
                onClick={() => setStateTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="log" id="state-body">
            {stateTab === "log" && (logs.join("\n") || "No log messages yet.")}
            {stateTab === "meta" && (sf2Meta.join("\n") || "No metadata loaded.")}
            {stateTab === "sum" && (summary ? JSON.stringify(summary, null, 2) : "No summary.")}
            {stateTab === "query" && (queryResponse ? JSON.stringify(queryResponse, null, 2) : "No query response.")}
          </div>
          <div className="actions">
            <button className="chip primary" data-close type="button" onClick={() => setOpenModal(null)}>
              Close
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}


function TrackCard({ accent, active, onMute, onSelect, onSolo, track }) {
  return (
    <article
      className={`track-card${active ? " track-card-active" : ""}${
        track.loaded ? "" : " track-card-muted"
      }`}
      style={{ "--track-accent": accent }}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="track-card-top">
        <div>
          <div className="track-number">CH {track.id + 1}</div>
          <h3>{track.name || "Unassigned"}</h3>
        </div>
        <div className="track-meta">
          <span>{track.loaded ? "Loaded" : "Idle"}</span>
          <span>{track.activeNotes ? `${track.activeNotes} live` : "Ready"}</span>
        </div>
      </div>
      <div className="track-meter">
        <div
          className="track-meter-fill"
          style={{ width: `${Math.min(100, track.amp * 115).toFixed(1)}%` }}
        />
      </div>
      <div className="track-card-bottom">
        <div className="track-stat">
          <span>Preset</span>
          <strong>
            {track.presetId == null ? "None" : `${(track.presetId & 0x7f).toString().padStart(3, "0")}`}
          </strong>
        </div>
        <div className="track-stat">
          <span>Last Note</span>
          <strong>{track.lastNote == null ? "--" : midiNoteName(track.lastNote)}</strong>
        </div>
      </div>
      <div className="track-buttons">
        <button
          className={`button button-small${track.muted ? " button-active" : " button-secondary"}`}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onMute();
          }}
        >
          Mute
        </button>
        <button
          className={`button button-small${track.solo ? " button-active" : " button-secondary"}`}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSolo();
          }}
        >
          Solo
        </button>
      </div>
    </article>
  );
}

function ControlGroup({ children, title }) {
  return (
    <section className="control-group">
      <h3>{title}</h3>
      <div className="range-grid">{children}</div>
    </section>
  );
}

function RangeControl({ label, max, min, onChange, step, value }) {
  return (
    <label className="range-control">
      <div className="range-label-row">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function AudioScope({ getData, kind, title }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let rafId = 0;

    function draw() {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      const ctx = canvas.getContext("2d");
      const data = Array.from(getData() ?? []);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#0f141f";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      if (!data.length) {
        ctx.fillStyle = "rgba(245, 231, 201, 0.66)";
        ctx.font = "14px 'Avenir Next', 'Trebuchet MS', sans-serif";
        ctx.fillText("Waiting for audio...", 16, 28);
        rafId = requestAnimationFrame(draw);
        return;
      }

      if (kind === "waveform") {
        ctx.strokeStyle = "#ffc978";
        ctx.lineWidth = 2;
        ctx.beginPath();
        data.forEach((sample, index) => {
          const x = (index / Math.max(1, data.length - 1)) * canvas.width;
          const y = canvas.height / 2 + sample * (canvas.height * 0.35);
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.stroke();
      } else {
        const width = canvas.width / data.length;
        ctx.fillStyle = "#7bd6c2";
        data.forEach((sample, index) => {
          const height = Math.max(2, Math.min(canvas.height, sample * canvas.height));
          ctx.fillRect(index * width, canvas.height - height, width - 1, height);
        });
      }

      rafId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(rafId);
  }, [getData, kind]);

  return (
    <div className="scope-card">
      <div className="scope-title">{title}</div>
      <canvas className="scope-canvas" ref={canvasRef} width="560" height="180" />
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="summary-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusPill({ label, tone, value }) {
  return (
    <div className={`status-pill status-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PianoKeyboard({ activeChannel, onNoteOn, onNoteOff }) {
  const keys = Array.from({ length: 24 }, (_, index) => {
    const midi = 48 + index;
    return {
      midi,
      note: midiNoteName(midi),
      black: [1, 3, 6, 8, 10].includes(midi % 12),
    };
  });

  return (
    <div className="keyboard-wrap">
      <div className="keyboard-caption">Active channel: {activeChannel + 1}</div>
      <div className="keyboard">
        {keys.map((key) => (
          <button
            className={`piano-key${key.black ? " piano-key-black" : " piano-key-white"}`}
            key={key.midi}
            type="button"
            onMouseDown={() => onNoteOn(key.midi)}
            onMouseUp={() => onNoteOff(key.midi)}
            onMouseLeave={(event) => {
              if (event.buttons === 1) {
                onNoteOff(key.midi);
              }
            }}
          >
            {key.note}
          </button>
        ))}
      </div>
    </div>
  );
}

function ZoneEditorModal({ onClose, onSave, track }) {
  const [values, setValues] = useState(() => Array.from(track.zone.arr));

  useEffect(() => {
    setValues(Array.from(track.zone.arr));
  }, [track]);

  return (
    <div className="zone-modal-backdrop" onClick={onClose}>
      <div
        className="zone-modal panel"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="panel-header">
          <div>
            <div className="panel-kicker">Zone Editor</div>
            <h2>
              Channel {track.id + 1} · Zone {track.zone.ref}
            </h2>
          </div>
          <p>Direct access to the 60 raw SoundFont zone generators.</p>
        </div>
        <div className="zone-grid">
          {attributeKeys.map((key, index) => (
            <label className="zone-field" key={key}>
              <span>{key}</span>
              <input
                type="number"
                value={values[index] ?? 0}
                onChange={(event) => {
                  const nextValues = values.slice();
                  nextValues[index] = event.target.value;
                  setValues(nextValues);
                }}
              />
            </label>
          ))}
        </div>
        <div className="zone-actions">
          <button className="button button-secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button" type="button" onClick={() => onSave(values)}>
            Save Zone
          </button>
        </div>
      </div>
    </div>
  );
}

function buildInitialTrack(channelId) {
  return {
    id: channelId,
    name: channelId === DRUMSCHANNEL ? "Drum Kit" : `Channel ${channelId + 1}`,
    presetId: null,
    bankId: channelId === DRUMSCHANNEL ? 128 : 0,
    zone: null,
    loaded: false,
    muted: false,
    solo: false,
    amp: 0,
    active: false,
    activeNotes: 0,
    lastNote: null,
    ...CONTROL_DEFAULTS,
  };
}

function buildLocalMidiChoices() {
  return mfilelist.map((url) => ({
    Name: labelFromPath(url),
    Url: url,
  }));
}

function getChannelNotes(midiInfo) {
  const byChannel = Array.from({ length: 16 }, () => []);
  let maxT = 0;
  const noteEvents = [];
  midiInfo?.tracks?.forEach((track) => {
    track.forEach((event) => {
      if (!event.channel) {
        return;
      }
      const [status, pitch, velocity] = event.channel;
      const cmd = status & 0xf0;
      if (cmd === midi_ch_cmds.note_on || cmd === midi_ch_cmds.note_off) {
        const t = event.t ?? 0;
        noteEvents.push({ t, cmd, channelId: status & 0x0f, pitch, velocity });
        if (t > maxT) {
          maxT = t;
        }
      }
    });
  });
  noteEvents.sort((x, y) => x.t - y.t);
  const pending = new Map();
  noteEvents.forEach((event) => {
    const key = event.channelId * 128 + event.pitch;
    if (event.cmd === midi_ch_cmds.note_on && event.velocity > 0) {
      pending.set(key, event.t);
    } else {
      const start = pending.get(key);
      if (start != null) {
        pending.delete(key);
        byChannel[event.channelId].push({
          t: start,
          pitch: event.pitch,
          dur: Math.max(event.t - start, 1),
        });
      }
    }
  });
  pending.forEach((start, key) => {
    byChannel[Math.floor(key / 128)].push({ t: start, pitch: key % 128, dur: 24 });
  });
  return { byChannel, maxT: maxT || 1 };
}

function getNoteChannels(midiInfo) {
  const channels = new Set();

  midiInfo.tracks.forEach((track) => {
    track.forEach((event) => {
      if (!event.channel) {
        return;
      }
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

function normalizeMidiMessage(message) {
  const data = Array.from(message ?? []);
  if (data.length >= 3 && data[0] >= 0x80) {
    const [status, value1 = 0, value2 = 0] = data;
    return [status & 0xf0, status & 0x0f, value1, value2];
  }
  if (data.length >= 4) {
    return [data[0], data[1], data[2] ?? 0, data[3] ?? 0];
  }
  return null;
}

function labelFromPath(path) {
  return decodeURI(path.split("/").pop() ?? path);
}

function midiNoteName(midi) {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const note = names[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${note}${octave}`;
}

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error ?? "Unknown error");
}
