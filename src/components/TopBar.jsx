import React from "react";
import Transport from "./Transport.jsx";

function StatusItem({ tone, value, title, label }) {
  return (
    <span
      className={`status-item status-${tone}`}
      title={title ?? value}
      aria-label={label ? `${label}: ${value}` : value}
      role="status"
    >
      <span className="status-dot" aria-hidden="true" />
      <span className="status-value">{value}</span>
    </span>
  );
}

export default function TopBar({ engine }) {
  const {
    status,
    error,
    setError,
    audioState,
    ready,
    midiStats,
    selectedSf2,
    loadSf2,
    midiChoices,
    selectedMidi,
    loadMidiFromUrl,
    loadMidiFromFile,
    midiInputs,
    selectedMidiInputId,
    connectMidiInput,
    refreshMidiInputs,
    masterGain,
    setMasterGain,
    timerState,
    now,
    tm,
    runTransportCommand,
    setBpm,
    midiTitle,
  } = engine;

  const engineTone = error ? "danger" : ready ? "ok" : "muted";
  const engineValue = error ? "error" : ready ? "ready" : "loading";

  return (
    <header className="topbar">
      <div className="topbar-row topbar-row-1">
        <div className="brand">sf2rend</div>
        <div className="file-controls">
          <select
            className="ctl"
            value={selectedSf2}
            aria-label="SoundFont"
            onChange={(event) => loadSf2(event.target.value)}
          >
            {(engine.sf2list ?? []).map((item) => (
              <option key={item} value={item}>
                {item.split("/").pop()}
              </option>
            ))}
          </select>
          <select
            className="ctl"
            value={selectedMidi}
            aria-label="MIDI file"
            onChange={(event) => {
              const choice = midiChoices.find(
                (item) => item.Url === event.target.value
              );
              loadMidiFromUrl(event.target.value, choice?.Name);
            }}
          >
            <option value="" disabled>
              MIDI…
            </option>
            {midiChoices.map((item) => (
              <option key={item.Url} value={item.Url}>
                {item.Name}
              </option>
            ))}
          </select>
          <label className="ctl-file">
            <input
              className="visually-hidden"
              type="file"
              accept=".mid,.midi"
              aria-label="Import MIDI file"
              onChange={(event) => loadMidiFromFile(event.target.files?.[0])}
            />
            <span className="btn btn-ghost">Import</span>
          </label>
          <select
            className="ctl"
            value={selectedMidiInputId}
            aria-label="MIDI input device"
            onChange={(event) => connectMidiInput(event.target.value)}
          >
            <option value="">MIDI in…</option>
            {midiInputs.map((input) => (
              <option key={input.id} value={input.id}>
                {input.name}
              </option>
            ))}
          </select>
          <button
            className="btn btn-ghost btn-icon"
            type="button"
            aria-label="Refresh MIDI inputs"
            title="Refresh MIDI inputs"
            onClick={() => refreshMidiInputs()}
          >
            ⟳
          </button>
        </div>
        <label className="master-gain">
          <span>Master</span>
          <input
            type="range"
            min="0"
            max="160"
            step="1"
            value={masterGain}
            aria-label="Master gain"
            onChange={(event) => setMasterGain(event.target.value)}
          />
          <span className="tnum">{masterGain}%</span>
        </label>
        <div className="status-toolbar" role="toolbar" aria-label="Status">
          <StatusItem
            tone={engineTone}
            value={engineValue}
            title={status + (error ? `\n${error}` : "")}
            label="Engine"
          />
          <StatusItem
            tone={audioState === "running" ? "ok" : "muted"}
            value={audioState === "running" ? "audio on" : "audio off"}
            title={`AudioContext: ${audioState}`}
            label="Audio"
          />
          <StatusItem
            tone={ready ? "ok" : "muted"}
            value={ready ? "build ready" : "building"}
            label="Build"
          />
          {midiStats ? (
            <StatusItem
              tone="muted"
              value={`${midiStats.tracks} trk · ${midiStats.ppqn} PPQN`}
              label="MIDI"
            />
          ) : null}
        </div>
      </div>
      <div className="topbar-row topbar-row-2">
        <Transport
          timerState={timerState}
          now={now}
          tm={tm}
          onCommand={runTransportCommand}
          onBpm={setBpm}
          title={midiTitle}
        />
      </div>
      {error ? (
        <div className="toast toast-error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            className="btn btn-ghost"
            aria-label="Dismiss error"
            onClick={() => setError("")}
          >
            ✕
          </button>
        </div>
      ) : null}
    </header>
  );
}
