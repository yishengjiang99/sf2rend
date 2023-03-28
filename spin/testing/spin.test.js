/* eslint-disable no-undef */
import { mkspinner } from "../index.js";

(async () => {
  const sp = await mkspinner();

  let sp1 = sp.newSpinner();
  console.log(sp.spinners[1]);
})();

// promise_test(async () => {
//   const sp = await mkspinner();
//   sp.gm_reset();
//   let sp1 = sp.newSppiner(1);
//   console.log(sp.spinners[1]);
//   assert_true(sp.spinners[0].length > 0);
//   assert_true(sp.sp_byte_len() > 20);
//   console.log(sp.zones[0]);
//   assert_true(null != sp1, "method 1 of constructor");
//   assert_true(null != sp1.volEG, "method 1 of constructor");
//   assert_true(null != sp.zones[0], "zones array esist");
// }, "_set_stage");

// promise_test(async () => {
//   const sp = await mkspinner();
//   const sp3 = sp.newSpinner(3);

//   sp.spinners[3].zone.Attenuation = 3;
//   sp.trigger_attack(sp.spRef(3), 0.8, 4);
//   sp.spinners[3].zone.VolEnvAttack = -12000;
//   console.log(sp.spinners[3].volEG, "sp3ref");
//   assert_equals(sp.spinners[3].volEG, 1); //init, not inacgtive;

//   assert_equals(sp.timecent2sample(-12000), 43);

//   assert_equals(sp.midi_volume_log10(127), 0);
// }, "lookup tables");
// promise_test(async () => {
//   const sp = await mkspinner();
//   console.log(sp, sp.timecent2second(1200), sp.applyCentible(0.5, -60));
//   const egRef = sp.malloc(300);
//   // typedef struct {
//   //   int stage, nsamples_till_next_stage;
//   //   short delay, attack, hold, decay, sustain, release, pad1, pad2;
//   //   double egval, egIncrement;
//   // } EG;
//   const egview = new DataView(sp.memory.buffer, egRef, 40);
//   egview.setInt16(8, -12000, true);

//   egview.setInt16(10, -12000, true);

//   egview.setInt16(12, -12000, true);

//   egview.setInt16(14, 1200, true);
//   egview.setInt16(16, 60, true);
//   egview.getInt32(0, true);
//   const egs = egStruct(sp.memory.buffer, egRef);
//   assert_true(egs.decay == 1200, "decay is 1200 timecents");
//   assert_true(sp.timecent2second(egs.decay) == 2, "decay is 2 second");
//   assert_true(egs.sustain == 60, "sustain set");

//   assert_true(
//     sp.applyCentible(0.5, -1 * egs.sustain) - 0.25 < 0.001,
//     "almost halving at -60centDB"
//   );
//   sp._eg_set_stage(egRef, 1);
//   console.log(
//     sp.timecent2sample(-12000),
//     egview.getInt32(0, true),
//     egview.getInt32(4, true)
//   );
//   sp._eg_set_stage(egRef, 4);
//   console.log(egview.getInt32(0, true), egview.getInt32(1, true));
//   assert_true(egview.getInt32(4, true) == 2 * 48000);
//   const egval = sp.update_eg(egRef, egview.getInt32(4, true) / 2);
//   assert_true(
//     Math.abs(egval + 30) < 0.01,
//     "envelope generator returns value of -30centible after spinning for half of decay deuratoin"
//   );
//   const attenuated =
//     sp.applyCentible(0.5, egval) * sp.applyCentible(0.5, egval);
//   assert_true(attenuated - 0.25 * 0.25 < 0.1);
//   // expect_;
// }, "eg decays to -6db over 2 second with linear db decrease");

// promise_test(async () => {
//   const sp = await mkspinner();
//   const egRef = sp.malloc(120);
//   const egStag = new DataView(sp.memory.buffer, egRef, 20);
//   const egview = new DataView(sp.memory.buffer, egRef + 20, 32);
//   egStag.setInt32(16, 1);
//   egview.setInt16(0, -12000, true);

//   egview.setInt16(4, -12000, true);

//   egview.setInt16(8, -12000, true);

//   egview.setInt16(10, -12000, true);
//   sp._eg_set_stage(egRef, 4);
//   assert_true(egStag.getInt32(16, true) == 4, "set to decay stage");
//   assert_true(egview.getFloat64(24, true) == 0);
// }, "at 0 sustain value, eg val does not decrease during decay");
