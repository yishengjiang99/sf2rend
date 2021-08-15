import { mkdiv, logdiv } from "../mkdiv/mkdiv.js";
import { SpinNode } from "../spin/spin.js";
import { LowPassFilterNode } from "../lpf/lpf.js";
import { mkui } from "./ui.js";
import { load } from "../sf2-service/read.js";

import { fetchmidilist } from "./midilist.js";
import { channel } from "./channel.js";
const flist = document.querySelector("#sf2list");
const cpanel = document.querySelector("#channelContainer");
const { stdout } = logdiv(document.querySelector("pre"));
window.stdout = stdout;
const cmdPanel = document.querySelector("footer");
const timeslide = document.querySelector("progress");
main();

async function main() {
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
  const sf2 = await loadf("https://dsp.grepawk.com/sf2rend/file.sf2");
  if (!sf2.presetRefs) return;
  const ctx = await initAudio();
  const midiSink = await initMidiSink(ctx, sf2, controllers, pt);
  const { presets, totalTicks, midiworker } = await initMidiReader(
    "https://grep32bit.blob.core.windows.net/midi/Britney_Spears_-_Baby_One_More_Time.mid"
  );
  timeslide.setAttribute("max", totalTicks);
  for await (const _ of (async function* g() {
    yield await midiSink.channels[0].setProgram(sf2, 0, 0);
    yield await midiSink.channels[9].setProgram(sf2, 128, 0);

    for (const preset of presets) {
      console.log("prload" + preset);
      const { pid, channel, t } = preset;
      if (t > 0) continue;
      const bkid = pid | (channel == 9) ? 128 : 0;
      yield await midiSink.channels[channel].setProgram(
        pid,
        bkid,
        programNames[pid | bkid]
      );
    }
  })()) {
    //eslint
  }
  let cid = 0;
  flist.onclick = ({ target }) =>
    // target.classList.contain("chlink") &&
    midiSink.channels[cid++].setProgram(
      target.getAttribute("pid"),
      target.getAttribute("bid"),
      programNames[target.getAttribute("pid") + target.getAttribute("bid")]
    );
  bindMidiWorkerToAudioAndUI(midiworker, pt, {
    timeslide,
    cmdPanel,
    playlist: mkdiv("div", {}, await fetchmidilist()),
  });
  bindMidiAccess(pt);
}
const programNames = [];
async function loadf(file) {
  flist.innerHTML = "";
  return load(file, {
    onHeader(pid, bid, str) {
      flist.append(
        mkdiv("a", { class: "chlink", pid, bid }, [str]).wrapWith("li")
      );
      programNames[pid | bid] = str;
    },
  });
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
    } else if (e.data.tick) {
      timeslide.value = e.data.tick; //(e.data.t);
    }
  });
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
async function initMidiSink(ctx, sf2, controllers, pt, spinner) {
  const channels = [];
  const ccs = midiCCState();
  for (let i = 0; i < 16; i++) {
    channels[i] = channel(ctx, sf2, i, controllers[i]);
    channels[i].midicc = ccs.subarray(i * 128, i * 128 + 128);
  }
  pt.onmessage(function (data) {
    const [a, b, c] = data;
    const stat = a >> 4;
    const ch = a & 0x0f;
    const key = b & 0x7f,
      vel = c & 0x7f;
    //  stdout(data);
    stdout("midi msg channel:" + ch + " cmd " + stat.toString(16));
    switch (stat) {
      case 0xb: //chan set
        ccs[ch * 128 + key] = vel;
        break;
      case 0xc: //change porg
        stdout("set program to " + key + " for " + ch);
        if (key != channels[ch].pid)
          channels[ch].setProgram(key, ch == 9 ? 128 : 0);
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
  function midiCCState() {
    const ccs = new Uint8Array(128 * 16);
    for (let i = 0; i < 16; i++) {
      ccs[i * 128 + 7] = 100; //defalt volume
      ccs[i * 128 + 11] = 127; //default expression
      ccs[i * 128 + 10] = 64;
    }

    return ccs;
  }
  return { channels, ccs };
}
async function initAudio() {
  const ctx = new AudioContext({ sampleRate: 44100 });
  await SpinNode.init(ctx);
  await LowPassFilterNode.init(ctx);
  return ctx;
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
