/* eslint-disable no-undef */
import {LowPassFilterNode} from "./lpf.js";
import {mkcanvas, chart} from "https://unpkg.com/mk-60fps@1.1.0/chart.js"
async function m() {
  const ctx = new OfflineAudioContext(2, 4800, 48000);
  await LowPassFilterNode.init(ctx);
  const lp = new LowPassFilterNode(ctx);
  const [op1, op2] = [new OscillatorNode(ctx, {
    frequency: 440,
    gain: 1,
    type: "sine",
  }), new OscillatorNode(ctx, {
    frequency: 880,
    gain: 1,
    type: "sine",
  })];
  const g = new GainNode(ctx);
  op1.connect(g);
  op2.connect(g);
  g.connect(lp).connect(ctx.destination);
  const freqToCent = freq => Math.log(freq / 8.175) / Math.LN2 * 1200
  const fq = lp.parameters.get("FilterFC");
  fq.setValueAtTime(freqToCent(800), 0);
  fq.linearRampToValueAtTime(freqToCent(22), .1);
  op1.start();
  op2.start();
  const ob = await ctx.startRendering();
  chart(mkcanvas(), ob.getChannelData(1))
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
