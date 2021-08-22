/* eslint-disable no-undef */
import { SpinNode } from "./spin.js";
import { loadProgram, load } from "../sf2-service/read.js";
import { renderFrames, mkcanvas } from "../chart/chart.js";

promise_test(async () => {
  console.time("shipProgram");
  const ctx = new OfflineAudioContext(1, 100, 4000);
  console.timeLog("shipProgram");

  await SpinNode.init(ctx);
  console.timeLog("shipProgram");

  const sp = new SpinNode(ctx);
  console.timeLog("shipProgram");

  const sf2 = await load("../file.sf2");
  console.timeLog("shipProgram");

  assert_true(sp != null, "sp createdd");
  console.timeLog("shipProgram");
  for (let i = 0; i < 15; i++) {
    const prog = loadProgram(sf2, i * 10, 0);

    //const ret = await sp.shipProgram(prog, i * 10);
    console.timeLog("shipProgram");
  }
  console.timeEnd("shipProgram");
}, "freasebie");
