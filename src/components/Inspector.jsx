import React, { useMemo, useState } from "react";
import { GEN, SLIDERS } from "../genMapping.js";
import { pidOf, bankOf } from "../createChannel.js";

function logPos(def, value) {
  const v = Math.min(def.max, Math.max(def.min, value));
  return (1000 * Math.log(v / def.min)) / Math.log(def.max / def.min);
}
function logVal(def, pos) {
  return def.min * Math.pow(def.max / def.min, pos / 1000);
}

function Slider({ def, value, overridden, onChange, accent }) {
  const isLog = !!def.log;
  const pos = isLog ? logPos(def, value) : value;
  const handle = (p) => {
    const v = isLog ? logVal(def, Number(p)) : Number(p);
    onChange(v);
  };
  return (
    <label className={`slider${overridden ? " overridden" : ""}`}>
      <span className="slider-head">
        <span className="slider-label">
          {def.label}
          {overridden ? <i className="odot" title="Overridden" /> : null}
        </span>
        <strong className="tnum">{def.format(value)}</strong>
      </span>
      <input
        type="range"
        min={isLog ? 0 : def.min}
        max={isLog ? 1000 : def.max}
        step={isLog ? 1 : def.step ?? 1}
        value={pos}
        aria-label={def.label}
        onChange={(e) => handle(e.target.value)}
      />
    </label>
  );
}

function AdsrPreview({ a, d, s, r, kind }) {
  // tiny ADSR curve: attack 0->1, decay 1->s, sustain s, release s->0
  const W = 96;
  const H = 28;
  const total = a + d + r;
  const x1 = total > 0 ? (a / total) * W * 0.7 : 0;
  const x2 = x1 + (total > 0 ? (d / total) * W * 0.7 : 0);
  const x3 = x2 + W * 0.18;
  const x4 = x3 + (total > 0 ? (r / total) * W * 0.7 : 0);
  const yS = H - 3 - s * (H - 6);
  const pts = `0,${H - 2} ${x1.toFixed(1)},2 ${x2.toFixed(1)},${yS.toFixed(
    1
  )} ${x3.toFixed(1)},${yS.toFixed(1)} ${Math.min(W, x4).toFixed(1)},${H - 2}`;
  return (
    <svg
      className="adsr-preview"
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      aria-hidden="true"
    >
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function EnvelopeControl({ title, keys, values, overriddenGens, onChange, onReset }) {
  const defs = keys.map((k) => SLIDERS[k]);
  const [a, d, s, r] = keys.map((k) => values[k] ?? 0);
  // normalize sustain % for the preview; others are ms or octaves
  const sNorm = keys[2].includes("Sustain") ? s / 100 : 0.7;
  return (
    <section className="ctl-group" aria-label={title}>
      <div className="ctl-group-head">
        <h3>{title}</h3>
        <button type="button" className="btn btn-ghost btn-xs" onClick={onReset} title={`Reset ${title} to SoundFont`}>
          Reset
        </button>
      </div>
      <div className="env-row">
        <AdsrPreview a={a} d={d} s={sNorm} r={r} />
        <div className="env-sliders">
          {keys.map((k) => (
            <Slider
              key={k}
              def={SLIDERS[k]}
              value={values[k] ?? 0}
              overridden={!!overriddenGens[SLIDERS[k].gen]}
              onChange={(v) => onChange(k, v)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function PresetPicker({ track, programOptions, banksInUse, onSelect }) {
  const [bank, setBank] = useState(null); // null = track's bank
  const [query, setQuery] = useState("");
  const activeBank = bank ?? (track.presetId != null ? bankOf(track.presetId) : 0);
  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return programOptions
      .filter((p) => bankOf(p.presetId) === activeBank)
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .sort((a, b) => pidOf(a.presetId) - pidOf(b.presetId));
  }, [programOptions, activeBank, query]);
  return (
    <div className="preset-picker">
      <select
        className="ctl"
        aria-label="Bank"
        value={activeBank}
        onChange={(e) => setBank(Number(e.target.value))}
      >
        {banksInUse.map((b) => (
          <option key={b} value={b}>
            {b === 128 ? "Drums (128)" : `Bank ${b}`}
          </option>
        ))}
      </select>
      <input
        className="ctl"
        type="search"
        placeholder="Search presets…"
        aria-label="Search presets"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select
        className="ctl preset-select"
        aria-label="Preset"
        value={track.presetId ?? ""}
        onChange={(e) => {
          if (e.target.value !== "") onSelect(Number(e.target.value));
        }}
      >
        <option value="" disabled>
          Select a preset
        </option>
        {options.map((p) => (
          <option key={p.presetId} value={p.presetId}>
            {String(pidOf(p.presetId)).padStart(3, "0")} · {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function Inspector({ engine }) {
  const {
    activeTrack,
    programOptions,
    banksInUse,
    sliderValues,
    overrides,
    setGen,
    resetGenGroup,
    selectProgram,
    previewNote,
    openZoneEditor,
    queryChannel,
    setMixControl,
  } = engine;

  const ch = activeTrack.id;
  const values = sliderValues[ch] ?? {};
  const chOverrides = overrides[ch] ?? {};

  const mixDef = (label, key, min = 0, max = 127) => ({
    label,
    min,
    max,
    unit: "",
    format: (v) => String(Math.round(v)),
  });

  return (
    <section className="inspector-panel" aria-label="Channel inspector">
      <div className="inspector-head">
        <h2>
          CH {ch + 1}
          {ch === 9 ? " · Drums" : ""}
        </h2>
        <div className="icon-actions">
          <button
            type="button"
            className="btn btn-icon"
            title="Preview C4"
            aria-label="Preview note"
            onClick={() => previewNote(ch)}
          >
            ♪
          </button>
          <button
            type="button"
            className="btn btn-icon"
            title="Edit zone"
            aria-label="Edit zone"
            disabled={!activeTrack.loaded}
            onClick={() => openZoneEditor(ch)}
          >
            ⚙
          </button>
          <button
            type="button"
            className="btn btn-icon"
            title="Inspect state"
            aria-label="Inspect synth state"
            onClick={() => queryChannel(ch)}
          >
            🔍
          </button>
        </div>
      </div>

      <PresetPicker
        track={activeTrack}
        programOptions={programOptions}
        banksInUse={banksInUse}
        onSelect={(presetId) => selectProgram(ch, presetId)}
      />

      <section className="ctl-group" aria-label="Mix">
        <div className="mix-row">
          {[
            ["Volume", "volume", activeTrack.volume],
            ["Pan", "pan", activeTrack.pan],
            ["Expr", "expression", activeTrack.expression],
          ].map(([label, key, val]) => (
            <Slider
              key={key}
              def={mixDef(label, key)}
              value={val}
              overridden={false}
              onChange={(v) => setMixControl(ch, key, v)}
            />
          ))}
        </div>
      </section>

      <section className="ctl-group" aria-label="Filter">
        <div className="ctl-group-head">
          <h3>Filter</h3>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => resetGenGroup(ch, "filter")}
            title="Reset filter to SoundFont"
          >
            Reset
          </button>
        </div>
        <div className="filter-row">
          <Slider
            def={SLIDERS.filterFc}
            value={values.filterFc ?? 0}
            overridden={!!chOverrides[GEN.FilterFc]}
            onChange={(v) => setGen(ch, "filterFc", v)}
          />
          <Slider
            def={SLIDERS.filterQ}
            value={values.filterQ ?? 0}
            overridden={!!chOverrides[GEN.FilterQ]}
            onChange={(v) => setGen(ch, "filterQ", v)}
          />
        </div>
      </section>

      <EnvelopeControl
        title="Amp Env"
        keys={["vcaAttack", "vcaDecay", "vcaSustain", "vcaRelease"]}
        values={values}
        overriddenGens={chOverrides}
        onChange={(k, v) => setGen(ch, k, v)}
        onReset={() => resetGenGroup(ch, "ampEnv")}
      />
      <EnvelopeControl
        title="Filter Env"
        keys={["vcfAttack", "vcfDecay", "vcfSustain", "vcfRelease", "vcfAmount"]}
        values={values}
        overriddenGens={chOverrides}
        onChange={(k, v) => setGen(ch, k, v)}
        onReset={() => resetGenGroup(ch, "filterEnv")}
      />
    </section>
  );
}
