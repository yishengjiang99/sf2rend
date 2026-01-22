/* eslint-disable no-undef */
import {LowPassFilterNode} from "./lpf.js";
import {
  mkcanvas,
  renderFrames,
  chart,
} from "https://unpkg.com/mk-60fps@1.1.0/chart.js";
async function m() {
  // Cross-browser OfflineAudioContext support for Safari and other browsers
  const OfflineAudioContextClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const ctx = new OfflineAudioContextClass(1, 2300, 48000);
  await LowPassFilterNode.init(ctx);
  const lp = new LowPassFilterNode(ctx);
  const [op1, op2] = [
    new OscillatorNode(ctx, {
      frequency: 440,
      gain: 1,
      type: "sine",
    }),
    new OscillatorNode(ctx, {
      frequency: 440,
      gain: 1,
      type: "square",
    }),
  ];
  const bq = new BiquadFilterNode(ctx, {
    type: "lowpass",
    frequency: 1000,
    Q: 0.8,
  });
  op2.connect(lp).connect(ctx.destination);
  const freqToCent = (freq) => (Math.log(freq / 8.175) / Math.LN2) * 1200;
  const fq = lp.parameters.get("FilterFC");
  const qc = lp.parameters.get("FilterQ_Cb");
  qc.setValueAtTime(-30, ctx.currentTime);
  fq.setValueAtTime(freqToCent(600), ctx.currentTime);

  bq.frequency.linearRampToValueAtTime(400, 0.4);
  op2.start();
  const ob = await ctx.startRendering();
  renderFrames(mkcanvas({ width: 1024, height: 250 }), ob.getChannelData(0));
}
m();
// struct tsf_voice_lowpass { double QInv, a0, a1, b1, b2, z1, z2; TSF_BOOL active; };

// // Lowpass filter from http://www.earlevel.com/main/2012/11/26/biquad-c-source-code/
// double K = TSF_TAN(TSF_PI * Fc), KK = K * K;
// double norm = 1 / (1 + K * e->QInv + KK);
// e->a0 = KK * norm;
// e->a1 = 2 * e->a0;
// e->b1 = 2 * (KK - 1) * norm;
// e->b2 = (1 - K * e->QInv + KK) * norm;
