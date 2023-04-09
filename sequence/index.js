import {mkdiv, logdiv, mkdiv2} from "../mkdiv/mkdiv.js";
import {mkui} from "./ui.js";
import SF2Service from "../sf2-service/index.js";
import {fetchmidilist} from "./midilist.js";
import {mkeventsPipe} from "./mkeventsPipe.js";
import {createChannel} from "./createChannel.js";
import {midi_ch_cmds} from "./constants.js";
import runMidiPlayer from "./runmidi.js";
import {sf2list} from "../sflist.js";
import {mkcanvas, chart} from "https://unpkg.com/mk-60fps";
const $ = (sel) => document.querySelector(sel);

const sf2select = $("#sf2select"),
  col4 = $("#col4"),
  col5 = $("#col5");

const drumList = document.querySelector("#drums");
const programList = document.querySelector("#programs");
const navhead = document.querySelector("#navhead");

const {infoPanel, stdout} = logdiv();
infoPanel.attachTo(document.querySelector("#info"));
window.stdout = stdout;
window.stderr = (str) => (document.querySelector("footer").innerHTML = str);

main("./sf2-service/file.sf2");

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
    console.error(e);
    console.error(newArr);
    console.error(e);
  }
}
async function main(sf2file) {
  let sf2, uiControllers, ctx;
  stdout("start");

  const channels = [];

  const midiList = await fetchmidilist();
  const midiSelect = mkdiv2({
    tag: "select",
    style: "width:300px",
    oninput: (e) => {
      e.preventDefault();
    },
    children: [
      mkdiv("option", {name: "select midi", value: null}, "select midi file"),
      ...midiList.map((f) =>
        mkdiv("option", {value: f.get("Url")}, f.get("Name").substring(0, 80))
      ),
    ],
  });
  midiSelect.attachTo($("main"));
  midiSelect.addEventListener("input", (e) => onMidiSelect(e.target.value));

  for (const f of sf2list) sf2select.append(mkdiv("option", {value: f}, f));

  sf2select.onchange = (e) => {
    loadSF2File(e.target.value);
  };
  const {mkpath} = await import("./mkpath.js");

  ctx = new AudioContext();
  const apath = await mkpath(ctx);
  const spinner = apath.spinner;
  sf2select.value = sf2file;

  const eventPipe = mkeventsPipe();
  const ui = mkui(eventPipe, $("#channelContainer"), {
    onTrackDoubleClick: async (channelId, e) => {
      const sp1 = await apath.querySpState({query: 2 * channelId});
      globalThis.stderr(JSON.stringify(sp1, null, 1));
    },
    onEditZone: (editData) => {
      spinner.port.postMessage(editData);
      return apath.subscribeNextMsg((data) => {
        console.log(data);
        return data.zack == "update" && data.ref == editData.update[1];
      });
    },
  });
  uiControllers = ui.controllers;
  for (let i = 0;i < 16;i++) {
    uiControllers[i].hidden = true;

    channels.push(createChannel(uiControllers[i], i, sf2, apath));
  }

  //link pipes

  eventPipe.onmessage(eventsHandler(channels));
  initNavigatorMidiAccess();
  async function initNavigatorMidiAccess() {
    let midiAccess = false; // await navigator.requestMIDIAccess();
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
            Array.from(midiAccess.inputs.values()).find(
              (i) => i.name === e.target.value
            ).onmidimessage = ({data}) => eventPipe.postMessage(data);
          },
        },
        [
          mkdiv("option", {value: null}, "select input"),
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
    }
  }
  ctx.onstatechange = () => updateAppState({audioStatus: ctx.state});

  window.addEventListener(
    "click",
    async () => ctx.state !== "running" && (await ctx.resume()),
    {once: true}
  );

  const ampIndictators = document.querySelectorAll(".amp-indicate");
  spinner.port.onmessage = ({data}) => {
    if (data.spState) col5.innerHTML = JSON.stringify(data.spState);
    if (data.egStages) col4.innerHTML = Object.values(data.egStages).join(" ");
    if (data.queryResponse)
      window.stderr(JSON.stringify(data.queryResponse, null, 1));
    if (data.sp_reflect) {
      for (let i = 0;i < 16;i++) {
        ampIndictators[i].style.setProperty(
          "--db",
          (data.sp_reflect[2 * i * 4] + 960) / 960
        );
      }

      window.stderr(Object.values(data.sp_reflect).join("\n"));
    }
  };
  apath.bindKeyboard(() => ui.activeChannel, eventPipe);
  async function loadSF2File(sf2url) {
    sf2 = new SF2Service(sf2url);
    await sf2.load();
    programList.innerHTML = "";
    drumList.innerHTML = "";
    sf2.programNames.forEach((n, presetIdx) => {
      if (presetIdx < 128) {
        mkdiv2({tag: "option", value: n, children: n}).attachTo(programList);
      } else {
        mkdiv2({tag: "option", value: n, children: n}).attachTo(drumList);
      }
    });
    channels.forEach((c, i) => {
      c.setSF2(sf2);
      if (i != 9) {
        c.setProgram(i << 3, 0);
      } else {
        c.setProgram(0, 128);
      }
    });
    for (const [section, text] of sf2.meta) {
      stdout(section + ": " + text);
    }
  }
  async function onMidiSelect(url) {
    const midiInfo = readMidi(
      new Uint8Array(await (await fetch(url)).arrayBuffer())
    );
    await Promise.all(midiInfo.presets.map(preset => {
      const {pid, channel} = preset;
      const bkid = channel == 10 ? 128 : 0;
      return channels[channel].setProgram(pid, bkid);
    }));
    window.runSequence({
      midiInfo, eventPipe
      rootElement: $("#sequenceroot")
    });
  }

  apath.ctrl_bar(document.getElementById("ctrls"));
  apath.bindToolbar();
  await loadSF2File("sf2-service/file.sf2");
  const cv = mkcanvas({container: $("#stdout")});
  const wvform = mkcanvas({container: $("#stdout")});

  function draw() {
    chart(cv, apath.analysis.frequencyBins);
    chart(wvform, apath.analysis.waveForm);
    requestAnimationFrame(draw);
  }
  draw();
}

function eventsHandler(channels) {
  return function (data) {
    const [a, b, c] = data;
    const cmd = a & 0xf0;
    const ch = a & 0x0f;
    const key = b & 0x7f;
    const velocity = c & 0x7f;
    switch (cmd) {
      case midi_ch_cmds.continuous_change: // set CC
        channels[ch].setCC({key, vel: velocity});
        stdout("midi set cc " + [ch, cmd, key, velocity].join("/"));
        break;
      case midi_ch_cmds.change_program: //change porg
        stdout("midi change program " + [ch, cmd, key, velocity].join("/"));

        channels[ch].setProgram(key, ch == 9 ? 128 : 0);

        break;
      case midi_ch_cmds.note_off:
        channels[ch].keyOff(key, velocity);
        stdout([cmd, ch, key, velocity, "off"].join("|"));

        break;
      case midi_ch_cmds.note_on:
        if (velocity == 0) {
          stdout([cmd.toString(), ch, key, velocity, "off"].join("/"));
          channels[ch].keyOff(key, velocity);
        } else {
          stdout([cmd, ch, key, velocity].join("/"));
          const zone = channels[ch].keyOn(key, velocity);
          //requestAnimationFrame(() => renderZ(panel2, canvas1, zone));
        }
        break;
      default:
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
