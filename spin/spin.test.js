/* eslint-disable no-undef */
import { mkspinner, SpinNode } from "./spin.js";
import { loadProgram, load } from "../sf2-service/read.js";
import { renderFrames, mkcanvas } from "../chart/chart.js";
import { spRef2json, egStruct } from "./spin-struct.js";
import { newSFZoneMap } from "https://unpkg.com/sf2-service@1.3.0/zoneProxy.js";

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
}, "freebie");

promise_test(async () => {
  const sp = await mkspinner();

  assert_true(sp.newSpinner != null);
  const spinner = sp.sampleZone();

  const struct = spRef2json(sp.memory.buffer, spinner);
  const z = newSFZoneMap(1, struct.zone);
  assert_equals(struct.egVolRef.attack, z.VolEnvAttack);
  assert_equals(struct.egVolRef.stage, 1);

  assert_equals(sp.timecent2sample(z.VolEnvDelay), struct.egVolRef.nsamples);
  //sp.spin(spinner, 122s);
}, "mk spinner and test basic functions exist.");

promise_test(async () => {
  const sp = await mkspinner();

  const spinner = sp.sampleZone();
  const struct = spRef2json(sp.memory.buffer, spinner);
  console.log(struct);
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
  const sp = await mkspinner();

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
  sp.update_eg(struct2.egVolRef.ref, 100);
  console.log(spRef2json(sp.memory.buffer, newSp));
  assert_true(spRef2json(sp.memory.buffer, newSp).egVolRef.eg > -960);
}, "_set_stage");
promise_test(async () => {
  const sp = await mkspinner();

  assert_equals(sp.timecent2sample(-12000), 46);

  assert_equals(sp.midi_volume_log10(127), 0);
}, "lookup tables");
promise_test(async () => {
  const sp = await mkspinner();
  console.log(sp, sp.timecent2second(1200), sp.applyCentible(0.5, -60));
  const egRef = sp.sbrk(300);
  // typedef struct {
  //   int stage, nsamples_till_next_stage;
  //   short delay, attack, hold, decay, sustain, release, pad1, pad2;
  //   double egval, egIncrement;
  // } EG;
  const egview = new DataView(sp.memory.buffer, egRef, 40);
  egview.setInt16(8, -12000, true);

  egview.setInt16(10, -12000, true);

  egview.setInt16(12, -12000, true);

  egview.setInt16(14, 1200, true);
  egview.setInt16(16, 60, true);
  egview.getInt32(0, true);
  const egs = egStruct(sp.memory.buffer, egRef);
  assert_true(egs.decay == 1200, "decay is 1200 timecents");
  assert_true(sp.timecent2second(egs.decay) == 2, "decay is 2 second");
  assert_true(egs.sustain == 60, "sustain set");

  assert_true(
    sp.applyCentible(0.5, -1 * egs.sustain) - 0.25 < 0.001,
    "almost halving at -60centDB"
  );
  sp._eg_set_stage(egRef, 1);
  console.log(
    sp.timecent2sample(-12000),
    egview.getInt32(0, true),
    egview.getInt32(4, true)
  );
  sp._eg_set_stage(egRef, 4);
  console.log(egview.getInt32(0, true), egview.getInt32(1, true));
  assert_true(egview.getInt32(4, true) == 2 * 48000);
  const egval = sp.update_eg(egRef, egview.getInt32(4, true) / 2);
  assert_true(
    Math.abs(egval + 30) < 0.01,
    "envelope generator returns value of -30centible after spinning for half of decay deuratoin"
  );
  const attenuated =
    sp.applyCentible(0.5, egval) * sp.applyCentible(0.5, egval);
  assert_true(attenuated - 0.25 * 0.25 < 0.1);
  // expect_;
}, "eg decays to -6db over 2 second with linear db decrease");

promise_test(async () => {
  const sp = await mkspinner();
  const egRef = sp.brk;
  const egview = new DataView(sp.memory.buffer, egRef, 40);
  egview.setInt16(8, -12000, true);

  egview.setInt16(10, -12000, true);

  egview.setInt16(12, -12000, true);

  egview.setInt16(14, -12000, true);
  egview.setInt16(16, 0, true);
  sp._eg_set_stage(egRef, 4);
  assert_true(egview.getInt32(0, true) == 4, "set to decay stage");
  assert_true(egview.getFloat64(24, true) == 0);
}, "at 0 sustain value, eg val does not decrease during decay");
