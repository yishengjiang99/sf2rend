import { mkspinner, SpinNode } from "../index.js";
import { loadProgram, load } from "https://unpkg.com/sf2-service@1.3.0/read.js";
import { spRef2json, egStruct } from "../spin-struct.js";
import { newSFZoneMap } from "https://unpkg.com/sf2-service@1.3.0/zoneProxy.js";
promise_test(async () => {
  const sp = await mkspinner();
  sp.gm_reset();
  assert_equals(sp.ccvals[7], 100);
  assert_equals(sp.ccvals[11], 127);
}, "after reset, default volume is 100 and expression is 127");
promise_test(async () => {
  const sp = await mkspinner();
  sp.gm_reset();
  sp.set_midi_cc_val(0, 7, 127);
  assert_equals(sp.ccvals[7], 127, "volume is changed to 127 for channge 0");

  sp.set_midi_cc_val(1, 11, 0);
  assert_equals(sp.ccvals[128 + 11], 0, "expression is changed to 0 for ch1");
}, "calling set_midi_cc_val changes metric values");

promise_test(async () => {
  const sp = await mkspinner();
  sp.gm_reset();
  assert_equals(sp.kRateAttenuate(20, 127, 127, 127), -20);
}, "calc krate volumn");
