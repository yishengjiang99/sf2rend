import { mkspinner } from "../index.js";

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
  assert_equals(sp.ccvals[128 + 11], 0, "expression is changed to 0 for ch1");
}, "calling set_midi_cc_val changes metric values");

promise_test(async () => {
  const sp = await mkspinner();
  let i = 0;
  while (i < 128) {
    console.log(sp.midi_volume_log10(i++));
  }

  assert_equals(sp.applyCentible(0.6, 0 - sp.midi_volume_log10(0)), 0.0);
  assert_equals(sp.applyCentible(0.6, sp.kRateAttenuate(0, 0, 127, 127)), 0.0);

  const kdb = sp.kRateAttenuate(0, 127, 127, 127);
  assert_equals(kdb, 0);
}, "calc krate asss 2, 127, 127, 127");
