import React, { useRef, useState } from "react";

const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const BLACK = new Set([1, 3, 6, 8, 10]);

function midiName(midi) {
  return `${NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

export default function Keyboard({ engine }) {
  const { noteOn, noteOff, activeTrack, ensureAudioRunning } = engine;
  const [octave, setOctave] = useState(0); // semitone offset from base 48
  const wrapRef = useRef(null);
  const pressedRef = useRef(new Map()); // pointerId -> Set<midi>
  const sounding = new Set(activeTrack.sounding ?? []);

  const base = 48 + octave;
  const keys = Array.from({ length: 36 }, (_, i) => {
    const midi = base + i;
    return { midi, black: BLACK.has(midi % 12), name: midiName(midi) };
  });

  const velocityFromEvent = (event) => {
    const key = event.target.closest("[data-midi]");
    if (!key) return 100;
    const rect = key.getBoundingClientRect();
    const frac = (event.clientY - rect.top) / Math.max(1, rect.height);
    return Math.round(127 - Math.min(1, Math.max(0, frac)) * 47);
  };

  const press = (midi, velocity) => {
    noteOn(midi, velocity);
  };
  const release = (midi) => {
    noteOff(midi);
  };

  const keyFromPoint = (x, y) => {
    const el = document.elementFromPoint(x, y)?.closest("[data-midi]");
    return el ? Number(el.dataset.midi) : null;
  };

  const onPointerDown = (event) => {
    event.preventDefault();
    ensureAudioRunning();
    wrapRef.current?.setPointerCapture(event.pointerId);
    const midi = keyFromPoint(event.clientX, event.clientY);
    if (midi == null) return;
    let set = pressedRef.current.get(event.pointerId);
    if (!set) {
      set = new Set();
      pressedRef.current.set(event.pointerId, set);
    }
    if (!set.has(midi)) {
      set.add(midi);
      press(midi, velocityFromEvent(event));
    }
  };

  const onPointerMove = (event) => {
    const set = pressedRef.current.get(event.pointerId);
    if (!set) return;
    const midi = keyFromPoint(event.clientX, event.clientY);
    // glissando: press new keys under the pointer, release left ones
    if (midi != null && !set.has(midi)) {
      set.add(midi);
      press(midi, velocityFromEvent(event));
    }
  };

  const endPointer = (event) => {
    const set = pressedRef.current.get(event.pointerId);
    if (set) {
      for (const midi of set) release(midi);
      pressedRef.current.delete(event.pointerId);
    }
  };

  return (
    <section className="keyboard-panel" aria-label="Keyboard">
      <div className="keyboard-bar">
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          aria-label="Octave down"
          onClick={() => setOctave((o) => Math.max(-24, o - 12))}
        >
          ◀
        </button>
        <span className="keyboard-caption tnum">
          CH {activeTrack.id + 1} · {midiName(base)}–{midiName(base + 35)}
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          aria-label="Octave up"
          onClick={() => setOctave((o) => Math.min(24, o + 12))}
        >
          ▶
        </button>
      </div>
      <div
        ref={wrapRef}
        className="keyboard"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onLostPointerCapture={endPointer}
        style={{ touchAction: "none" }}
      >
        {keys.map((key) => (
          <button
            key={key.midi}
            type="button"
            data-midi={key.midi}
            aria-label={key.name}
            className={`piano-key${key.black ? " piano-key-black" : ""}${
              sounding.has(key.midi) ? " sounding" : ""
            }`}
          >
            {!key.black && key.midi % 12 === 0 ? (
              <span className="key-label">{key.name}</span>
            ) : null}
          </button>
        ))}
      </div>
    </section>
  );
}
