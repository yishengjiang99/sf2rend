/* eslint-disable no-undef */
import { LowPassFilterNode } from "./lpf.js";
async function m() {
  const ctx = new OfflineAudioContext(1, 4800, 48000);
  await LowPassFilterNode.init(ctx);
  const lp = new LowPassFilterNode(ctx);
  const op = new OscillatorNode(ctx, {
    frequency: 440,
    gain: 1,
    type: "sawtooth",
  });
  op.connect(lp).connect(ctx.destination);
  const fq = lp.parameters.get("FilterFC");
  fq.setValueAtTime(1000, 0);
  fq.linearRampToValueAtTime(200, 0.5);
  fq.cancelAndHoldAtTime(0.3);
  op.start();
  op.stop(0.21);
  // const spl = new ChannelSplitterNode(ctx, { numberOfOutputs: 2 });
  // op.connect(spl).connect(ctx.destination, 1);
  // spl.connect(lp, 0, 0).connect(ctx.destination, 0);
  op.connect(lp).connect(ctx.destination);
  ctx
    .startRendering()
    .then((ob) => console.log(ob.getChannelData(0).filter((v) => v)));
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
