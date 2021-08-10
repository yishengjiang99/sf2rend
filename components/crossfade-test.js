import { mkdiv } from "./node_modules/mkdiv/mkdiv.js";

/* eslint-disable no-undef */
import { crossfade } from "./crossfade.js";
import { mkcanvas, chart, renderFrames } from "../chart/chart.js";
const c1 = mkcanvas();
document.body.style.backgroundColor = "black";
test(() => {
  const o = new OfflineAudioContext(1, 0x1000, 0xffff);
  const f = crossfade(o, { fade: 0.5 });
  assert_true(f != null, "fader created");
  const osc = new OscillatorNode(o, { type: "sine", frequency: 1 });
  assert_true(osc != null);
  f.sig1 = osc;
  assert_true(osc.numberOfOutputs == 1, "can connect sig1");
  const osc2 = new OscillatorNode(o, { type: "square", frequency: 1 });
  f.sig2 = osc2;
  assert_true(osc2.numberOfOutputs == 1, "can connect  sig1");
}, "basic");
promise_test(() => {
  const o = new OfflineAudioContext(1, 0x1000, 0xffff);
  const f = crossfade(o);
  f.fade = 0.5;
  f.connect(o.destination);
  return o.startRendering().then(() => {
    assert_true(f.pan.pan.value == 0);
  });
}, "setfade");
test(() => {
  const o = new OfflineAudioContext(1, 4096, 1 << 12);
  const f = crossfade(o);
  f.fade = 0;
  const osc = new OscillatorNode(o, { type: "sine", frequency: 1 });
  f.sig1 = osc;
  const osc2 = new OscillatorNode(o, { type: "square", frequency: 3 });
  f.sig2 = osc2;
  f.connect(o.destination);
  assert_true(o.destination.numberOfInputs == 1, "can connect externally");
  osc2.start();
  osc.start();
  promise_test(async () => {
    const ob = (await o.startRendering()).getChannelData(0);
    chart(c1, ob);
    assert_true(ob[1] >= 0.0);
  });
}, "connecting output");
promise_test(async () => {
  const o = new OfflineAudioContext(1, 4096, 4096);
  const f = crossfade(o);
  f.fade = 0;
  const osc = new OscillatorNode(o, {
    type: "sine",
    frequency: 3,
    gain: 0.5,
  });
  f.sig1 = osc;
  const osc2 = new OscillatorNode(o, { type: "square", frequency: 13 });
  f.sig2 = osc2;
  f.connect(o.destination);
  osc2.start();
  osc.start();
  f.fadeParam.setValueAtTime(-1, 0);
  f.fadeParam.linearRampToValueAtTime(1, 1);
  const ob = (await o.startRendering()).getChannelData(0);
  renderFrames(
    mkcanvas({
      width: 1024,
      height: 1024,
      container: document.querySelector(".hero"),
    }),
    ob,
    12,
    1280
  );
}, "connecting output");
promise_test(async () => {
  const o = await new Promise((resolve) => {
    document.body.appendChild(
      mkdiv("button", { onclick: () => resolve(new AudioContext()) }, [
        "click to continue",
      ])
    );
  });
  const f = crossfade(o);
  f.fade = 0;
  const osc = new OscillatorNode(o, {
    type: "sine",
    frequency: 33,
    gain: 0.5,
  });
  f.sig1 = osc;
  const osc2 = new OscillatorNode(o, { type: "square", frequency: 123 });
  f.sig2 = osc2;
  f.connect(o.destination);
  osc2.start();
  osc.start();
  f.fadeParam.setValueAtTime(-1, 0);
  let dest = 1;
  setInterval(() => {
    f.fadeParam.linearRampToValueAtTime(0.5 + dest / 2, 1.0);
    dest = -1 * dest;
  }, 1000);
}, "realaudio");
