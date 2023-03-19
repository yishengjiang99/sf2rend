import { SpinNode } from "../spin/spin.js";
export async function mkpath(ctx) {
  await SpinNode.init(ctx);
  const spinner = new SpinNode(ctx, 16);
  const merger = new GainNode(ctx);
  const masterMixer = new GainNode(ctx, { gain: 1.0 });
  for (let i = 0; i < 16; i++) {
    spinner.connect(merger, i, 0);
  }
  merger.connect(masterMixer).connect(ctx.destination);

  return {
    spinner,
    masterMixer,
    merger,
  };
}
