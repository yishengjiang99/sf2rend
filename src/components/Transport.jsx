import React from "react";
import { TIMER_STATE, available_btns } from "../sequence/constants.js";

const CMD_ICONS = {
  start: "▶",
  resume: "▶",
  stop: "■",
  pause: "❚❚",
  reset: "↺",
  rwd: "⏮",
  fwd: "⏭",
};

function formatPosition(clockMs) {
  const m = Math.floor(clockMs / 60000);
  const s = (clockMs % 60000) / 1000;
  return `${String(m).padStart(2, "0")}:${s.toFixed(1).padStart(4, "0")}`;
}

function formatBarBeat(ticks, ppqn) {
  const beats = ticks / ppqn;
  const bar = Math.floor(beats / 4) + 1;
  const beat = (beats % 4) + 1;
  return `bar ${bar}.${beat.toFixed(1)}`;
}

export default function Transport({
  timerState,
  now,
  tm,
  onCommand,
  onBpm,
  title,
}) {
  const buttons = available_btns[timerState] ?? [];
  return (
    <div className="transport" role="toolbar" aria-label="Transport">
      <div className="transport-buttons">
        {buttons.map((command) => (
          <button
            key={command}
            type="button"
            className="tbtn"
            aria-label={command}
            title={command}
            onClick={() => onCommand(command)}
          >
            {CMD_ICONS[command] ?? command}
          </button>
        ))}
      </div>
      <div className="transport-pos" aria-label="Playback position">
        <span className="tnum">{formatPosition(now.clock)}</span>
        <span className="tdot">·</span>
        <span className="tnum">{formatBarBeat(now.ticks, tm.ppqn)}</span>
      </div>
      <label className="transport-tempo">
        <input
          type="number"
          min={30}
          max={300}
          step={1}
          value={tm.tempo}
          aria-label="Tempo in BPM"
          onChange={(event) => onBpm(Number(event.target.value))}
        />
        <span>BPM</span>
      </label>
      <div className="transport-title" title={title}>
        {title}
      </div>
    </div>
  );
}
