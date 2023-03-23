import { mkdiv, logdiv, mkdiv2 } from "https://unpkg.com/mkdiv@3.1.2/mkdiv.js";
import { mkui } from "./ui.js";
import SF2Service from "https://unpkg.com/sf2-service@1.3.6/index.js";
import { fetchmidilist } from "./midilist.js";
import { mkeventsPipe } from "./mkeventsPipe.js";
import { createChannel } from "./createChannel.js";
import { midi_ch_cmds, range } from "./constants.js";
import { chart, mkcanvas } from "https://unpkg.com/mk-60fps@1.1.0/chart.js";
const $ = (sel) => document.querySelector(sel);

const sf2select = $("#sf2select"),
  timeslide = $("#timeSlider"),
  playBtn = $("#play"),
  pauseBtn = $("#stop"),
  timeNow = $("#timeNow"),
  tempo = $("#tempo"),
  duration = $("#duration"),
  msel = $("#msel"),
  panel2 = document.querySelector("#col2"),
  col4 = $("#col4"),
  col5 = $("#col5"),
  canvas1 = mkcanvas({ container: $("#col3") });

const drumList = document.querySelector("#drums");
const programList = document.querySelector("#programs");
const { infoPanel, stdout, stderr } = logdiv();
infoPanel.attachTo(document.querySelector("#stdout"));
window.stdout = stdout;
window.stderr = stdout;
const getParams = new URLSearchParams(document.location.search);
main(
  getParams.get("sf2file") || "file.sf2",
  getParams.get("midifile") || "song.mid"
);

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
async function main(sf2file, midifile) {
  let sf2,
    uiControllers,
    ctx = new AudioContext(),
    midiworker = new Worker("src/midiworker.js", {
      type: "module",
    });
  stdout("start");

  updateAppState({
    midifile,
    sf2file,
    audioState: ctx.state,
  });

  const channels = [];

  midiworker.addEventListener("message", async function (e) {
    if (e.data.midifile) {
      const { totalTicks, presets } = e.data.midifile;
      spinner.port.postMessage({ cmd: "reset" });
      const queues = [[], [], []];
      const [l1, l2, l3] = queues;

      for (const preset of presets) {
        const { pid, channel } = preset;
        const bkid = channel == 9 ? 128 : 0;
        await channels[channel].setProgram(pid, bkid);
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
  pauseBtn.onclick = () =>
    spinner.port.postMessage({ cmd: "panic" }) &&
    midiworker.postMessage({ cmd: "pause" });

  midiworker.postMessage({ cmd: "inited" });

  const midiList = await fetchmidilist();
  const midiSelect = mkdiv2({
    tag: "select",
    style: "width:300px",
    value: midifile,
    onchange: (e) => {
      midiworker.postMessage({ cmd: "load", url: e.target.value });
      e.preventDefault();
    },
    children: midiList.map((f) =>
      mkdiv("option", { value: f.get("Url") }, f.get("Name").substring(0, 80))
    ),
  });
  midiSelect.attachTo(msel);

  for (const f of sf2List)
    sf2select.append(mkdiv("option", { value: f.url }, f.name));
  sf2select.onchange = (e) => {
    updateAppState({ sf2file: e.target.value });
  };
  const { mkpath } = await import("./path.js");
  const spinner = await mkpath(ctx);
  updateAppState({
    spinnerLoaded: true,
  });
  const eventPipe = mkeventsPipe();
  uiControllers = mkui(eventPipe, $("#channelContainer"));
  for (let i = 0; i < 16; i++)
    channels.push(createChannel(uiControllers[i], i, sf2, spinner));

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
          stdout([ch, cmd, key, velocity].join("/"));
          const zone = channels[ch].keyOn(key, velocity);
          //requestAnimationFrame(() => renderZ(panel2, canvas1, zone));
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

  ctx.onstatechange = () => updateAppState({ audioStatus: ctx.state });

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
    channels.forEach((c, i) => {
      c.setSF2(sf2);
      c.setProgram(i, i == 9 ? 128 : 0);
    });
    for (const [section, text] of sf2.meta) {
      stderr(section + ": " + text);
    }
  }

  await loadSF2File(sf2file);
  window.mkTracks($("main"), {
    programNames: range(0, 12).map((i) => "ch " + i),
    keyRange: range(46, 80),
    eventPipe,
  });
  spinner.port.onmessage = ({ data }) => {
    if (data.spState) col5.innerHTML = JSON.stringify(data.spState);
    if (data.egStages) col4.innerHTML = Object.values(data.egStages).join(" ");
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
async function renderZ(container, canvas, zoneSelect) {
  container.innerHTML = "";

  if (zoneSelect) {
    const zattrs = Object.entries(zoneSelect).filter(
      ([attr, val], idx) => idx < 60
    );

    const pcm = await zoneSelect.shdr.data();
    chart(canvas, pcm);

    const zoneinfo = mkdiv("div", [
      mkdiv("div", [
        "smpl: ",
        zoneSelect.shdr.SampleId,
        " ",
        zoneSelect.shdr.name,
        "<br>nsample: ",
        zoneSelect.shdr.nsamples,
        "<br>srate: " + zoneSelect.shdr.originalPitch,
        "<br>Range: ",
        zoneSelect.shdr.range.join("-"),
        "<br>",
        "loop: ",
        zoneSelect.shdr.loops.join("-"),
        "<br>",

        JSON.stringify(zoneSelect.KeyRange),
        "<br>",
        JSON.stringify(zoneSelect.VolRange),
      ]),
      ..."Sustain,Attenuation,VolEnv,Filter,LFO".split(",").map((keyword) =>
        mkdiv(
          "div",
          { style: "padding:10px;color:gray;" },
          zattrs
            .filter(([k]) => k.includes(keyword))
            .map(([k, v]) => k + ": " + v)
            .join("<br>")
        )
      ),
    ]);
    zoneinfo.attachTo(container);
  }
}
