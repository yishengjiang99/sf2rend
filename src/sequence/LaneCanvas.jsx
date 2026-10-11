import React, { useEffect, useRef } from "react";

/**
 * LaneCanvas — renders one channel's MIDI notes onto a single canvas.
 *
 * Replaces the old per-note DOM approach (one absolutely-positioned <b> per
 * note, each with its own gradient + box-shadow paint). For a dense MIDI that
 * was thousands of expensive paint nodes and made scrolling janky on mobile.
 * Now each lane is one bitmap: drawn once when the note data changes (notes
 * are static per MIDI) and on resize, DPR-aware for crisp rendering.
 *
 * Props:
 *   notes: [{ t, dur, pitch }] — note start/duration in ticks, MIDI pitch
 *   maxT:  total ticks (for horizontal scaling)
 */
export default function LaneCanvas({ notes, maxT }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, w, h);
      if (!notes || notes.length === 0 || !maxT) return;
      // One shared vertical gradient for all notes (was per-note in DOM).
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "rgba(124,107,255,0.95)");
      grad.addColorStop(1, "rgba(56,189,214,0.85)");
      ctx.fillStyle = grad;
      const noteH = Math.max(2, Math.round(8 * dpr));
      const minW = Math.max(1, dpr);
      for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        const x = (note.t / maxT) * w;
        const nw = Math.max((note.dur / maxT) * w, minW);
        // Same vertical mapping the DOM version used: pitch 0 at bottom.
        const y = ((127 - note.pitch) / 127) * h;
        ctx.fillRect(x, y - noteH / 2, nw, noteH);
      }
    };

    render();
    const ro = new ResizeObserver(render);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [notes, maxT]);

  return <canvas ref={canvasRef} className="lane-canvas" aria-hidden="true" />;
}
