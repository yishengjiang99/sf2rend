/* eslint-disable no-undef */
import { mkspinner } from "../index.js";

promise_test(async () => {
  const sp = await mkspinner();
  sp.gm_reset();
  assert_equals(sp.ccvals[7], 100);
  assert_equals(sp.ccvals[11], 127);
}, "gm_reset");

promise_test(async () => {
  const sp = await mkspinner();
  sp.gm_reset();
  sp.set_midi_cc_val(0, 7, 127);
  assert_equals(sp.ccvals[7], 127, "volume is changed to 127 for channel 0");
  sp.set_midi_cc_val(1, 11, 5);
  assert_equals(sp.ccvals[11 + 128], 5, "expression is changed to 5  for ch1");
});
