/* eslint-disable no-undef */
import { SpinNode } from "./spin-node.js";
import { newSFZone } from "../sf2-service/zoneProxy.js";
import { mkcanvas, chart } from "https://unpkg.com/mk-60fps";
import SF2Service from "https://unpkg.com/sf2-service@1.4.0/index.js";
const sf2url =
  "https://raw.githubusercontent.com/FluidSynth/fluidsynth/master/sf2/VintageDreamsWaves-v2.sf2";
promise_test(async () => {
  const ctx = new OfflineAudioContext(2, 44100, 44100);
  await SpinNode.init(ctx);
  const node = new SpinNode(ctx);

  assert_equals(node.context, ctx);
  const sf2s = new SF2Service(sf2url);
  await sf2s.load();
  const p = sf2s.loadProgram(0, 0);
  await node.shipProgram(p, p.pid | p.bkid);
  assert_equals(p.bkid, 0);
  const zone = p.filterKV(60, 55)[1];
  const zoneObj = newSFZone(zone);
  zoneObj.VolEnvAttack = -1200;
  zoneObj.VolEnvHold = -1200;
  zoneObj.VolEnvDecay = 3000;
  zoneObj.VolEnvSustain = 333;
  zoneObj.CoarseTune = 0;
  zoneObj.FineTune = 0;
  zoneObj.OverrideRootKey = 48;
  console.log(zoneObj.shdr);
  node.port.postMessage({
    update: [p.pid | p.bkid, zoneObj.ref],
    arr: zoneObj.arr,
  });

  assert_true(zone.shdr.originalPitch > 0);
  console.log(zone);
  // node.port.postMessage([0x90, 0, 60, 55, [p.pid | p.bkid, zone.ref]]);
  // node.port.postMessage([0x90, 0, 48, 55, [p.pid | p.bkid, zone.ref]]);
  node.port.postMessage([0x90, 1, 36, 55, [p.pid | p.bkid, zone.ref]]);
  await waitforZack(node);
  await new Promise((r) => setTimeout(r, 300));
  node.port.postMessage([0x90, 0, 48, 55, [p.pid | p.bkid, zone.ref]]);
  await waitforZack(node);

  node
    .connect(new DelayNode(ctx, { delay: 6 }), 15, 0)
    .connect(ctx.destination);
  node.connect(new GainNode(ctx), 1, 0).connect(ctx.destination);

  chart(mkcanvas(), await zone.pcm);
  let abs = await ctx.startRendering();
  chart(mkcanvas(), abs.getChannelData(0));
  chart(mkcanvas(), abs.getChannelData(1));

  assert_equals(node.context, ctx);
}, "freebie");
async function waitforZack(node) {
  await new Promise(
    (r) =>
      (node.port.onmessage = ({ data: { zack } }) => {
        if (zack) {
          r();
        }
      })
  );
}
