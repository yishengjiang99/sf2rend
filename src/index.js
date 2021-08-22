import { mkdiv, logdiv } from "../mkdiv/mkdiv.js";
import { SpinNode } from "../spin/spin.js";
import { mkui } from "./ui.js";
import { load, loadProgram } from "../sf2-service/read.js";
import { chart, mkcanvas, renderFrames } from "../chart/chart.js";
import { fetchAndLoadPlaylist } from "./midilist.js";
import { channel } from "./channel.js";
import { mkEnvelope } from "./adsr.js";
let _loadProgram;

const programNames = [];
let sf2;
const cdnroot = `https://grep32bit.blob.core.windows.net/midi/`;

if (document.location.href.includes("index.html")) {
  const { flist, cpanel, cmdPanel, timeslide, stdout } = queryDivs();
  fetchAndLoadPlaylist();
  main(queryDivs());
  window.onerror = (event, source, lineno, colno, error) => {
    document.querySelector("#debug").innerHTML = JSON.stringify([
      event,
      source,
      lineno,
      colno,
      error,
    ]);
  };
}
export function queryDivs() {
  const flist = document.querySelector("#sf2list");
  const cpanel = document.querySelector("#channelContainer");
  const cmdPanel = document.querySelector("footer");
  const timeslide = document.querySelector("progress");
  const { stdout } = logdiv(document.querySelector("pre"));
  return { flist, cpanel, cmdPanel, timeslide, stdout };
}
export async function main({ cpanel, cmdPanel, stdout, flist, timeslide }) {
  if (!cpanel) cpanel = mkdiv("div");
  window.stdout = stdout;
  const midiurl =
    cdnroot + (document.location.search.substring(1) || "song.mid");
  console.log(midiurl);
  const sf2file = "/sf2rend/file.sf2";
  const pt = mkeventsPipe();

  const controllers = mkui(cpanel, pt);
  const programs = mkdiv("datalist", { id: "programs" });
  const drums = mkdiv("datalist", { id: "drums" });
  document.body.append(programs);
  document.body.append(drums);
  sf2 = await load(sf2file, {
    onHeader(pid, bid, str) {
      const list = bid ? drums : programs;
      list.append(mkdiv("option", { class: "chlink", value: str, pid }));
      programNames[pid | bid] = str;
    },
  });
  if (!sf2.presetRefs) return;
  const ctx = await initAudio();

  const midiSink = await initMidiSink(ctx, sf2, controllers, pt);
  _loadProgram = async function (channel, pid, bankId) {
    const sf2pg = loadProgram(sf2, pid, bankId);
    midiSink.channels[channel].program = {
      pg: sf2pg,
      pid,
      bankId: bankId,
      name: programNames[bankId | pid],
    };

    const ret = await ctx.spinner.shipProgram(sf2pg, bankId | pid);
  };
  function updateCanvas() {
    for (let i = 0; i < 16; i++) {
      if (ctx.egs[i].gainNode.gain > 0.000001) {
        chart(
          midiSink.canvases[i],
          ctx.spinner.outputSnapshot.subarray(i * 128, i * 128 + 128)
        );
      }
    }
    //requestAnimationFrame(updateCanvas);
  }
  const { presets, totalTicks, midiworker } = await initMidiReader(midiurl);
  timeslide.setAttribute("max", totalTicks / 255);

  for await (const _ of (async function* g(presets) {
    yield await _loadProgram(0, 0, 0);
    yield await _loadProgram(9, 0, 128);
    for (const preset of presets) {
      const { pid, channel, t } = preset;
      if (t > 0) continue;
      const bkid = channel == 9 ? 128 : 0;
      yield await _loadProgram(channel, pid, bkid);
    }
  })(presets)) {
    //eslint
    console.log("preset sent");
  }
  let cid = 0;
  flist.onclick = ({ target }) =>
    _loadProgram(cid++, target.getAttribute("pid"), target.getAttribute("bid"));

  bindMidiWorkerToAudioAndUI(midiworker, pt, {
    timeslide,
    cmdPanel,
  });
  shareEventBufferWithMidiWorker(ctx.spinner, midiworker);
  bindMidiAccess(pt);
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
export function shareEventBufferWithMidiWorker(spinner, midiworker) {
  midiworker.postMessage({ evtPipe: spinner.pipe });
}
export function bindMidiWorkerToAudioAndUI(
  midiworker,
  midiPort,
  { timeslide, cmdPanel }
) {
  midiworker.addEventListener("message", (e) => {
    if (e.data.channel) {
      midiPort.postMessage(e.data.channel);
    } else if (e.data.qn) {
      timeslide.value = e.data.qn; //(e.data.t);
    } else {
      stdout(JSON.stringify(e.data, null, 0));
    }
  });
  timeslide.value = 0;
  mkdiv("button", { class: "cmd", cmd: "start" }, "start").attachTo(cmdPanel);
  mkdiv("button", { class: "cmd", cmd: "pause" }, "pause").attachTo(cmdPanel);
  mkdiv("button", { class: "cmd", cmd: "rwd", amt: "rwd" }, "rwd").attachTo(
    cmdPanel
  );

  cmdPanel
    .querySelectorAll("button.cmd")
    .forEach((btn) =>
      btn.addEventListener("click", (e) =>
        midiworker.postMessage({ cmd: e.target.getAttribute("cmd") })
      )
    );
}
function resetGM() {
  cid = 0;
  midiSink.channels.forEach((c) => c.keyOff(1, 1));
}
export async function initMidiSink(ctx, sf2, controllers, pt) {
  const channels = [];
  const ccs = new Uint8Array(128 * 16);
  const canvases = [];
  for (let i = 0; i < 16; i++) {
    channels[i] = channel(ctx, i, controllers[i]);
    channels[i].midicc = ccs.subarray(i * 128, i * 128 + 128);
    ccs[i * 128 + 7] = 100; //defalt volume
    ccs[i * 128 + 11] = 127; //default expression
    ccs[i * 128 + 10] = 64;
    const canvasContainer = controllers[i].canvasContainer;
    canvases[i] = mkcanvas({
      container: canvasContainer,
      height: canvasContainer.clientHeight,
      width: canvasContainer.clientWidth,
    });
  }
  pt.onmessage(function (data) {
    const [a, b, c] = data;
    const stat = a >> 4;
    const ch = a & 0x0f;
    const key = b & 0x7f,
      vel = c & 0x7f;
    // stdout("midi msg channel:" + ch + " cmd " + stat.toString(16));
    switch (stat) {
      case 0xb: //chan set
        ccs[ch * 128 + key] = vel;
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
      case 0x09:
        if (vel == 0) {
          channels[ch].keyOff(key, vel);
        } else {
          // stdout("playnote " + key + " for " + ch);

          channels[ch].keyOn(key, vel);
        }
        break;
      default:
        break;
    }
  });

  return { channels, ccs, canvases };
}
export async function initAudio() {
  const ctx = new AudioContext({ sampleRate: 44100 });
  await SpinNode.init(ctx);
  const spinner = new SpinNode(ctx);

  // const DC = new AudioBufferSourceNode(ctx, {
  //   buffer: new AudioBuffer({
  //     numberOfChannels: 1,
  //     sampleRate: ctx.sampleRate,
  //     length: 1,
  //   }),
  //   loop: true,
  // });
  // DC.buffer.getChannelData(0)[0] = 1;

  const egs = [];
  const masterMixer = new GainNode(ctx, { gain: 1 });
  spinner.connect(ctx.destination);

  for (let i = 0; i < 16; i++) {
    egs[i] = mkEnvelope(ctx);

    // egs[i].gainNode.connect(spinner, 0, i);
    // DC.connect(egs[i].gainNode);
    // .connect(new ChannelMergerNode(ctx, { numberOfInputs: 16 }), i, 0)
    // .connect(masterMixer);
  }
  // DC.start();
  // masterMixer.connect(ctx.destination);
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
