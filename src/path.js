import { SpinNode } from "../spin/spin.js";
export async function mkpath(ctx, additional_nodes = []) {
  await SpinNode.init(ctx);
  const spinner = new SpinNode(ctx, 16);
  const merger = new GainNode(ctx);
  const masterMixer = new GainNode(ctx, { gain: 1.0 });
  for (let i = 0; i < 1; i++) {
    spinner.connect(merger, i, 0);
  }
  merger.connect(masterMixer);
  let head = masterMixer;
  while (additional_nodes.length) {
    head = additional_nodes.shift();
    merger.connect(head);
  }
  head.connect(ctx.destination);
  return spinner;
}
