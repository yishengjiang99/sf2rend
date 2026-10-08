import React, { useEffect, useMemo, useRef, useState } from "react";
import { CHANNEL_ACCENTS } from "../synth/useSynthEngine.js";

function buildNoteLanes(midiInfo) {
  const lanes = Array.from({ length: 16 }, (_, channel) => ({
    channel,
    notes: [],
  }));
  const openNotes = Array.from({ length: 16 }, () => new Map());
  let maxTick = 0;
  if (!midiInfo) return { lanes, maxTick, totalNotes: 0 };
  midiInfo.tracks.forEach((track) => {
    track.forEach((event) => {
      maxTick = Math.max(maxTick, event.t ?? 0);
      if (!event.channel) return;
      const [status, key, velocity] = event.channel;
      const channel = status & 0x0f;
      const cmd = status & 0xf0;
      const mapKey = `${channel}:${key}`;
      if (cmd === 0x90 && velocity > 0) {
        openNotes[channel].set(mapKey, {
          duration: 1,
          key,
          start: event.t,
          velocity,
        });
      } else if (cmd === 0x80 || (cmd === 0x90 && velocity === 0)) {
        const started = openNotes[channel].get(mapKey);
        if (!started) return;
        openNotes[channel].delete(mapKey);
        lanes[channel].notes.push({
          ...started,
          duration: Math.max(1, event.t - started.start),
        });
      }
    });
  });
  return {
    lanes,
    maxTick,
    totalNotes: lanes.reduce((sum, lane) => sum + lane.notes.length, 0),
  };
}

function midiNoteName(midi) {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return `${names[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

function MixerRow({
  track,
  active,
  onSelect,
  onMute,
  onSolo,
  registerMeter,
}) {
  const accent = CHANNEL_ACCENTS[track.id];
  return (
    <div
      className={`mixer-cell${active ? " active" : ""}`}
      style={{ "--track-accent": accent }}
    >
      <button
        type="button"
        className="mixer-select"
        onClick={onSelect}
        aria-label={`Select channel ${track.id + 1}: ${track.name}`}
      >
        <span className="mixer-num">{track.id + 1}</span>
        <span className="mixer-name" title={track.name}>
          {track.name}
        </span>
      </button>
      <span className="mixer-meter" aria-hidden="true">
        <span
          className="meter-fill"
          ref={(el) => registerMeter(track.id, el)}
        />
      </span>
      <span
        className={`activity-dot${track.activeNotes > 0 ? " on" : ""}`}
        aria-hidden="true"
      />
      <button
        type="button"
        className={`msbtn${track.muted ? " on" : ""}`}
        aria-pressed={track.muted}
        aria-label={`Mute channel ${track.id + 1}`}
        onClick={onMute}
      >
        M
      </button>
      <button
        type="button"
        className={`msbtn${track.soloed ? " on" : ""}`}
        aria-pressed={track.soloed}
        aria-label={`Solo channel ${track.id + 1}`}
        onClick={onSolo}
      >
        S
      </button>
    </div>
  );
}

function LaneCell({ lane, active, maxTick, ppqn, onSeek, onSelect }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const drawRef = useRef(null);

  drawRef.current = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const dpr = window.devicePixelRatio || 1;
    const notes = lane.notes;
    const duration = Math.max(ppqn * 16, maxTick);
    const minNote = notes.length
      ? Math.max(0, Math.min(...notes.map((n) => n.key)) - 2)
      : 48;
    const maxNote = notes.length
      ? Math.min(127, Math.max(...notes.map((n) => n.key)) + 2)
      : 72;
    const noteSpan = Math.max(1, maxNote - minNote + 1);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = active ? "#171d2a" : "#101521";
    ctx.fillRect(0, 0, width, height);

    // beat grid
    const barTicks = ppqn * 4;
    ctx.lineWidth = Math.max(1, dpr * 0.5);
    for (let tick = 0; tick <= duration; tick += ppqn) {
      const x = (tick / duration) * width;
      ctx.strokeStyle =
        tick % barTicks === 0
          ? "rgba(255,255,255,0.18)"
          : "rgba(255,255,255,0.07)";
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // notes scaled into the row height
    const hue = (lane.channel / 16) * 320 + 20;
    ctx.fillStyle = `hsla(${hue}, 82%, 66%, 0.85)`;
    for (const note of notes) {
      const x = (note.start / duration) * width;
      const w = Math.max(2 * dpr, (note.duration / duration) * width);
      const yIndex = note.key - minNote;
      const y = height - ((yIndex + 1) / noteSpan) * height;
      const h = Math.max(2 * dpr, height / noteSpan - dpr);
      ctx.fillRect(x, y, w, h);
    }
  };

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      drawRef.current?.();
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    drawRef.current?.();
  }, [lane, maxTick, ppqn, active]);

  return (
    <div
      ref={wrapRef}
      className={`lane-cell${active ? " active" : ""}`}
      onClick={(event) => {
        onSelect();
        const rect = wrapRef.current.getBoundingClientRect();
        const frac = (event.clientX - rect.left) / rect.width;
        const duration = Math.max(ppqn * 16, maxTick);
        onSeek(Math.round(frac * duration));
      }}
    >
      <canvas ref={canvasRef} className="lane-canvas" />
    </div>
  );
}

function Ruler({ maxTick, ppqn, ticks, onSeek }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const drawRef = useRef(null);

  drawRef.current = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const dpr = window.devicePixelRatio || 1;
    const duration = Math.max(ppqn * 16, maxTick);
    const barTicks = ppqn * 4;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#0d1220";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "rgba(235,240,255,0.55)";
    ctx.font = `${10 * dpr}px system-ui`;
    ctx.textBaseline = "middle";
    for (let tick = 0; tick <= duration; tick += barTicks) {
      const x = (tick / duration) * width;
      const bar = tick / barTicks + 1;
      ctx.fillText(String(bar), x + 4 * dpr, height / 2);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.beginPath();
      ctx.moveTo(x, height * 0.55);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    const px = (ticks / duration) * width;
    ctx.strokeStyle = "#ffd089";
    ctx.lineWidth = Math.max(1.5, dpr);
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, height);
    ctx.stroke();
  };

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      drawRef.current?.();
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    drawRef.current?.();
  }, [maxTick, ppqn, ticks]);

  return (
    <div
      ref={wrapRef}
      className="ruler-cell"
      role="slider"
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={Math.max(ppqn * 16, maxTick)}
      aria-valuenow={Math.round(ticks)}
      tabIndex={0}
      onClick={(event) => {
        const rect = wrapRef.current.getBoundingClientRect();
        const frac = (event.clientX - rect.left) / rect.width;
        onSeek(Math.round(frac * Math.max(ppqn * 16, maxTick)));
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") onSeek(ticks - ppqn * 4);
        if (event.key === "ArrowRight") onSeek(ticks + ppqn * 4);
      }}
    >
      <canvas ref={canvasRef} className="ruler-canvas" />
    </div>
  );
}

export default function Mixer({ engine }) {
  const {
    visibleChannels,
    tracks,
    activeChannel,
    setActiveChannel,
    toggleMute,
    toggleSolo,
    meterRef,
    midiInfo,
    midiTitle,
    now,
    tm,
    hideEmpty,
    setHideEmpty,
    seekTo,
  } = engine;

  const lanes = useMemo(() => buildNoteLanes(midiInfo), [midiInfo]);
  const meterFills = useRef(new Map());
  const gridRef = useRef(null);
  const [laneW, setLaneW] = useState(0);
  const reduceMotion = useRef(
    typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );

  // Measure the lane column width for the single absolute playhead.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const measure = () => {
      const mixerW =
        parseFloat(
          getComputedStyle(grid).getPropertyValue("--mixer-w")
        ) || 240;
      setLaneW(Math.max(0, grid.clientWidth - mixerW));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(grid);
    return () => ro.disconnect();
  }, []);

  const registerMeter = (id, el) => {
    if (el) meterFills.current.set(id, el);
    else meterFills.current.delete(id);
  };

  useEffect(() => {
    if (reduceMotion.current) return;
    let raf = 0;
    const loop = () => {
      const meters = meterRef.current;
      for (const [id, el] of meterFills.current) {
        const v = meters[id] ?? 0;
        el.style.width = `${Math.min(100, v * 140).toFixed(1)}%`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [meterRef, visibleChannels]);

  const maxTick = lanes.maxTick;
  const byId = useMemo(() => {
    const map = new Map();
    tracks.forEach((t) => map.set(t.id, t));
    return map;
  }, [tracks]);

  const duration = Math.max(tm.ppqn * 16, maxTick);
  const playheadLeft =
    laneW > 0 ? (now.ticks / duration) * laneW : 0;

  return (
    <section className="mixer-panel" aria-label="Mixer and timeline">
      <div className="arrangement-toolbar">
        <span className="arr-title" title={midiTitle}>
          {midiTitle}
        </span>
        <label className="check">
          <input
            type="checkbox"
            checked={hideEmpty}
            onChange={(e) => setHideEmpty(e.target.checked)}
          />
          Hide empty
        </label>
      </div>
      <div className="arrangement">
        <div className="arr-grid" ref={gridRef}>
          <div className="arr-head-mixer">CH · Preset · Meter</div>
          <Ruler maxTick={maxTick} ppqn={tm.ppqn} ticks={now.ticks} onSeek={seekTo} />
          {visibleChannels.map((id) => {
            const track = byId.get(id);
            const lane = lanes.lanes[id];
            const isActive = id === activeChannel;
            return (
              <React.Fragment key={id}>
                <MixerRow
                  track={track}
                  active={isActive}
                  onSelect={() => setActiveChannel(id)}
                  onMute={() => toggleMute(id)}
                  onSolo={() => toggleSolo(id)}
                  registerMeter={registerMeter}
                />
                <LaneCell
                  lane={lane}
                  active={isActive}
                  maxTick={maxTick}
                  ppqn={tm.ppqn}
                  onSeek={seekTo}
                  onSelect={() => setActiveChannel(id)}
                />
              </React.Fragment>
            );
          })}
          {/* single playhead spanning all lane cells */}
          <div
            className="playhead"
            style={{ left: `calc(var(--mixer-w) + ${playheadLeft}px)` }}
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
}
