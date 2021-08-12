/* eslint-disable no-undef */
import { chart, mkcanvas } from "../chart/chart.js";
import { SpinNode } from "./spin.js";
test(() => assert_true(true), "freebie");
promise_test(async () => {
  const o = new OfflineAudioContext(1, 0x1000, 0xffff);
  await SpinNode.init(o);
  const si = await (await fetch("./sine.pcm")).arrayBuffer();
  const sp = new SpinNode(o, {
    pcm: new Float32Array(si),
    loops: [0, si.length / 1.2],
    zref: 2,
  });

  assert_true(si.byteLength > 11, "downloaded sien pcm");
  sp.connect(o.destination);
  sp.strideParam.setValueAtTime(12, 0.001);
  sp.strideParam.linearRampToValueAtTime(1111, 0.2);
  sp.strideParam.linearRampToValueAtTime(12, 0.4);

  const ab = await o.startRendering();
  console.log(ab.getChannelData(0));

  assert_true(
    ab.getChannelData(0).filter((v) => v < 0).count > 2,
    "some fals are negative"
  );

  assert_true(true);
}, "basic function");
