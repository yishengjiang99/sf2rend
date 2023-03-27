/* eslint-disable no-undef */
import { mkspinner } from "../index.js";
//prettier-ignore
const sampleZone=new Int16Array([
    0,      0,   0,    0,     0,      0,      0,      0,      10216,  0,
    0,      0,   0,    0,     2501,   0,      0,      0,      2060,   0,
    0,      0,   -536, 0,     -1133,  -12000, -12000, -12000, -12000, 0,
    -12000, 0,   0,    1480,  -12000, -12000, 3216,   470,    -8784,  0,
    0,      291, 0,    14080, 15360,  0,      -1,     -1,     -7740,  0,
    0,      -12, 0,    176,   1,      0,      100,    0,      68,     0]);
promise_test(async () => {
  const sp = await mkspinner();
  sp.setZone(4, sampleZone);
  assert_true(sp.getZone(4)[38] == sampleZone[38]);
  const sp1 = sp.newSpinner(1);
  sp.set_spinner_zone(sp1, sp.zoneRef(0));
});

promise_test(async () => {
  const sp = await mkspinner();

  sp.setZone(440, sampleZone);
  const p5 = sp.newSpinner(5);
  sp.set_spinner_zone(p5, sp);
  sp.setZoneAttribute(440, 43, 55 | (55 >> 7));
}, "can set zone attribbute");
