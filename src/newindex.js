import { mkdiv, mkdiv2, logdiv } from "../mkdiv/mkdiv";
import { SpinNode } from "../spin/spin.js";
import { mkui } from "./ui.js";
import * as sf2Reader from "../sf2-service/read.js";
import { chart, mkcanvas, renderFrames } from "../chart/chart.js";
import { fetchmidilist, fetchSF2List } from "./midilist.js";
import { channel } from "./channel.js";

async function main() {
  let sf2, stdout, uiControllers, spinner, ctx, midiworker;
  midiworker = new Worker("./midiworker.bundle.js", {
    type: "module",
  });
  const cpanel = document.querySelector("#channelContainer");
  const cmdPanel = document.querySelector("#cmdPanel");
  const midiList = await fetchmidilist();
  const midiSelect = mkdiv2({
    type: "select",
    onchange: (e) =>
      midiworker.postMessage({ cmd: "load", url: e.target.value }),
    children: midiList.map((f) =>
      mkdiv("option", { value: f.get("Url") }, f.get("Name").substring(0, 80))
    ),
  });

  const sf2List = await fetchSF2List();
  const sf2select = mkdiv2({
    type: "select",
    onchange: async (e) => {
      sf2 = await sf2Reader.load(e.target.value);
    },
    children: sf2List.map((f) => mkdiv("option", { value: f.url }, f.name)),
  });
  cmdPanel.append("sf2select");
  cmdPanel.append(sf2select);
  cmdPanel.append(midiSelect);
  const eventPipe = mkeventsPipe();
  uiControllers = mkui(cpanel, eventPipe);
  sf2 = await sf2Reader.load(sf2List[0].url);

  ctx = new AudioContext({ sampleRate: 48000 });
  await SpinNode.init(ctx);
  spinner = new SpinNode(ctx);
  const masterMixer = new GainNode(ctx, { gain: 2.0 });
  spinner.connect(masterMixer).connect(ctx.destination);
}
function loadProgramToChannel(sf2, channel, pid, bid) {
  const sf2pg = sf2Reader.loadProgram(sf2, bid, pid);
  uiControllers[channel].name = sf2.programNames[pid | bid];
}

function mkeventsPipe() {
  const _arr = [];
  let _fn;
  return {
    onmessage(fn) {
      _fn = fn;
    },
    postMessage(item) {
      _arr.push(item);
      if (_fn) _fn(_arr.shift());
    },
  };
}

main();
