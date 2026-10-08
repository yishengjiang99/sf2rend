import React, { useEffect, useRef } from "react";

function useCanvas(draw) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    let raf = 0;
    const ro = new ResizeObserver(() => {
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
    });
    ro.observe(wrap);
    const loop = () => {
      drawRef.current?.(canvas);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return [wrapRef, canvasRef];
}

function drawWaveform(canvas, getData) {
  const ctx = canvas.getContext("2d");
  const data = getData();
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#0f141f";
  ctx.fillRect(0, 0, W, H);
  if (!data || !data.length) {
    ctx.fillStyle = "rgba(245,231,201,0.5)";
    ctx.font = `${12 * (window.devicePixelRatio || 1)}px system-ui`;
    ctx.fillText("Waiting for audio…", 12, 20);
    return;
  }
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.moveTo(0, H / 2);
  ctx.lineTo(W, H / 2);
  ctx.stroke();
  ctx.strokeStyle = "#ffc978";
  ctx.lineWidth = Math.max(1, window.devicePixelRatio || 1);
  ctx.beginPath();
  const n = data.length;
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * W;
    const y = H / 2 + data[i] * H * 0.42;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawSpectrum(canvas, getData) {
  const ctx = canvas.getContext("2d");
  const data = getData();
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#0f141f";
  ctx.fillRect(0, 0, W, H);
  if (!data || !data.length) {
    ctx.fillStyle = "rgba(245,231,201,0.5)";
    ctx.font = `${12 * (window.devicePixelRatio || 1)}px system-ui`;
    ctx.fillText("Waiting for audio…", 12, 20);
    return;
  }
  // raw FFT magnitudes -> normalize; log-frequency x axis
  const n = data.length;
  let peak = 1e-6;
  for (let i = 0; i < n; i++) {
    const m = Math.abs(data[i]);
    if (m > peak) peak = m;
  }
  const logMin = Math.log10(20);
  const logMax = Math.log10(20000);
  ctx.fillStyle = "#7bd6c2";
  for (let i = 1; i < n; i++) {
    // bin i of N=128 @44.1kHz ~ i*344 Hz; map log-freq to x
    const freq = (i / n) * 22050;
    if (freq < 20) continue;
    const x0 = ((Math.log10(freq) - logMin) / (logMax - logMin)) * W;
    const freq1 = ((i + 1) / n) * 22050;
    const x1 = ((Math.log10(Math.min(freq1, 20000)) - logMin) / (logMax - logMin)) * W;
    const mag = Math.abs(data[i]) / peak;
    // perceptual-ish compression
    const h = Math.pow(mag, 0.6) * H;
    ctx.fillRect(x0, H - h, Math.max(1, x1 - x0 - 0.5), h);
  }
}

export default function Scope({ engine }) {
  const { analysisRef } = engine;
  const [waveWrap, waveCanvas] = useCanvas((canvas) =>
    drawWaveform(canvas, () => analysisRef.current.waveForm())
  );
  const [specWrap, specCanvas] = useCanvas((canvas) =>
    drawSpectrum(canvas, () => analysisRef.current.frequencyBins())
  );

  return (
    <section className="scope-panel" aria-label="Analysis">
      <div className="scope-card">
        <div className="scope-title">Spectrum</div>
        <div ref={specWrap} className="scope-body">
          <canvas ref={specCanvas} className="scope-canvas" />
        </div>
      </div>
      <div className="scope-card">
        <div className="scope-title">Waveform</div>
        <div ref={waveWrap} className="scope-body">
          <canvas ref={waveCanvas} className="scope-canvas" />
        </div>
      </div>
    </section>
  );
}
