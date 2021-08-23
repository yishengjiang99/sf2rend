/* eslint-disable no-undef */
import { mkspinner, SpinNode } from "./spin.js";
import { loadProgram, load } from "../sf2-service/read.js";
import { renderFrames, mkcanvas } from "../chart/chart.js";
import { spRef2json } from "./spin-struct.js";
import { newSFZoneMap } from "https://unpkg.com/sf2-service@1.3.0/zoneProxy.js";
const sp = await mkspinner();

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

promise_test(async () => {
  assert_true(sp.newSpinner != null);
  const spinner = sp.sampleZone();

  const struct = spRef2json(sp.memory.buffer, spinner);
  const z = newSFZoneMap(1, struct.zone);
  assert_equals(struct.egVolRef.attack, z.VolEnvAttack);
  assert_equals(struct.egVolRef.stage, 1);

  assert_equals(sp.timecent2sample(z.VolEnvDelay), struct.egVolRef.nsamples);
  //sp.spin(spinner, 122s);
}, "eg");
promise_test(async () => {
  const spinner = sp.sampleZone();
  const struct = spRef2json(sp.memory.buffer, spinner);
  const z = newSFZoneMap(1, struct.zone);
  const currentN = struct.egVolRef.nsamples;
  sp.update_eg(struct.egVolRef.ref, 19);
  assert_equals(
    spRef2json(sp.memory.buffer, spinner).egVolRef.nsamples + 19,
    currentN,
    "after runnimg for 19 samples, the nsample s(left) is 19 less"
  );
}, "egvol decibels");

promise_test(async () => {
  const spinner = sp.sampleZone();
  const struct = spRef2json(sp.memory.buffer, spinner);

  const z = newSFZoneMap(1, struct.zoneref);
  const newSp = sp.newSpinner(struct.zoneref, 0);
  assert_true(null != newSp, "method 1 of constructor");
  const struct2 = spRef2json(sp.memory.buffer, newSp);
  sp._eg_set_stage(struct2.egVolRef.ref, 2);
  assert_equals(
    spRef2json(sp.memory.buffer, newSp).egVolRef.stage,
    2,
    "_set_stage to 2 worked"
  );
  assert_true(spRef2json(sp.memory.buffer, newSp).egVolRef.eg > -960);

  console.log(spRef2json(sp.memory.buffer, newSp));
  sp.update_eg(struct2.egVolRef.ref, 100);
  console.log(spRef2json(sp.memory.buffer, newSp).egVolRef.eg);
  sp.update_eg(struct2.egVolRef.ref, 100);
  console.log(spRef2json(sp.memory.buffer, newSp).egVolRef.eg);
  sp.update_eg(struct2.egVolRef.ref, 100);
  console.log(spRef2json(sp.memory.buffer, newSp).egVolRef.eg);
  sp.update_eg(struct2.egVolRef.ref, 100);
  console.log(spRef2json(sp.memory.buffer, newSp).egVolRef.eg);
  assert_true(spRef2json(sp.memory.buffer, newSp).egVolRef.eg > -960);
}, "_set_stage");
