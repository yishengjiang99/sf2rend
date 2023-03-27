import { LowPassFilterNode } from "./lpf.js";

async function setup() {
  const o = new OfflineAudioContext(1, 48000, 48000);
  await LowPassFilterNode.init(o);
  return new LowPassFilterNode(o, 24000);
}
promise_test(async () => {
  const lpf = setup();
  assert_true((await lpf).frequency);
}, "freebie");
