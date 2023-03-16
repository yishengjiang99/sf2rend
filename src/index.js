import { mkdiv, logdiv, mkdiv2 } from "https://unpkg.com/mkdiv@3.1.2/mkdiv.js";

import { SpinNode } from "../spin/spin.js";
import { mkui } from "./ui.js";
import SF2Service from "https://unpkg.com/sf2-service@1.3.5/index.js";
import { chart, mkcanvas, renderFrames } from "../chart/chart.js";
import { fetchmidilist, fetchSF2List } from "./midilist.js";
import { mkeventsPipe } from "./mkeventsPipe.js";
import { createChannel } from "./createChannel.js";
import { midi_ch_cmds } from "./midilist.js";

const getParams = new URLSearchParams(document.location.search);
main(
  getParams.get("sf2file") || "https://unpkg.com/sf2-service@1.3.5/file.sf2",
  getParams.get("midifile") || "https://grep32bit.blob.core.windows.net/midi/billie.mid");


async function main(sf2file, midifile) {
  let sf2,
    uiControllers,
    ctx = new AudioContext({ sampleRate: 48000 }),
    midiworker = new Worker("src/midiworker.js", {
      type: "module",
    });

  const channels = [];
  const $ = (sel) => document.querySelector(sel);
  const sf2select = $("#sf2select"),
    timeslide = $("#timeSlider"),
    playBtn = $("#play"),
    pauseBtn = $("#stop"),
    timeNow = $("#timeNow"),
    tempo = $("#tempo"),
    duration = $("#duration"),
    timeSig = $("#timeSig"),
    msel = $("#msel");
  let qnPerBeat = 4;

  const drumList = document.querySelector("#drums");
  const programList = document.querySelector("#programs");
  const {infoPanel,errPanel,stdout,stderr} = logdiv();
  infoPanel.attachTo(document.querySelector("#stdout"));
  errPanel.attachTo(document.querySelector("#stderr"));

  midiworker.addEventListener("message", async function (e) {
    if (e.data.midifile) {
      const { totalTicks, tracks, presets } = e.data.midifile;
      const queues=[[],[],[]];
      const [l1,l2,l3]=queues;
      for (const preset of presets) {
        const { pid, channel } = preset;
        const bkid = channel == 9 ? 128 : 0;
        queues[pid%3].push(channels[channel].setProgram(pid, bkid));
      }
      duration.innerHTML = totalTicks / 4;
      timeslide.setAttribute("max", totalTicks);
      //load sf2 files in 3 batchesd
      await Promise.all(l1);
      await Promise.all(l2);
      await Promise.all(l3);
      
      playBtn.removeAttribute("disabled");
    } else if (e.data.channel) {
      eventPipe.postMessage(e.data.channel);
    } else if (e.data.qn) {
      timeslide.value = e.data.qn;
      timeNow.innerHTML = e.data.qn;
      if (e.data.qn % 4) return;
      const seqrow = new Array(88).fill(" ");
      for (const c of uiControllers) {
        if (c.active && c.midi) seqrow[c.midi - 21] = "#";
      }
      stdout(seqrow.join(""));
    } else if (e.data.tempo) {
      tempo.innerHTML = e.data.tempo;
    } else if (e.data.t) {
      // timeslide.value = e.data.t;
    } else if (e.data.meta) {
      onMidiMeta(stderr, e);
    }
  });

  playBtn.onclick = () => midiworker.postMessage({ cmd: "start" });
  pauseBtn.onclick = () => midiworker.postMessage({ cmd: "pause" });
  midiworker.postMessage({ cmd: "inited" });

  const midiList = await fetchmidilist();
  const midiSelect = mkdiv2({
    tag: "select",
    style: "width:300px",
    value: midifile,
    onchange: (e) =>{
      document.location.href=`?midifile=${e.target.value}&sf2file=${sf2file}`;
    },
    children: midiList.map((f) =>
      mkdiv("option", { value: f.get("Url"), seleced: f.get("Url")===midifile }, f.get("Name").substring(0, 80))
    ),
  });
  midiSelect.attachTo(msel);

  const sf2List = await fetchSF2List();
  sf2select.onchange = (e) =>  document.location.href=`?midifile=${midifile}&sf2file=${e.target.value}`;
  for (const f of sf2List)
    sf2select.append(mkdiv("option", { value: f.url }, f.name));

  const eventPipe = mkeventsPipe();
  uiControllers = mkui(eventPipe, $("#channelContainer"));
  await SpinNode.init(ctx);
  const spinner = new SpinNode(ctx, 16);
  const merger = new GainNode(ctx);
  const masterMixer = new GainNode(ctx, { gain: 1.0 });
  for (let i = 0; i < 16; i++) {
    spinner.connect(merger, i, 0);
  }
  merger.connect(masterMixer).connect(ctx.destination);
  for (let i = 0; i < 16; i++) {
    channels.push(createChannel(uiControllers[i], i, sf2, spinner));
  }

  eventPipe.onmessage(function (data) {
    const [a, b, c] = data;
    const cmd = a & 0xf0;
    const ch = a & 0x0f;
    const key = b & 0x7f;
    const velocity = c & 0x7f;
    switch (cmd) {
      case midi_ch_cmds.continuous_change: // set CC
        channels[ch].setCC({ key, vel: velocity });
        stdout("midi set cc " + [ch, cmd, key, velocity].join("/"));
        break;
      case midi_ch_cmds.change_program: //change porg
        stdout("midi change program " + [ch, cmd, key, velocity].join("/"));

        channels[ch].setProgram(key, ch == 9 ? 128 : 0);
        break;
      case midi_ch_cmds.note_off:
        channels[ch].keyOff(key, velocity);
        break;
      case midi_ch_cmds.note_on:
        if (velocity == 0) {
          channels[ch].keyOff(key, velocity);
        } else {
          //stdout([ch, cmd, key, velocity].join("/"));
          channels[ch].keyOn(key, velocity);
        }
        break;
      default:
        stdout("midi cmd: " + [ch, cmd, b, c].join("/"));
        break;
    }
  });
  const midiAccess = await navigator.requestMIDIAccess();
  const midiInputs = Array.from(midiAccess.inputs.values());
  midiInputs.forEach((input) => {
    input.onmidimessage = ({ data }) => {
      eventPipe.postMessage(data);
    };
  });
  ctx.onstatechange = () => stdout("ctx state " + ctx.state);
  window.addEventListener("click", () => ctx.resume(), { once: true });
  async function loadSF2File(sf2url) {
    sf2 = new SF2Service(sf2url);
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
    channels.forEach((c) => c.setSF2(sf2));
    await sf2.loadProgram(0, 0);
    await channels[9].setProgram(0, 128);
    for (const [section, text] of sf2.meta) {
      stderr(section + ": " + text);
    }
  }
  playBtn.setAttribute("disabled",true);
  await loadSF2File(sf2file);  
  midiworker.postMessage({cmd:"load",url:midifile});
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
