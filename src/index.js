import { mkdiv, logdiv } from "../mkdiv/mkdiv.js";
import { SpinNode } from "../spin/spin.js";
import { mkui } from "./ui.js";
import { load, loadProgram } from "../sf2-service/read.js";
import { chart, mkcanvas, renderFrames } from "../chart/chart.js";
import { fetchAndLoadPlaylist } from "./midilist.js";
import { channel } from "./channel.js";
// import { mkEnvelope } from "./adsr.js";
import { sf2list } from "../api/v1_list.js";
let _loadProgram;
const getParams = new URLSearchParams(document.location.search);
let midif = getParams.get("midif") || "song.mid";
let sf2f = getParams.get("sf2f") || sf2list[0];
let sf2, stdout, controllers, ctx, midiSink;
const programNames = [];
const cdnroot = `https://grep32bit.blob.core.windows.net/midi/`;

if (!document.location.href.includes("test.html")) {
  fetchAndLoadPlaylist(sf2f);
  main(sf2f, midif, queryDivs());
  window.onerror = (event, source, lineno, colno, error) => {
    document.querySelector("#debug").innerHTML = JSON.stringify(
      {
        event,
        source,
        lineno,
        colno,
        error,
      },
      null,
      "\n"
    );
  };
}
export function queryDivs() {
  const flist = document.querySelector("#sf2list");
  const cpanel = document.querySelector("#channelContainer");
  const cmdPanel = document.querySelector("#cmdPanel");
  const rx1 = document.querySelector("#rx1");
  const rx2 = document.querySelector("#rx2");

  const timeslide = document.querySelector("progress");
  const logdivfn = logdiv(document.querySelector("pre"));
  stdout = logdivfn.stdout;
  window.stdout = stdout;

  const titleDiv = document.querySelector("#title");
  const sf2select = mkdiv(
    "select",
    {
      onchange: (e) =>
        (document.location.href = `${
          document.location.href.split("?")[0]
        }?midif=${midif}&sf2f=${e.target.value}`),
    },
    sf2list.map((f) =>
      f == sf2f
        ? mkdiv("option", { value: f, selected: 1 }, f)
        : mkdiv("option", { value: f }, f)
    )
  );
  cmdPanel.parentElement.append(sf2select);
  return {
    flist,
    cpanel,
    cmdPanel,
    timeslide,
    stdout,
    titleDiv,
    rx1,
    rx2,
    headerDiv: document.querySelector("#trktitle"),
  };
}
export async function main(
  sf2file,
  midif,
  { cpanel, cmdPanel, stdout, flist, timeslide, titleDiv, rx, headerDiv }
) {
  if (!cpanel) cpanel = mkdiv("div");
  const midiurl = cdnroot + midif;
  const pt = mkeventsPipe();

  controllers = mkui(cpanel, pt);
  const programs = mkdiv("datalist", { id: "programs" });
  const drums = mkdiv("datalist", { id: "drums" });
  document.body.append(programs);
  document.body.append(drums);
  sf2 = await load("static/" + sf2file, {
    onHeader(pid, bid, str) {
      const list = bid ? drums : programs;
      list.append(mkdiv("option", { class: "chlink", value: str, pid }));
      programNames[pid | bid] = str;
    },
  });
  if (!sf2.presetRefs) return;
  ctx = await initAudio();

  midiSink = await initMidiSink(ctx, sf2, controllers, pt);
  _loadProgram = async function (channel, pid, bankId) {
    const sf2pg = loadProgram(sf2, pid, bankId);
    midiSink.channels[channel].program = {
      pg: sf2pg,
      pid,
      bankId: bankId,
      name: programNames[bankId | pid],
    };
    const ret = await ctx.spinner.shipProgram(sf2pg, bankId | pid);
    midiSink.channels[channel].active = true;
  };

  const { presets, totalTicks, midiworker } = await initMidiReader(midiurl);
  timeslide.setAttribute("max", totalTicks);
  for await (const _ of (async function* g(presets) {
    for (const preset of presets) {
      const { pid, channel, t } = preset;
      if (t > 0) continue;
      const bkid = channel == 9 ? 128 : 0;
      yield await _loadProgram(channel, pid, bkid);
    }
    if (midiSink.channels[0].active == false) {
      yield await _loadProgram(0, 0, 0);
    }
    if (midiSink.channels[9].active == false) {
      yield await _loadProgram(9, 0, 128);
    }
  })(presets)) {
    //eslint
    console.log("preset sent");
  }
  let cid = 0;

  bindMidiWorkerToAudioAndUI(midiworker, pt, ctx, {
    timeslide,
    cmdPanel,
    updateCanvas: null,
    titleDiv,
    rx1,
    rx2,
    headerDiv,
  });
  bindMidiAccess(pt);
  ctx.spinner.port.onmessage = function ({ data: { pcmplayback } }) {
    pcmplayback &&
      requestAnimationFrame(() => chart(midiSink.bigcan, pcmplayback));
  };
}
export function mkeventsPipe() {
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
export function initMidiReader(url) {
  return new Promise((resolve, reject) => {
    const midiworker = new Worker("./dist/midiworker.js#" + url, {
      type: "module",
    });
    midiworker.addEventListener(
      "message",
      ({ data: { totalTicks, presets } }) =>
        resolve({
          midiworker,
          totalTicks,
          presets,
        }),
      { once: true }
    );
    midiworker.onerror = reject;
    midiworker.onmessageerror = reject;
  });
}

export function bindMidiWorkerToAudioAndUI(
  midiworker,
  midiPort,
  ctx,
  { timeslide, rx1, rx2, cmdPanel, updateCanvas, titleDiv, headerDiv }
) {
  cmdPanel.innerHTML = "";
  let metaChannel = 0x00;
  midiworker.addEventListener("message", (e) => {
    if (e.data.channel) {
      midiPort.postMessage(e.data.channel);
    } else if (e.data.qn) {
      rx1.innerHTML = e.data.qn;
      const seqrow = new Array(88).fill(" ");
      for (const c of controllers) {
        if (c.active && c.midi) seqrow[c.midi - 21] = "#";
      }
      stdout(seqrow.join(""));
    } else if (e.data.tempo) {
      rx2.innerHTML = "Tempo:" + (e.data.tempo | 0);
    } else if (e.data.t) {
      timeslide.value = e.data.t; //(e.data.t);
    } else if (e.data.meta) {
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
      function metaDisplay(num) {
        if (num < 8) return metalist[num];
        switch (num) {
          case 0x20:
            return "mc";
          case 0x21:
            return "port: ";
          case 0x51:
            return "tempo";
          case 0x2f:
            return "end of tack";
          case 0x58:
            return "time signature";
          default:
            return parseInt(num).toString(16);
        }
      }
      stdout(metaDisplay(e.data.meta) + ": " + e.data.payload);
    }
  });
  timeslide.value = 0;

  mkdiv("button", { class: "cmd", cmd: "start" }, "start").attachTo(cmdPanel);
  mkdiv("button", { class: "cmd", cmd: "pause" }, "pause").attachTo(cmdPanel);
  mkdiv("button", { class: "cmd", cmd: "rwd", amt: "rwd" }, "rwd").attachTo(
    cmdPanel
  );

  cmdPanel.querySelectorAll("button.cmd").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      const cmd = e.target.getAttribute("cmd");
      if (ctx.ctx.state != "running") {
        ctx.ctx.resume().then(() => midiworker.postMessage({ cmd }));
      } else {
        midiworker.postMessage({ cmd });
      }
    })
  );
  midiworker.postMessage({ cmd: "inited" });
}
function resetGM() {
  cid = 0;
  midiSink.channels.forEach((c) => c.keyOff(1, 1));
}
export async function initMidiSink(ctx, sf2, controllers, pt) {
  const channels = [];
  const ccs = new Uint8Array(128 * 16);
  const canvases = [];
  const cancontainer = document.querySelector("#bigcan");
  const bigcan = mkcanvas({
    container: document.querySelector("#bigcan"),
    width: cancontainer.clientWidth,
    height: cancontainer.clientHeight,
  });
  for (let i = 0; i < 16; i++) {
    channels[i] = channel(ctx, i, controllers[i]);
    channels[i].midicc = ccs.subarray(i * 128, i * 128 + 128);
  }
  pt.onmessage(function (data) {
    const [a, b, c] = data;
    const stat = a >> 4;
    const ch = a & 0x0f;
    const key = b & 0x7f,
      vel = c & 0x7f;
    switch (stat) {
      case 0xb: //chan set/
        ctx.spinner.port.postMessage([0xb0, ch, key, vel]);
        channels[ch].ui.CC = { key, value: vel };
        break;
      case 0xc: //change porg
        const pid = key,
          bankId = ch == 9 ? 128 : 0;
        if (pid != channels[ch].pid) {
          _loadProgram(ch, pid, bankId);
        }
        break;
      case 0x08:
        channels[ch].keyOff(key, vel);
        break;
      case 0x00:
        channels[ch].keyOn(key, 55);
        //   channels[ch].keyOn(vel, 55);

        //  channels[ch + 1].keyOn(vel, 66);
        //  stdout("midi cmd: " + [ch, stat, b, c].join("/"));

        break;
      case 0x09:
        if (vel == 0) {
          channels[ch].keyOff(key, vel);
        } else {
          channels[ch].keyOn(key, vel);
        }
        break;
      default:
        stdout("midi cmd: " + [ch, stat, b, c].join("/"));

        break;
    }
  });

  return { channels, ccs, bigcan };
}
export async function initAudio() {
  const ctx = new AudioContext({ sampleRate: 48000 });
  await SpinNode.init(ctx);
  const spinner = new SpinNode(ctx);

  const egs = [];
  const masterMixer = new GainNode(ctx, { gain: 1 });
  spinner.connect(ctx.destination);

  document.addEventListener("mousedown", async () => await ctx.resume(), {
    once: true,
  });
  return { ctx, spinner, egs, masterMixer };
}

export async function bindMidiAccess(port) {
  const midiAccess = await navigator.requestMIDIAccess();
  const midiInputs = Array.from(midiAccess.inputs.values());
  const midiOutputs = Array.from(midiAccess.outputs.values());
  midiInputs.forEach((input) => {
    input.onmidimessage = ({ data, timestamp }) => {
      port.postMessage(data);
    };
  });

  return [midiInputs, midiOutputs];
}
