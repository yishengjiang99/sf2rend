import {mkdiv, mkdiv2} from "../mkdiv/mkdiv.js";
import {mkui} from "./ui.js";
import SF2Service from "../sf2-service/index.js";
import {mkeventsPipe} from "./mkeventsPipe.js";
import {createChannel} from "./createChannel.js";
import {DRUMSCHANNEL, ccnames, midi_ch_cmds} from "./constants.js";
import {sf2list} from "../sflist.js";
import {mfilelist} from "../mfilelist.js";
import mkpath from "./mkpath.js";
import {readMidi} from "./midiread.js";
import {mkcanvas, chartRect, chart} from "../chart/chart.js";
import {logdiv, mktabs, mkcollapse} from "./logdiv.js";
import {
  mk_vcf_ctrl,
  mk_vca_ctrl,
  mk_filter_ctrls,
  mk_eq_bar,
} from "./eqslide.js";
import {initNavigatorMidiAccess} from "./initNavigatorMidiAccess.js";

const urlParams = new URLSearchParams(document.location.search);
const sf2file = "static/file.sf2";
const midiUrl = "song.mid";

// import * as sequence from "../dist/sequence.js";
const sf2Loader = loadSF2File(sf2file);

const sf2select = document.querySelector("#sf2select");
const midiSelect = document.querySelector("#midiselect");

const drumList = document.querySelector("#drums");
const programList = document.querySelector("#programs");
const navhead = document.querySelector("header");
const nav2 = document.querySelector("nav");
const analyze = document.querySelector("#analyze");
const debugContainer = document.querySelector("#debug");
const footer = document.querySelector("footer");
const stdoutdiv = document.querySelector("#stdout");
const debugInfo = mkdiv("pre");
const debugInfo2 = mkdiv("pre");
const ffholder = mkdiv("div", {style: "display:flex;flex-direction:row"});
const ff = {container: ffholder, width: 220, height: 150};
const [cv1, cv2, cv3] = [
  mkcanvas({...ff, width: 520, height: 220}),
  mkcanvas(ff, {width: 520, height: 220}),
  mkcanvas(ff),
];
const c3 = mkdiv("canvas", {
  class: "fixed-top-right",
  width: 500,
  height: 50,
});
c3.attachTo(document.body);
const {stdout, infoPanel} = logdiv();
mkcollapse({title: "fft", defaultOpen: true}, ffholder).attachTo(analyze);
mkcollapse({title: "debug", defaultOpen: false}, debugInfo).attachTo(
  debugContainer
);

mkcollapse({title: "debug2", defaultOpen: false}, debugInfo2).attachTo(
  debugContainer
);

mkcollapse({title: "Log Info", defaultOpen: false}, infoPanel).attachTo(
  stdoutdiv
);
window.stdout = stdout;
window.stderr = (str) => (debugInfo.innerHTML = str);

const sf2 = await sf2Loader;
let uiControllers, ctx;

const channels = [];

for (const f of sf2list) sf2select.append(mkdiv("option", {value: f}, f));
sf2select.value = sf2file;
sf2select.onchange = (e) => {
  document.location.href = "?sf2file=" + e.target.value;
};
for (const f of mfilelist)
  midiSelect.append(
    mkdiv("option", {value: f}, decodeURI(f).split("/").pop())
  );

midiSelect.onchange = (e) => {
  document.location.href = "?midiUrl=" + encodeURIComponent(e.target.value);
};

midiSelect.value = midiUrl;
await new Promise((r) => window.addEventListener("keydown", r));
document.querySelector("#landing").remove();
ctx = new AudioContext({
  sampleRate: 48000,
});

const apath = await mkpath(ctx, {
  sf2Service: new SF2Service("file.sf2")
});
const spinner = apath.spinner;
const eventPipe = apath.msgPort;
let nextChannel = 0;

const ui = mkui(apath.msgPort, document.querySelector("#channelContainer"), {
  onTrackDoubleClick: async (channelId, e) => {
    const sp1 = await apath.querySpState({query: 2 * channelId});
  },
  programNames: sf2.programNames,
  onEditZone: (editData) => {
    spinner.port.postMessage(editData);
    return apath.subscribeNextMsg((data) => {
      return data.zack == "update" && data.ref == editData.update[1];
    });
  },
  onTrackClick: (tt) => { },
  onAddChannel: () => channels[nextChannel++].setProgram(0, nextChannel << 3),
});

const {push_ch, tabs} = mktabs({
  group: "set_group",
  container: document.querySelector("#ch_ctr_bar"),
});
uiControllers = ui.controllers;

for (let i = 0;i < 16;i++) {
  channels.push(createChannel(uiControllers[i], i, sf2, apath));

  push_ch(
    "setting_" + i,
    "ch " + i,
    mkdiv("div", [
      mk_filter_ctrls(i),
      mk_vca_ctrl(i, eventPipe),
      mk_vcf_ctrl(i, eventPipe),
    ])
  );
}

document.body.querySelector(".tabs > input")?.setAttribute("checked", "");

if (midiUrl) {
  await onMidionURLSelect(midiUrl);
} else {
  channels[nextChannel++].setProgram(0, 0);
  channels[DRUMSCHANNEL].setProgram(0, 128);
}
initNavigatorMidiAccess({
  container: nav2,
  eventPipe,
  inputChannel: ui.activeChannel,
});
window.addEventListener(
  "click",
  async () => ctx.state !== "running" && (await ctx.resume()),
  {once: true}
);

const ampIndictators = document.querySelectorAll(".amp-indicate");
const setAmpBar = (ch, ampval) =>
  ampIndictators[ch].style.setProperty("--db", ampval);

spinner.port.onmessage = ({data}) => {
  if (data.queryResponse) {
    window.stderr(JSON.stringify(data.queryResponse, null, 1));
  }
  if (data.rend_summary) {
    const {rend_time, rms, now} = data.rend_summary;
    for (let i = 0;i < 16;i++) {
      if (rms[i]) {
        setAmpBar(i, Math.sqrt(rms[i]));
      }
    }
    const {activeSp, spinfo, eg2Info, egInfo} = data.rend_summary;
    const clockdiffs = performance.now() - now * 1000;

    debugInfo2.innerHTML =
      clockdiffs -
      Math.floor(clockdiffs) +
      " " +
      JSON.stringify({activeSp, spinfo, egInfo}, null, 1);

    JSON.stringify(data.rend_summary, null, 1);
  }
};
apath.bindKeyboard(() => ui.activeChannel, eventPipe);
apath.ctrl_bar(document.getElementById("ctrls"));
apath.bindToolbar();
apath.bindReactiveElems();

const cancelFn = apath.detectClips(c3);
draw();
document
  .querySelector("#file-btn")
  .addEventListener("input", async function (e) {
    if (!e.target.files[0]) return;
    const ab = await e.target.files[0].arrayBuffer();
    const midiinfo = readMidi(new Uint8Array(ab));
    onMidiLoaded(midiinfo);
  });

function uiInputs() {
  return {
    onTrackDoubleClick: async (channelId, e) => {
      const sp1 = await apath.querySpState({query: 2 * channelId});
    },
    onEditZone: (editData) => {
      spinner.port.postMessage(editData);
      return apath.subscribeNextMsg((data) => {
        return data.zack == "update" && data.ref == editData.update[1];
      });
    },
    onTrackClick: (tt) => { },
    onAddChannel: () => channels[nextChannel++].setProgram(0, nextChannel << 3),
  };
}

async function loadSF2File(sf2url) {
  const sf2 = new SF2Service(sf2url);
  // sf2select.value = sf2url;
  await sf2.load();
  programList.innerHTML = "";
  drumList.innerHTML = "";
  sf2.programNames.forEach((name, presetIdx) => {
    if (presetIdx < 128) {
      mkdiv2({tag: "option", value: presetIdx, children: name}).attachTo(
        programList
      );
    } else {
      mkdiv2({tag: "option", value: presetIdx, children: name}).attachTo(
        drumList
      );
    }
  });
  for (const [section, text] of sf2.meta) {
    stdout(section + ": " + text.substring(80));
  }
  return sf2;
}
async function onMidionURLSelect(url) {
  const midiInfo = readMidi(
    new Uint8Array(await (await fetch(url)).arrayBuffer())
  );
  await onMidiLoaded(midiInfo);
}
window.onerror = (e) => stdout(e.message);
async function onMidiLoaded(midiInfo) {
  stdout("onMidiLoadedfff " + midiInfo.presets.join(","));
  await Promise.all(
    midiInfo.presets.map((preset) => {
      const {pid, channel} = preset;
      let bkid = channel == DRUMSCHANNEL ? channel : 0;
      if (pid == 0 && channel >= 9) bkid = 128;
      apath.msgPort.postMessage([midi_ch_cmds.change_program | channel, bkid | pid]);
    })
  );
  const rootElement = document.querySelector("#sequenceroot");
  if (window.runSequence)
    window.runSequence({midiInfo, rootElement, eventPipe});
}

function draw() {
  chartRect(cv1, apath.analysis.frequencyBins);
  chart(cv2, apath.analysis.waveForm);
  for (const c of uiControllers) {
    c.rendFrame(ctx.currentTime);
  }

  requestAnimationFrame(draw);
}
