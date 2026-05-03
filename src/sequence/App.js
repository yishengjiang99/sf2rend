import { useEffect, useMemo, useRef, useState } from "react";
import React from "react";
import {
  TIMER_STATE,
  available_btns,
  cmd2stateChange,
} from "./constants";
import useTM from "./useTM";
import "./App.css";

export default function Sequencer({
  activeChannel,
  eventPipe,
  midiInfo,
  onTransportGesture,
  timerWorker,
  title,
}) {
  const [tm, { setTempo, setTM, setTS1, setTS2 }] = useTM(getTimeBase(midiInfo));
  const [now, setNow] = useState({ ticks: 0, clock: 0 });
  const [timerState, setTimerState] = useState(TIMER_STATE.INIT);
  const originalTracksRef = useRef([]);
  const playbackTracksRef = useRef([]);
  const tempoEventsRef = useRef([]);
  const noteLanes = useMemo(() => buildNoteLanes(midiInfo), [midiInfo]);

  function resetPlaybackAt(ticks) {
    playbackTracksRef.current = originalTracksRef.current.map((track) =>
      track.filter((event) => event.t > ticks).map(cloneEvent)
    );
    tempoEventsRef.current = midiInfo.tempos.map((tempo) => ({ ...tempo }));
  }

  useEffect(() => {
    originalTracksRef.current = midiInfo.tracks.map((track) =>
      track.map(cloneEvent)
    );
    resetPlaybackAt(0);
    setTM(getTimeBase(midiInfo));
    setNow({ ticks: 0, clock: 0 });
    setTimerState(TIMER_STATE.INIT);
    timerWorker.postMessage({ cmd: "reset" });
  }, [midiInfo, setTM, timerWorker]);

  useEffect(() => {
    timerWorker.postMessage({ tm });
  }, [timerWorker, tm]);

  useEffect(() => {
    const onMessage = ({ data }) => {
      if (typeof data.ticks !== "number") {
        return;
      }

      playbackTracksRef.current.forEach((track) => {
        while (track.length && track[0].t <= data.ticks) {
          const event = track.shift();
          if (event.channel) {
            eventPipe?.postMessage(event.channel);
          }
        }
      });

      while (
        tempoEventsRef.current[1] &&
        data.ticks >= tempoEventsRef.current[1].t
      ) {
        const nextTempo = tempoEventsRef.current[1];
        setTM((current) => ({
          ...current,
          msqn: nextTempo.tempo,
        }));
        tempoEventsRef.current.shift();
      }

      setNow({
        ticks: Math.max(0, data.ticks),
        clock: Math.max(0, data.clock ?? 0),
      });
    };

    timerWorker.addEventListener("message", onMessage);
    return () => timerWorker.removeEventListener("message", onMessage);
  }, [eventPipe, setTM, timerWorker]);

  async function runTransportCommand(command) {
    if (command === "start" || command === "resume") {
      await onTransportGesture?.();
    }

    if (command === "start" || command === "reset") {
      resetPlaybackAt(0);
      setNow({ ticks: 0, clock: 0 });
    }
    if (command === "rwd") {
      const nextTicks = Math.max(0, now.ticks - tm.ppqn * 8);
      resetPlaybackAt(nextTicks);
      setNow((current) => ({ ...current, ticks: nextTicks }));
    }
    if (command === "fwd") {
      const nextTicks = now.ticks + tm.ppqn * 8;
      resetPlaybackAt(nextTicks);
      setNow((current) => ({ ...current, ticks: nextTicks }));
    }

    timerWorker.postMessage({ cmd: command });
    if (Object.prototype.hasOwnProperty.call(cmd2stateChange, command)) {
      setTimerState(cmd2stateChange[command]);
    }
  }

  return (
    <div className="sequencer-shell">
      <div className="transport-header">
        <div className="transport-copy">
          <div className="transport-title">{title}</div>
          <div className="transport-subtitle">
            {midiInfo.ntracks} tracks · {noteLanes.totalNotes} note events
          </div>
        </div>
        <div className="transport-reading">
          <div className="transport-badge">
            <span>Clock</span>
            <strong>{formatClock(now.clock)}</strong>
          </div>
          <div className="transport-badge">
            <span>Bar</span>
            <strong>{(now.ticks / tm.ppqn).toFixed(1)}</strong>
          </div>
          <div className="transport-badge">
            <span>Tempo</span>
            <strong>{tm.tempo} BPM</strong>
          </div>
        </div>
      </div>

      <div className="transport-controls">
        <div className="transport-buttons">
          {available_btns[timerState].map((command) => (
            <button
              className={`transport-button${
                cmd2stateChange[command] === timerState ? " transport-button-active" : ""
              }`}
              key={command}
              type="button"
              onClick={() => runTransportCommand(command)}
            >
              {command}
            </button>
          ))}
        </div>
        <div className="transport-settings">
          <label className="transport-field">
            <span>BPM</span>
            <input
              className="transport-input"
              type="number"
              min={30}
              max={300}
              step={1}
              value={tm.tempo}
              onChange={(event) => setTempo(Number(event.target.value))}
            />
          </label>
          <label className="transport-field">
            <span>TS Num</span>
            <input
              className="transport-input"
              type="number"
              min={1}
              max={12}
              step={1}
              value={tm.ts1}
              onChange={(event) => setTS1(Number(event.target.value))}
            />
          </label>
          <label className="transport-field">
            <span>TS Den</span>
            <input
              className="transport-input"
              type="number"
              min={1}
              max={16}
              step={1}
              value={tm.ts2}
              onChange={(event) => setTS2(Number(event.target.value))}
            />
          </label>
        </div>
      </div>

      <div className="sequence-viewport">
        {noteLanes.lanes.map((lane) => (
          <LaneCanvas
            active={lane.channel === activeChannel}
            channel={lane.channel}
            key={lane.channel}
            maxTick={noteLanes.maxTick}
            notes={lane.notes}
            ppqn={tm.ppqn}
            ticks={now.ticks}
          />
        ))}
      </div>
    </div>
  );
}

function LaneCanvas({ active, channel, maxTick, notes, ppqn, ticks }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const duration = Math.max(ppqn * 16, maxTick);
    const barTicks = ppqn * 4;
    const minNote = notes.length
      ? Math.max(0, Math.min(...notes.map((note) => note.key)) - 2)
      : 48;
    const maxNote = notes.length
      ? Math.min(127, Math.max(...notes.map((note) => note.key)) + 2)
      : 72;
    const noteSpan = Math.max(1, maxNote - minNote + 1);
    const laneHeight = height / noteSpan;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = active ? "#171d2a" : "#101521";
    ctx.fillRect(0, 0, width, height);

    for (let tick = 0; tick <= duration; tick += ppqn) {
      const x = (tick / duration) * width;
      ctx.strokeStyle = tick % barTicks === 0 ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let i = 0; i < noteSpan; i++) {
      const y = i * laneHeight;
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    notes.forEach((note) => {
      const x = (note.start / duration) * width;
      const noteWidth = Math.max(2, (note.duration / duration) * width);
      const y = height - ((note.key - minNote + 1) * laneHeight);
      const hue = (channel / 16) * 320 + 20;
      ctx.fillStyle = `hsla(${hue}, 82%, 66%, 0.82)`;
      ctx.fillRect(x, y, noteWidth, Math.max(3, laneHeight - 1));
    });

    const playheadX = (ticks / duration) * width;
    ctx.strokeStyle = active ? "#ffd089" : "#93c5fd";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
  }, [active, channel, maxTick, notes, ppqn, ticks]);

  return (
    <div className={`lane-row${active ? " lane-row-active" : ""}`}>
      <div className="lane-label">
        <strong>CH {channel + 1}</strong>
        <span>{notes.length} notes</span>
      </div>
      <canvas className="lane-canvas" ref={canvasRef} width="1500" height="64" />
    </div>
  );
}

function buildNoteLanes(midiInfo) {
  const lanes = Array.from({ length: 16 }, (_, channel) => ({
    channel,
    notes: [],
  }));
  const openNotes = Array.from({ length: 16 }, () => new Map());
  let maxTick = 0;

  midiInfo.tracks.forEach((track) => {
    track.forEach((event) => {
      maxTick = Math.max(maxTick, event.t ?? 0);
      if (!event.channel) {
        return;
      }
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
        if (!started) {
          return;
        }
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

function cloneEvent(event) {
  return {
    ...event,
    channel: event.channel ? [...event.channel] : event.channel,
  };
}

function formatClock(clock) {
  return (clock / 1000).toFixed(2).replace(".", ":");
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
