import {mkdiv, mkdiv2} from "../mkdiv/mkdiv.js";
import {mkui} from "./ui.js";
import SF2Service from "../sf2-service/index.js";
import {fetchSF2List, fetchmidilist} from "./midilist.js";
import {mkeventsPipe} from "./mkeventsPipe.js";
import {createChannel} from "./createChannel.js";
import {DRUMSCHANNEL, ccnames, midi_ch_cmds} from "./constants.js";
import {sf2list} from "../sflist.js";
import {mfilelist} from "../mfilelist.js";

import {readMidi} from './midiread.js'
import {mkcanvas, chartRect, chart} from "../chart/chart.js";
import * as sequence from "../dist/sequence.js"
import {logdiv, mktabs, mkcollapse} from "./logdiv.js";
import {mk_vcf_ctrl, mk_vca_ctrl, mk_filter_ctrls, mk_eq_bar} from "./eqslide.js";
function $(sel) {
  return document.querySelector(sel);
}



const sf2select = $("#sf2select"),
  col4 = $("#col4"),
  col5 = $("#col5");

const drumList = document.querySelector("#drums");
const programList = document.querySelector("#programs");
const navhead = document.querySelector("header");
const analyze = document.querySelector("#analyze");
const maindiv = document.querySelector("main");
const debugContainer = document.querySelector("#debug"); const footer = document.querySelector("footer")

const stdoutdiv = document.querySelector("#stdout");
const debugInfo = mkdiv("pre");
const ctrbar = mkdiv("div");
const debugInfo2 = mkdiv("pre");

const debugInfo3 = mkdiv("div");
const ffholder = mkdiv("div", {style: "display:flex;flex-direction:row"});
const ff = {container: ffholder, width: 220, height: 150}
const [cv1, cv2, cv3] = [mkcanvas({...ff, width: 520, height: 220}), mkcanvas(ff, {width: 520, height: 220}), mkcanvas(ff)];
const c3 = mkdiv("canvas", {class: "fixed-top-right", width: "500", height: "50"});
c3.attachTo(document.body);
const {stdout, infoPanel} = logdiv();
mkcollapse({title: "fft", defaultOpen: true}, ffholder).attachTo(analyze);
mkcollapse({title: "ctrlbar", defaultOpen: false}, ctrbar).attachTo(document.querySelector("#ch_ctrl_bar"));
mkcollapse({title: "debug", defaultOpen: false}, debugInfo).attachTo(debugContainer);
mkcollapse({title: "debug2", defaultOpen: false}, debugInfo2).attachTo(debugContainer);

mkcollapse({title: "debug3", defaultOpen: false}, debugInfo3).attachTo(debugContainer);
mkcollapse({title: "Log Info", defaultOpen: true}, infoPanel).attachTo(stdoutdiv);
const rend_took_len = [];
window.stdout = stdout;
window.stderr = (str) => debugInfo.innerHTML = str;
window.stderrr = (str) => {/*devnull*/} //stderrrdiv.innerHTML = str;

main();
const appState = {};
globalThis.appState = new Proxy(appState, {
  get(target, attr) {
    return target[attr];
  },
  set(target, attr, value) {
    target[attr] = value;
    infoPanel.innerHTML = JSON.stringify(appState);
    return true;
  },
});
function updateAppState(newArr) {
  try {
    globalThis.appState = Object.assign({}, globalThis.appState, newArr);
  } catch (e) {
    console.error(newArr);
  }
}
async function main(sf2file) {
  let sf2, uiControllers, ctx, clock_diff_baseline, last_rend_end_at;
  stdout("start");

  const channels = [];

  const midiList = await fetchmidilist();

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
      ...midiList.map((f) =>
        mkdiv("option", { value: f.get("Url") }, f.get("Name").substring(0, 80))
      ),
    ],
  });

  midiSelect.attachTo($("#midilist"));
  midiSelect.addEventListener("input", (e) => onMidiSelect(e.target.value));
  ctx = new AudioContext({
    sampleRate: 44100,
  });

  await ctx.suspend();
  ctx.addEventListener(
    "statechange",
    () => {
      clock_diff_baseline = performance.now() - ctx.currentTime * 1000;
    },
    { once: true }
  );

  const eventPipe = mkeventsPipe();
  const apath = await mkpath(ctx, eventPipe);
  const spinner = apath.spinner;
  sf2select.value = sf2file;

  const ui = mkui(eventPipe, $("#channelContainer"), {
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
    onTrackClick: (channelId) => {
      document.body
        .querySelectorAll(`.tabs > input`)
        [channelId].setAttribute("checked", "");
    },
  });

  uiControllers = ui.controllers;

  for (let i = 0; i < 16; i++) {
    channels.push(createChannel(uiControllers[i], i, sf2, apath));
    const { push_ch, tabs } = mktabs({
      ch: i,
      container: ctrbar,
      id: "mi " + i,
    });
    push_ch(
      i,
      "ch " + i,
      mkdiv("div", [
        mk_filter_ctrls(i),
        mk_vca_ctrl(i, eventPipe),
        mk_vcf_ctrl(i, eventPipe),
      ])
    );
    tabs.attachTo(ctrbar);
  }
  document.body.querySelector(".tabs > input").setAttribute("checked", "");

  const sf2loadWait = await loadSF2File("./static/file.sf2");
  mk_eq_bar(0, apath.eq_set).attachTo(document.querySelector("eq"));

  //link pipes
  eventPipe.onmessage(eventsHandler(channels, spinner));
  initNavigatorMidiAccess();
  async function initNavigatorMidiAccess() {
    let midiAccess = await navigator.requestMIDIAccess();
    if (!midiAccess) {
      // eslint-disable-next-line no-unused-vars
      midiAccess = await new Promise((resolve, reject) => {
        mkdiv(
          "button",
          {
            onclick: async (e) => {
              e.target.parentElement.removeChild(e.target);
              resolve(await navigator.requestMIDIAccess());
            },
          },
          "link midi"
        ).attachTo(navhead);
      });
    }
    if (midiAccess) {
      mkdiv(
        "select",
        {
          oninput: (e) => {
            Array.from(midiAccess.inputs.values()).find().onmidimessage = ({
              data,
            }) => eventPipe.postMessage(data);
          },
        },
        [
          mkdiv("option", { value: null }, "select input"),
          ...Array.from(midiAccess.inputs.values()).map((input) =>
            mkdiv(
              "option",
              {
                value: input.name,
                text: input.name,
              },
              input.name
            )
          ),
        ]
      ).attachTo(navhead);
      Array.from(midiAccess.inputs.values())[0].onmidimessage = ({ data }) => {
        data[0] |= ui.activeChannel;
        eventPipe.postMessage(data);
      };
    }
  }
  ctx.onstatechange = () => updateAppState({ audioStatus: ctx.state });

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
      if (rend_took_len.length > 4800) rend_took_len = [];
      const took = now - last_rend_end_at;
      const { activeSp, spinfo, eg2Info, egInfo } = data.rend_summary;
      const clockdiffs = performance.now() - now * 1000;

      debugInfo2.innerHTML =
        clockdiffs -
        Math.floor(clockdiffs) +
        " " +
        JSON.stringify({ activeSp, spinfo, egInfo }, null, 1);

      last_rend_end_at = now;
      JSON.stringify(data.rend_summary, null, 1);
    }
  };
  apath.bindKeyboard(() => ui.activeChannel, eventPipe);
  async function loadSF2File(sf2url) {
    sf2 = new SF2Service(sf2url);
    sf2select.value = sf2url;
    await sf2.load();
    programList.innerHTML = "";
    drumList.innerHTML = "";
    sf2.programNames.forEach((n, presetIdx) => {
      if (presetIdx < 128) {
        mkdiv2({ tag: "option", value: n, children: n }).attachTo(programList);
      } else {
        mkdiv2({ tag: "option", value: n, children: n }).attachTo(drumList);
      }
    });
    channels.forEach((c, i) => {
      c.setSF2(sf2);
      if (i != DRUMSCHANNEL) {
        c.setProgram(i << 3, 0);
      } else {
        c.setProgram(0, 128);
      }
    });
    for (const [section, text] of sf2.meta) {
      //stdout(section + ": " + text);
    }
  }
  async function onMidiSelect(url) {
    const midiInfo = readMidi(
      new Uint8Array(await (await fetch(url)).arrayBuffer())
    );
    onMidiLoaded(midiInfo);
  }
  async function onMidiLoaded(midiInfo) {
    await Promise.all(
      midiInfo.presets.map((preset) => {
        const { pid, channel } = preset;
        const bkid = channel == DRUMSCHANNEL ? 120 : 0;
        return channels[channel].setProgram(pid, bkid);
      })
    );
    const rootElement = $("#sequenceroot");
    runSequence({ midiInfo, rootElement, eventPipe });
  }

  apath.ctrl_bar(document.getElementById("ctrls"));
  apath.bindToolbar();
  apath.bindReactiveElems();

  const cancelFn = apath.detectClips(c3);

  function draw() {
    chartRect(cv1, apath.analysis.frequencyBins);
    chart(cv2, apath.analysis.waveForm);
    chart(cv3, rend_took_len);

    requestAnimationFrame(draw);
  }
  draw();
  maindiv.classList.remove("hidden");
  document
    .querySelector("#file-btn")
    .addEventListener("input", async function (e) {
      if (!e.target.files[0]) return;
      const ab = await e.target.files[0].arrayBuffer();
      const midiinfo = readMidi(new Uint8Array(ab));
      onMidiLoaded(midiinfo);
    });
}

function eventsHandler(channels, spinner) {
  return function hm(data) {
    if (data.length <= 3) {
      const [a, b, c] = data;
      return hm([a & 0xf0, a & 0x0f, b, c]);
    }
    const [cmd, ch, v1, v2] = data;
    const [key, velocity] = [v1, v2];

    switch (cmd) {
      case midi_ch_cmds.continuous_change: // set CC
        const [cc, val] = [v1, v2];

        spinner.port.postMessage([cmd, ch, v1, v2]);
        channels[ch].setCC({ cc, val });
        break;
      case midi_ch_cmds.change_program: //change porg
        channels[ch].setProgram(key);
        break;
      case midi_ch_cmds.note_off:
        channels[ch].keyOff(key, velocity);
        break;
      case midi_ch_cmds.note_on:
        if (velocity == 0) {
          channels[ch].keyOff(key, velocity);
        } else {
          const zone = channels[ch].keyOn(key, velocity);
          requestAnimationFrame(() =>
            debugInfo3.replaceChildren(renderZone(zone))
          );
        }
        break;
      case midi_ch_cmds.pitchbend:
        spinner.port.postMessage(data);
        stdout("PITCH BEND " + [ch, cmd.toString(16), b, c].join("/"));
        break;
      default:
        spinner.port.postMessage(data);
        stdout("midi cmd: " + [ch, cmd, b, c].join("/"));
        break;
    }
  };
}

function onMidiMeta(stderr, e) {
  const metalist = [
    "seq num",
    "text",
    "cpyrght",
    "Track Name",
    "lyrics",
    "instrument",
    "marker",
    "cue point",
  ];
  const metaDisplay = (num) => {
    if (num < 8) return metalist[num];
    switch (num) {
      case 0x20:
        return "mc";
      case 0x21:
        return "port: ";
      case 0x2f:
        return "end of tack";
      case 0x51:
        return "tempo";
      case 0x54:
        return "SMPTE offset";
      case 0x58:
        return "time signature";
      case 0x59:
        return "Key Sig";
      default:
        return parseInt(num).toString(16);
    }
  };
  stderr(metaDisplay(e.data.meta) + ": " + e.data.payload);
}
function renderZone(zoneSelect) {
  return mkdiv("div", [
    renderSampleView(zoneSelect),
    ..."Attenuation,VolEnv,Filter,LFO"
      .split(",")
      .map((keyword) => renderArticle(keyword, zoneSelect)),
  ]);
}
function renderSampleView(zoneSelect) {
  return mkdiv("div", [
    "smpl: ",
    zoneSelect.shdr.SampleId,
    " ",
    zoneSelect.shdr.name,
    "<br>nsample: ",
    zoneSelect.shdr.nsamples,
    "<br>originalPitch: " + zoneSelect.shdr.originalPitch,
    "<br>Range: ",
    zoneSelect.shdr.range.join("-"),
    "<br>",
    "loop: ",
    zoneSelect.shdr.loops.join("-"),
    "<br>",
    JSON.stringify(zoneSelect.KeyRange),
    "<br>",
    JSON.stringify(zoneSelect.VolRange),
  ]);
}
function renderArticle(keyword, zoneObj) {
  let canvas;
  const zattrs = Object.entries(zoneObj).filter(([k]) => k.includes(keyword));

  const attrVals = mkdiv(
    "ul",
    zattrs.map(([k, v]) =>
      mkdiv("li", [
        mkdiv("label", [k, ":"]),
        mkdiv("code", [v]),
        mkdiv("input", {
          type: "range",
          ...min_max_vals(k),
          value: v,
          oninput: (e) => {
            e.target.parentElement.querySelector("code").textContent =
              e.target.value;
            zoneObj[k] = e.target.value;
          },
        }),
      ])
    )
  );
  const details = mkdiv("div");
  const article = mkdiv("article", {class: "article"}, [attrVals, details]);
  return article;
}
function min_max_vals(k) {
  if (k.includes("Sustain")) {
    return {min: 0, max: 1000, step: 10};
  } else
    return {
      min: -12000,
      max: 5000,
      step: 10,
    };
}