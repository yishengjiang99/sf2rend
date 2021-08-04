/* eslint-disable no-undef */
import { chart, mkcanvas } from "../chart/chart.js";
import { SpinNode } from "./spin.js";
import { fftmod } from "../fft/FFT.js";
test(() => assert_true(true), "freebie");
promise_test(async () => {
  const m = await fftmod(5);
  const o = new OfflineAudioContext(1, 3000, 3000);
  const sineWave = new Float32Array(
    await (await fetch("sine.pcm")).arrayBuffer()
  ).map((v) => v);
  m.inputPCM(sineWave);
  chart(mkcanvas(), m.getFloatFrequencyData()[1].slice(0, 21), true);
  chart(mkcanvas(), sineWave, false);

  assert_true(
    sineWave.filter((v) => v < 0).length > 1,
    "some fals are negative"
  );
  await SpinNode.init(o);
  const sp = new SpinNode(o, {
    pcm: sineWave,
    loops: [0, sineWave.length / 2],
    zref: 2,
  });

  assert_true(sineWave.byteLength > 1320, "downloaded sien pcm");
  sp.connect(o.destination);
  sp.strideParam.setValueAtTime(12, 0.001);
  sp.strideParam.linearRampToValueAtTime(1111, 0.2);
  sp.strideParam.linearRampToValueAtTime(12, 0.4);

  const ab = await o.startRendering();
  console.log(ab.getChannelData(0));

  chart(mkcanvas(), ab.getChannelData(0), false);
  assert_true(
    ab.getChannelData(0).filter((v) => v < 0).count > 200,
    "some fals are negative"
  );

  assert_true(true);
}, "basic function");
