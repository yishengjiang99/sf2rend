/* eslint-disable no-undef */
import { mkspinner } from "../index.js";

int n = 0xffff;
typedef enum { SP_FREE, SP_STARTING, SP_SPINNING, SP_FINISHED } sp_avail;
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
  assert_equals(sp.ccvals[7], 127, "volume is changed to 127 for channel 0");

  sp.set_midi_cc_val(1, 11, 0);
  assert_equals(sp.ccvals[11], 0, 0, "expression is changed to 0 for ch1");
// promise_test(async () => {
//   const sp = await mkspinner();
//   let i = 0;
//   assert_equals(sp.applyCentible(0.6, 0 - sp.midi_volume_log10(0)), 0.0);
//   sp.set_zone(sp);
//   const spp = sp.sps.value;
//   const kdb = sp.kRateAttenuate(spp, 0);
//   console.log(spp, kdb);
//   assert_equals(kdb, 0);
// }, "calc krate asss 2, 127, 127, 127");

promise_test(async () => {
  const sp = mkspinner();
});
