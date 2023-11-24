import { mkdiv, mkdiv2 } from "../mkdiv/mkdiv.js";
import { mkui } from "./ui.js";
import SF2Service from "../sf2-service/index.js";
import { fetchmidilist } from "./midilist.js";
import { mkeventsPipe } from "./mkeventsPipe.js";
import { createChannel } from "./createChannel.js";
import { DRUMSCHANNEL, midi_ch_cmds } from "./constants.js";
import { sf2list } from "../sflist.js";
import { mfilelist } from "../mfilelist.js";

import { readMidi } from "./midiread.js";
import { mkcanvas, chartRect, chart } from "../chart/chart.js";
// import * as sequence from "../dist/sequence.js";
import { logdiv, mktabs, mkcollapse } from "./logdiv.js";
import { mk_vcf_ctrl, mk_vca_ctrl, mk_filter_ctrls } from "./eqslide.js";
import { initNavigatorMidiAccess } from "./initNavigatorMidiAccess.js";
function $(sel) {
  return document.querySelector(sel);
}

const sf2select = $("#sf2select");

const drumList = document.querySelector("#drums");
const programList = document.querySelector("#programs");
const analyze = document.querySelector("#analyze");
const debugContainer = document.querySelector("#debug");
const footer = document.querySelector("footer");

const stdoutdiv = document.querySelector("#stdout");
const debugInfo = mkdiv("pre");
const ctrbar = mkdiv("div");
const debugInfo2 = mkdiv("pre");

const ffholder = mkdiv("div", { style: "display:flex;flex-direction:row" });
const ff = { container: ffholder, width: 220, height: 150 };
const [cv1, cv2, cv3] = [
  mkcanvas({ ...ff, width: 520, height: 220 }),
  mkcanvas(ff, { width: 520, height: 220 }),
  mkcanvas(ff),
];
const c3 = mkdiv("canvas", {
  class: "fixed-top-right",
  width: "500",
  height: "50",
});
c3.attachTo(document.body);
const { stdout, infoPanel } = logdiv();
mkcollapse({ title: "fft", defaultOpen: true }, ffholder).attachTo(analyze);
mkcollapse({ title: "debug", defaultOpen: false }, debugInfo).attachTo(
  debugContainer
);
mkcollapse({ title: "ctr", defaultOpen: false }, ctrbar).attachTo(
  document.querySelector("#ch_ctrl_bar")
);
mkcollapse({ title: "debug2", defaultOpen: false }, debugInfo2).attachTo(
  debugContainer
);

mkcollapse({ title: "Log Info", defaultOpen: false }, infoPanel).attachTo(
  stdoutdiv
);
const rend_took_len = [];
window.stdout = stdout;
window.stderr = (str) => (debugInfo.innerHTML = str);
const midiUrl = new URL(document.location).searchParams.get("midi");

let sf2, uiControllers, ctx;
stdout("start");

const channels = [];

const midiList = await fetchmidilist();
stdout(midiList[0].Url + "  ");

const mUrl = midiUrl
  ? midiList.map((f) => f.Url).find((f) => f.includes(midiUrl))
  : "";

for (const f of sf2list) sf2select.append(mkdiv("option", { value: f }, f));

sf2select.onchange = (e) => {
  loadSF2File(e.target.value);
};
const { mkpath } = await import("./mkpath.js");

const midiSelect = mkdiv2({
  tag: "select",
  style: "width:300px",
  oninput: (e) => {
    e.preventDefault();
  },
  children: [
    mkdiv("option", { name: "select midi", value: null }, "select midi file"),
    ...mfilelist.map((f) =>
      mkdiv("option", { value: f }, decodeURI(f).split("/").pop())
    ),
    ...midiList.map((f) => mkdiv("option", { value: f.Url, name: f.Name })),
  ],
});

midiSelect.attachTo($("#midilist"));
midiSelect.addEventListener("input", (e) => onMidionURLSelect(e.target.value));
ctx = new AudioContext({
  sampleRate: 44100,
});

await ctx.suspend();

export const eventPipe = mkeventsPipe();
const apath = await mkpath(ctx, eventPipe);
const spinner = apath.spinner;
stdout("murl " + mUrl);

let nextChannel = 0;

export const ui = mkui(eventPipe, $("#channelContainer"), {
  onTrackDoubleClick: async (channelId, e) => {
    const sp1 = await apath.querySpState({ query: 2 * channelId });
    globalThis.stderr(JSON.stringify(sp1, null, 1));
  },
  onEditZone: (editData) => {
    spinner.port.postMessage(editData);
    return apath.subscribeNextMsg((data) => {
      return data.zack == "update" && data.ref == editData.update[1];
    });
  },
  onTrackClick: (tt) => {},
  onAddChannel: () => channels[nextChannel++].setProgram(0, nextChannel << 3),
});

const { push_ch, tabs } = mktabs({ group: "set_group", container: ctrbar });
uiControllers = ui.controllers;
ui.mkKeyboard.attachTo(footer);

for (let i = 0; i < 16; i++) {
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

document.body.querySelector(".tabs > input").setAttribute("checked", "");

await loadSF2File("./static/VintageDreamsWaves-v2.sf2");
onMidionURLSelect(mUrl);
if (mUrl) {
  await onMidionURLSelect(mUrl);
} else {
  channels[nextChannel++].setProgram(0, 0);
  channels[DRUMSCHANNEL].setProgram(0, 128);
}

// mk_eq_bar(0, apath.eq_set).attachTo(document.querySelector("eq"));
//link pipes
eventPipe.onmessage(function (dd) {
  let data;
  if (dd.length <= 3) {
    const [a, b, c] = dd;
    data = [a & 0xf0, a & 0x0f, b, c];
  }
  const [cmd, ch, v1, v2] = data;
  const [key, velocity] = [v1, v2];

  switch (cmd) {
    case midi_ch_cmds.continuous_change: // set CC
      spinner.port.postMessage([cmd, ch, v1, v2]);
      break;
    case midi_ch_cmds.change_program: //change porg
      if (v1 == 0 && ch >= 0) {
        channels[ch].setProgram(v1, 128);
      } else {
        channels[ch].setProgram(v1, ch === DRUMSCHANNEL ? 128 : 0);
      }
      break;
    case midi_ch_cmds.note_on:
      if (velocity == 0) {
        channels[ch].keyOff(key, velocity);
        uiControllers[ch].keyOff(key, velocity, ctx.currentTime);
      } else {
        channels[ch].keyOn(key, velocity);
        uiControllers[ch].keyOn(key, velocity, ctx.currentTime);
      }
      break;
    case midi_ch_cmds.note_off:
      channels[ch].keyOff(key, velocity);

      uiControllers[ch].keyOff(key, velocity, ctx.currentTime);

      break;

    case midi_ch_cmds.pitchbend:
      spinner.port.postMessage(data);
      //stdout("PITCH BEND " + [ch, cmd.toString(16), b, c].join("/"));
      break;
    default:
      spinner.port.postMessage(data);
      //stdout("midi cmd: " + [ch, cmd, b, c].join("/"));
      break;
  }
});

//  eventPipe.onmessage(eventsHandler(channels, spinner, last_rend_end_at, ctx));
initNavigatorMidiAccess();
window.addEventListener(
  "click",
  async () => ctx.state !== "running" && (await ctx.resume()),
  { once: true }
);

const ampIndictators = document.querySelectorAll(".amp-indicate");
const setAmpBar = (ch, ampval) =>
  ampIndictators[ch].style.setProperty("--db", ampval);

spinner.port.onmessage = ({ data }) => {
  if (data.queryResponse) {
    window.stderr(JSON.stringify(data.queryResponse, null, 1));
  }
  if (data.rend_summary) {
    const { rend_time, rms, now } = data.rend_summary;
    for (let i = 0; i < 16; i++) {
      if (rms[i]) {
        setAmpBar(i, Math.sqrt(rms[i]));
      }
    }
    const { activeSp, spinfo, eg2Info, egInfo } = data.rend_summary;
    const clockdiffs = performance.now() - now * 1000;

    debugInfo2.innerHTML =
      clockdiffs -
      Math.floor(clockdiffs) +
      " " +
      JSON.stringify({ activeSp, spinfo, egInfo }, null, 1);

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

async function loadSF2File(sf2url) {
  sf2 = new SF2Service(sf2url);
  // sf2select.value = sf2url;
  await sf2.load();
  programList.innerHTML = "";
  drumList.innerHTML = "";
  sf2.programNames.forEach((n, presetIdx) => {
    if (presetIdx < 128) {
      mkdiv2({ tag: "option", value: presetIdx, children: n }).attachTo(
        programList
      );
    } else {
      mkdiv2({ tag: "option", value: presetIdx, children: n }).attachTo(
        drumList
      );
    }
  });
  channels.forEach((c, i) => {
    c.setSF2(sf2);
  });
  for (const [section, text] of sf2.meta) {
    stdout(section + ": " + text.substring(80));
  }
}
async function onMidionURLSelect(url) {
  stdout("loading " + url);
  const midiInfo = readMidi(
    new Uint8Array(await (await fetch(url)).arrayBuffer())
  );
  console.log("mididurl sel");
  await onMidiLoaded(midiInfo);
}
window.onerror = (e) => stdout(e.message);
async function onMidiLoaded(midiInfo) {
  stdout("onMidiLoadedfff " + midiInfo.presets.join(","));
  await Promise.all(
    midiInfo.presets.map((preset) => {
      const { pid, channel } = preset;
      let bkid = channel == DRUMSCHANNEL ? channel : 0;

      if (pid == 0 && channel >= 9) bkid = 128;
      const program = channels[channel].setProgram(pid, bkid);
      stdout("loading " + program.name);
    })
  );
  const rootElement = $("#sequenceroot");
  if (window.runSequence)
    window.runSequence({ midiInfo, rootElement, eventPipe });
}

function draw() {
  chartRect(cv1, apath.analysis.frequencyBins);
  chart(cv2, apath.analysis.waveForm);
  chart(cv3, rend_took_len);
  for (const c of uiControllers) {
    // if (!c.active) continue;
    c.rendFrame(ctx.currentTime);
  }

  requestAnimationFrame(draw);
}
