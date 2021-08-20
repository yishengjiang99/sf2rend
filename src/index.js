import { mkdiv, logdiv } from "mkdiv";
import { SpinNode } from "../spin/spin.js";
import { LowPassFilterNode } from "../lpf/lpf.js";
import { mkui } from "./ui.js";
import { load, loadProgram } from "sf2-service";
import { chart, mkcanvas, renderFrames } from "mk-60fps";
import { fetchmidilist } from "./midilist.js";
import { channel } from "./channel.js";
import { mkEnvelope } from "./adsr.js";
const flist = document.querySelector("#sf2list");
const cpanel = document.querySelector("#channelContainer");
const { stdout } = logdiv(document.querySelector("pre"));
const cmdPanel = document.querySelector("footer");
const timeslide = document.querySelector("progress");
const programNames = [];
let sf2;

main(
  "https://grep32bit.blob.core.windows.net/midi/song.mid",
  "/sf2rend/file.sf2"
);
let _loadProgram;
async function main(midiurl, sf2file) {
  const pt = (function () {
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
  })(11);

  const controllers = mkui(cpanel, pt);
  sf2 = await load(sf2file, {
    onHeader(pid, bid, str) {
      flist.append(
        mkdiv("a", { class: "chlink", pid, bid }, [str]).wrapWith("li")
      );
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
    playlist: await fetchmidilist(),
  });
  bindMidiAccess(pt);
  function updateCanvas() {
    for (let i = 0; i < 16; i++) {
      if (ctx.egs[i].gainNode.gain > 0.000001) {
        chart(
          midiSink.canvases[i],
          ctx.spinner.outputSnapshot.subarray(i * 128, i * 128 + 128)
        );
      }
    }
    requestAnimationFrame(updateCanvas);
  }
  requestAnimationFrame(updateCanvas);
}

function initMidiReader(url) {
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
function bindMidiWorkerToAudioAndUI(
  midiworker,
  midiPort,
  { timeslide, cmdPanel, playlist }
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
  const listsdiv = document.querySelector("#midilist");
  playlist.forEach((l) =>
    listsdiv.append(
      mkdiv(
        "a",
        {
          href: "#" + l.get("Name"),
          onclick: () => midiworker.postMessage({ url: l.get("Url") }),
        },
        l.get("Name")
      ).wrapWith("li")
    )
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
async function initMidiSink(ctx, sf2, controllers, pt) {
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
    stdout("midi msg channel:" + ch + " cmd " + stat.toString(16));
    switch (stat) {
      case 0xb: //chan set
        ccs[ch * 128 + key] = vel;
        break;
      case 0xc: //change porg
        const pid = key,
          bankId = ch == 9 ? 128 : 0;
        if (pid != channels[ch].pid) _loadProgram(ch, pid, bankId);
        break;
      case 0x08:
        channels[ch].keyOff(key, vel);
        break;
      case 0x09:
        if (vel == 0) {
          channels[ch].keyOff(key, vel);
        } else {
          stdout("playnote " + key + " for " + ch);

          channels[ch].keyOn(key, vel);
        }
        break;
      default:
        break;
    }
  });

  return { channels, ccs, canvases };
}
async function initAudio() {
  const ctx = new AudioContext({ sampleRate: 44100 });
  await SpinNode.init(ctx);
  const spinner = new SpinNode(ctx);
  const DC = new AudioBufferSourceNode(ctx, {
    buffer: new AudioBuffer({
      numberOfChannels: 1,
      sampleRate: ctx.sampleRate,
      length: 1,
    }),
    loop: true,
  });
  DC.buffer.getChannelData(0)[0] = 1;
  // await LowPassFilterNode.init(ctx);
  // const lpf = new LowPassFilterNode(ctx, ctx.sampleRate * 0.45);
  const egs = [];
  const masterMixer = new GainNode(ctx, { gain: 1 });
  for (let i = 0; i < 16; i++) {
    egs[i] = mkEnvelope(ctx);
    egs[i].gainNode.connect(spinner, 0, i);
    DC.connect(egs[i].gainNode);
    spinner
      .connect(new ChannelMergerNode(ctx, { numberOfInputs: 16 }), i, 0)
      .connect(masterMixer);
  }
  DC.start();
  masterMixer.connect(ctx.destination);
  document.addEventListener("mousedown", async () => await ctx.resume(), {
    once: true,
  });
  return { ctx, spinner, egs, masterMixer };
}

async function bindMidiAccess(port) {
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

window.onerror = (event, source, lineno, colno, error) => {
  document.querySelector("#debug").innerHTML = JSON.stringify([
    event,
    source,
    lineno,
    colno,
    error,
  ]);
};
