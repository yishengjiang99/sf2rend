import React, { startTransition, useEffect, useRef, useState } from "react";
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
  const [timerWorker] = useState(() => new Worker("dist/timer.js"));
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

  channelsStateRef.current = channels;

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
    await runtimeRef.current.channels[0].setProgram(0, 0);
    await runtimeRef.current.channels[DRUMSCHANNEL].setProgram(0, 128);
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

      const loadedTracks = channelsStateRef.current.filter(
        (track) => track.loaded && track.presetId != null
      );
      if (loadedTracks.length) {
        for (const track of loadedTracks) {
          await runtimeRef.current.channels[track.id].setProgram(
            track.presetId & 0x7f,
            track.bankId
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

    for (const channelId of noteChannels) {
      if (initialPresetPerChannel.has(channelId)) {
        continue;
      }
      const channel = runtimeRef.current.channels[channelId];
      const fallbackBank = channelId === DRUMSCHANNEL ? 128 : 0;
      await channel.setProgram(0, fallbackBank);
    }

    for (const [channelId, preset] of initialPresetPerChannel) {
      const channel = runtimeRef.current.channels[channelId];
      const fallbackBank = channelId === DRUMSCHANNEL ? 128 : 0;
      const bankId = channel.getBankId() || fallbackBank;
      await channel.setProgram(preset.pid, bankId);
    }

    if (noteChannels.includes(DRUMSCHANNEL) && !initialPresetPerChannel.has(DRUMSCHANNEL)) {
      await runtimeRef.current.channels[DRUMSCHANNEL].setProgram(0, 128);
    }
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
    <div className="app-shell">
      <div className="app-backdrop" />
      <header className="topbar panel">
        <div className="brand">
          <div className="brand-kicker">SoundFont Workstation</div>
          <h1>sf2rend</h1>
          <p>
            React-driven MIDI rendering, hardware input, and live SoundFont editing
            in one workspace.
          </p>
        </div>
        <div className="topbar-controls">
          <label className="toolbar-field">
            <span>SoundFont</span>
            <select
              className="toolbar-input"
              value={selectedSf2}
              onChange={(event) => loadSf2(event.target.value)}
            >
              {sf2list.map((item) => (
                <option key={item} value={item}>
                  {labelFromPath(item)}
                </option>
              ))}
            </select>
          </label>
          <label className="toolbar-field">
            <span>MIDI Library</span>
            <select
              className="toolbar-input"
              value={selectedMidi}
              onChange={(event) =>
                loadMidiFromUrl(
                  event.target.value,
                  midiChoices.find((item) => item.Url === event.target.value)?.Name
                )
              }
            >
              {midiChoices.map((item) => (
                <option key={item.Url} value={item.Url}>
                  {item.Name}
                </option>
              ))}
            </select>
          </label>
          <label className="toolbar-field file-picker">
            <span>Import MIDI</span>
            <input
              className="visually-hidden"
              type="file"
              accept=".mid,.midi"
              onChange={(event) => loadMidiFromFile(event.target.files?.[0])}
            />
            <span className="button button-secondary">Choose File</span>
          </label>
          <label className="toolbar-field">
            <span>MIDI Input</span>
            <div className="toolbar-inline">
              <select
                className="toolbar-input"
                value={selectedMidiInputId}
                onChange={(event) => connectMidiInput(event.target.value)}
              >
                <option value="">No input</option>
                {midiInputs.map((input) => (
                  <option key={input.id} value={input.id}>
                    {input.name}
                  </option>
                ))}
              </select>
              <button
                className="button button-ghost"
                type="button"
                onClick={() => refreshMidiInputs()}
              >
                Refresh
              </button>
            </div>
          </label>
          <label className="toolbar-field">
            <span>Master Gain</span>
            <input
              className="toolbar-range"
              type="range"
              min="0"
              max="160"
              step="1"
              value={masterGain}
              onChange={(event) => updateMasterGain(event.target.value)}
            />
            <span className="toolbar-value">{masterGain}%</span>
          </label>
        </div>
      </header>

      <section className="status-strip panel">
        <div className="status-cluster">
          <StatusPill label="Engine" value={status} tone={error ? "danger" : "ok"} />
          <StatusPill label="Audio" value={audioState} tone={audioState === "running" ? "ok" : "muted"} />
          <StatusPill
            label="Build"
            value={isReady ? "ready" : "loading"}
            tone={isReady ? "ok" : "muted"}
          />
          {midiStats ? (
            <StatusPill
              label="MIDI"
              value={`${midiStats.tracks} tracks · ${midiStats.ppqn} PPQN`}
              tone="muted"
            />
          ) : null}
        </div>
        {error ? <div className="status-error">{error}</div> : null}
      </section>

      <div className="workspace-layout">
        <aside className="sidebar panel">
          <div className="panel-header">
            <div>
              <div className="panel-kicker">Mixer</div>
              <h2>Channels</h2>
            </div>
            <p>{midiTitle}</p>
          </div>
          <div className="track-list">
            {channels.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                accent={CHANNEL_ACCENTS[track.id]}
                active={track.id === activeChannel}
                onSelect={() => setActiveChannel(track.id)}
                onMute={() => toggleMute(track.id)}
                onSolo={() => toggleSolo(track.id)}
              />
            ))}
          </div>
        </aside>

        <main className="workspace">
          <section className="panel hero-panel">
            <div className="panel-header">
              <div>
                <div className="panel-kicker">Timeline</div>
                <h2>{midiTitle}</h2>
              </div>
              <p>
                Play, scrub, and inspect the loaded MIDI arrangement without leaving
                the main screen.
              </p>
            </div>
            {midiInfo && runtimeRef.current.eventPipe ? (
              <Sequencer
                key={`${midiTitle}-${sequenceVersion}`}
                activeChannel={activeChannel}
                eventPipe={runtimeRef.current.eventPipe}
                midiInfo={midiInfo}
                onTransportGesture={ensureAudioRunning}
                timerWorker={timerWorker}
                title={midiTitle}
              />
            ) : (
              <div className="empty-state">
                Drop in a MIDI file or choose one from the library to light up the
                transport.
              </div>
            )}
          </section>

          <div className="workspace-grid">
            <section className="panel inspector-panel">
              <div className="panel-header">
                <div>
                  <div className="panel-kicker">Inspector</div>
                  <h2>
                    Channel {activeTrack.id + 1}
                    {activeTrack.id === DRUMSCHANNEL ? " · Drums" : ""}
                  </h2>
                </div>
                <p>{activeTrack.name || "Choose a loaded channel to edit it."}</p>
              </div>

              <div className="inspector-grid">
                <label className="toolbar-field">
                  <span>Program</span>
                  <select
                    className="toolbar-input"
                    value={activeTrack.presetId ?? ""}
                    onChange={(event) =>
                      sendProgramChange(activeTrack.id, Number(event.target.value))
                    }
                  >
                    <option value="" disabled>
                      Select a preset
                    </option>
                    {filteredPrograms.map((item) => (
                      <option key={item.presetId} value={item.presetId}>
                        {(item.presetId & 0x7f).toString().padStart(3, "0")} · {item.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="control-actions">
                  <button
                    className="button"
                    type="button"
                    onClick={() => previewTrack(activeTrack.id)}
                  >
                    Preview C4
                  </button>
                  <button
                    className="button button-secondary"
                    type="button"
                    disabled={!activeTrack.zone}
                    onClick={() => setEditingZoneChannel(activeTrack.id)}
                  >
                    Edit Zone
                  </button>
                  <button
                    className="button button-ghost"
                    type="button"
                    onClick={() => queryChannelState(activeTrack.id)}
                  >
                    Inspect State
                  </button>
                </div>

                <ControlGroup title="Mix">
                  <RangeControl
                    label="Volume"
                    min={0}
                    max={127}
                    step={1}
                    value={activeTrack.volume}
                    onChange={(value) => updateTrackControl(activeTrack.id, "volume", value)}
                  />
                  <RangeControl
                    label="Pan"
                    min={0}
                    max={127}
                    step={1}
                    value={activeTrack.pan}
                    onChange={(value) => updateTrackControl(activeTrack.id, "pan", value)}
                  />
                  <RangeControl
                    label="Expression"
                    min={0}
                    max={127}
                    step={1}
                    value={activeTrack.expression}
                    onChange={(value) =>
                      updateTrackControl(activeTrack.id, "expression", value)
                    }
                  />
                </ControlGroup>

                <ControlGroup title="Filter">
                  <RangeControl
                    label="Cutoff"
                    min={0}
                    max={12000}
                    step={10}
                    value={activeTrack.filterFc}
                    onChange={(value) => updateTrackControl(activeTrack.id, "filterFc", value)}
                  />
                  <RangeControl
                    label="Resonance"
                    min={0}
                    max={120}
                    step={1}
                    value={activeTrack.filterQ}
                    onChange={(value) => updateTrackControl(activeTrack.id, "filterQ", value)}
                  />
                </ControlGroup>

                <ControlGroup title="Amplitude Envelope">
                  <RangeControl
                    label="Attack"
                    min={0}
                    max={127}
                    step={1}
                    value={activeTrack.vcaAttack}
                    onChange={(value) => updateTrackControl(activeTrack.id, "vcaAttack", value)}
                  />
                  <RangeControl
                    label="Decay"
                    min={0}
                    max={127}
                    step={1}
                    value={activeTrack.vcaDecay}
                    onChange={(value) => updateTrackControl(activeTrack.id, "vcaDecay", value)}
                  />
                  <RangeControl
                    label="Sustain"
                    min={0}
                    max={127}
                    step={1}
                    value={activeTrack.vcaSustain}
                    onChange={(value) => updateTrackControl(activeTrack.id, "vcaSustain", value)}
                  />
                  <RangeControl
                    label="Release"
                    min={0}
                    max={127}
                    step={1}
                    value={activeTrack.vcaRelease}
                    onChange={(value) => updateTrackControl(activeTrack.id, "vcaRelease", value)}
                  />
                </ControlGroup>

                <ControlGroup title="Filter Envelope">
                  <RangeControl
                    label="Attack"
                    min={0}
                    max={127}
                    step={1}
                    value={activeTrack.vcfAttack}
                    onChange={(value) => updateTrackControl(activeTrack.id, "vcfAttack", value)}
                  />
                  <RangeControl
                    label="Decay"
                    min={0}
                    max={127}
                    step={1}
                    value={activeTrack.vcfDecay}
                    onChange={(value) => updateTrackControl(activeTrack.id, "vcfDecay", value)}
                  />
                  <RangeControl
                    label="Sustain"
                    min={0}
                    max={127}
                    step={1}
                    value={activeTrack.vcfSustain}
                    onChange={(value) => updateTrackControl(activeTrack.id, "vcfSustain", value)}
                  />
                  <RangeControl
                    label="Release"
                    min={0}
                    max={127}
                    step={1}
                    value={activeTrack.vcfRelease}
                    onChange={(value) => updateTrackControl(activeTrack.id, "vcfRelease", value)}
                  />
                </ControlGroup>
              </div>
            </section>

            <section className="panel analysis-panel">
              <div className="panel-header">
                <div>
                  <div className="panel-kicker">Output</div>
                  <h2>Analysis</h2>
                </div>
                <p>Live waveform and spectrum views pulled straight from the synth graph.</p>
              </div>
              <div className="scope-grid">
                <AudioScope
                  kind="spectrum"
                  title="Frequency"
                  getData={() => runtimeRef.current.apath?.analysis.frequencyBins ?? []}
                />
                <AudioScope
                  kind="waveform"
                  title="Waveform"
                  getData={() => runtimeRef.current.apath?.analysis.waveForm ?? []}
                />
              </div>
              <div className="summary-grid">
                <SummaryItem
                  label="Active Notes"
                  value={channels.reduce((sum, track) => sum + track.activeNotes, 0)}
                />
                <SummaryItem
                  label="Loaded Programs"
                  value={channels.filter((track) => track.loaded).length}
                />
                <SummaryItem
                  label="SoundFont"
                  value={labelFromPath(selectedSf2)}
                />
              </div>
            </section>
          </div>

          <section className="panel console-panel">
            <div className="panel-header">
              <div>
                <div className="panel-kicker">Diagnostics</div>
                <h2>Logs, metadata, and synth state</h2>
              </div>
              <p>The old debug drawers are now folded into one React-managed console.</p>
            </div>
            <div className="console-grid">
              <details className="panel-details" open>
                <summary>Session Log</summary>
                <pre className="console-pre">{logs.join("\n") || "No log messages yet."}</pre>
              </details>
              <details className="panel-details">
                <summary>SoundFont Metadata</summary>
                <div className="meta-list">
                  {sf2Meta.length ? (
                    sf2Meta.map(([section, text]) => (
                      <div className="meta-row" key={`${section}-${text.slice(0, 12)}`}>
                        <strong>{section}</strong>
                        <span>{text}</span>
                      </div>
                    ))
                  ) : (
                    <span className="muted-copy">No metadata loaded.</span>
                  )}
                </div>
              </details>
              <details className="panel-details">
                <summary>Synth Summary</summary>
                <pre className="console-pre">
                  {summary ? JSON.stringify(summary, null, 2) : "No render summary yet."}
                </pre>
              </details>
              <details className="panel-details">
                <summary>Channel Query</summary>
                <pre className="console-pre">
                  {queryResponse
                    ? JSON.stringify(queryResponse, null, 2)
                    : "Run “Inspect State” on a channel to capture its current synth state."}
                </pre>
              </details>
            </div>
          </section>
        </main>
      </div>

      <footer className="panel keyboard-panel">
        <div className="panel-header">
          <div>
            <div className="panel-kicker">Performance</div>
            <h2>Keyboard</h2>
          </div>
          <p>Click the keys or use the home row: A W S E D F T G Y H U J.</p>
        </div>
        <PianoKeyboard
          activeChannel={activeChannel}
          onNoteOn={async (note) => {
            await ensureAudioRunning();
            await onHardwareKeyboardDown(activeChannel, note);
          }}
          onNoteOff={(note) => onHardwareKeyboardUp(activeChannel, note)}
        />
      </footer>

      {editingTrack?.zone ? (
        <ZoneEditorModal
          track={editingTrack}
          onClose={() => setEditingZoneChannel(null)}
          onSave={(values) => saveZoneEdits(editingTrack.id, values)}
        />
      ) : null}
    </div>
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
