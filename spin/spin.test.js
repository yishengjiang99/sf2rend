/* eslint-disable no-undef */
import { SpinNode } from "./spin.js";
import { loadProgram, load } from "../sf2-service/read.js";
import { renderFrames, mkcanvas } from "../chart/chart.js";

test(() => assert_true(true), "freebie");
// promise_test(async () => {
//   const o = new OfflineAudioContext(1, 0x5000, 0xffff);
//   await SpinNode.init(o);
//   const si = await (await fetch("./sine.pcm")).arrayBuffer();
//   const sp = new SpinNode(o);
//   sp.sample = {
//     zref: 2,
//     shdr: { loops: [4, 4333], hdrRef: 1 },
//   };

//   assert_true(si.byteLength > 11, "downloaded sien pcm");
//   sp.connect(o.destination);
//   sp.strideParam.setValueAtTime(12, 0.001);
//   sp.strideParam.linearRampToValueAtTime(1111, 0.2);
//   sp.strideParam.linearRampToValueAtTime(12, 0.4);

//   const ab = await o.startRendering();
//   console.log(ab.getChannelData(0));

//   assert_true(
//     ab.getChannelData(0).filter((v) => v < 0).length > 2,
//     "some fals are negative"
//   );

//   assert_true(true);
// }, "basic function");

// window.promise_test(async () => {
//   sf2 = await load("../file.sf2");
//   window.assert_equals(sf2.url, "../file.sf2");
//   const o = new OfflineAudioContext(1, 0x5000, 0xffff);
//   await SpinNode.init(o);
//   const sp = new SpinNode(o);
//   const pg = loadProgram(sf2, 0, 0);
//   await sp.shipProgram(loadProgram(pg, 0, 0));
//   pg.filterKV(55, 120).forEach((z) => {
//     sp.keyOn(0, z, 55, 120);
//   });
// }, "fetch drop shit");
(async () => {
  const sf2 = await load("../file.sf2");
  const o = new OfflineAudioContext(1, 0x5000, 0xffff);
  console.log(sf2);
  await SpinNode.init(o);
  const sp = new SpinNode(o);
  const pg = loadProgram(sf2, 0, 0);
  const pg2 = loadProgram(sf2, 128, 0);

  console.log("shipped" + (await sp.shipProgram(pg)));
  console.log("shipped" + (await sp.shipProgram(pg2)));

  pg.filterKV(55, 120).forEach(async (z) => {
    sp.keyOn(1, z, 55, 120);
    sp.keyOn(0, z, 55, 120);
  });
  sp.connect(o.destination);
  o.startRendering().then((ab) => {
    renderFrames(mkcanvas({ title: "Left" }), ab.getChannelData(0), 121, 1200);
    renderFrames(
      mkcanvas({ title: "Righgt" }),
      ab.getChannelData(1),
      112,
      1200
    );
  });
})();
