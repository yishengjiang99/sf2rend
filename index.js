import { mkdiv, logdiv } from "./mkdiv/mkdiv.js";
import { load } from "./sf2-service/read.js";
import { SpinNode } from "./spin/spin.js";
import mkEnvelope from "./adsr.js";
import { LowPassFilterNode } from "./lpf/lpf.js";
import { semitone2hz } from "./sf2-service/zoneProxy.js";
import { mkui } from "./ui.js";
mkdiv("button", { id: "midic" }, "connect to midi").attachTo(document.body);

let ctx;
const { stdout, stderr, infoPanel, errPanel } = logdiv();
const flist = document.querySelector("#sf2list");
const cpanel = document.querySelector("#channelContainer");
const { controllers, readable } = mkui(cpanel);
const channels = [],
  programs = {};
let cid = 0;
infoPanel.attachTo(cpanel);
errPanel.attachTo(cpanel);
const { port1, port2 } = new MessageChannel();
readable.pipeTo(
  new WritableStream({
    write(chunk, controller) {
      try {
        nomidimsg(chunk);
      } catch (error) {
        controller.error(error.message);
      }
    },
  })
);
function loadf(file) {
  flist.innerHTML = "";
  load(file, {
    onHeader: (pid, str) => {
      presetUI_sic(pid, str);
    },
  })
    .then((_sf2) => {
      ctx = initAudio(_sf2);
    })
    .then(() => {
      window.addEventListener("click", initMidi, { once: true });
    });
}
loadf("file.sf2");
const timeslide = mkdiv("input", {
  type: "range",
  min: -2,
  max: 4000,
  value: -2,
}).attachTo(cpanel);
document.querySelector(".cover").innerHTML = "press any key";
flist.innerHTML = "";
initworker("song2.mid");

const one_over_128x4 = 1 / 128 / 128 / 128 / 128;
async function initworker(url) {
  let ccs = new Uint8Array(128 * 16);
  for (let i = 0; i < 16; i++) {
    ccs[i * 16 + 7] = 100; //defalt volume
    ccs[i * 16 + 11] = 127; //default expression
    ccs[i * 16 + 10] = 64;
  }
  const [midiworker, totalTicks] = await new Promise((resolve, reject) => {
    const w = new Worker("./midiworker.js#" + url, { type: "module" });
    w.addEventListener(
      "message",
      ({ data: { totalTicks } }) => resolve([w, totalTicks]),
      { once: true }
    );
    w.onerror = reject;
    w.onmessageerror = reject;
  });
  midiworker.addEventListener("message", (e) => {
    if (e.data.channel) {
      nomidimsg(e.data.channel);
    } else if (e.data.t) {
      timeslide.vale = e.data.t; //(e.data.t);
    }
  });
  timeslide.setAttribute("max", totalTicks);
  function msgcmd(cmd) {
    midiworker.postMessage({ cmd });
  }
  mkdiv("button", { class: "cmd", cmd: "start" }, "start").attachTo(cpanel);
  mkdiv("button", { class: "cmd", cmd: "stop" }, "sts").attachTo(cpanel);
  document
    .querySelectorAll("button.cmd")
    .forEach((btn) =>
      btn.addEventListener("click", (e) => msgcmd(e.target.getAttribute("cmd")))
    );
}
stderr("loading..");

async function initAudio(sf2) {
  ctx = await realCtx();
  for (let i = 0; i < 16; i++) {
    channels[i] = channel(ctx, sf2, i, controllers[i]);
  }
}
async function initMidi() {
  await ctx.resume();
  bindMidiAccess(port1);
  port2.onmessage = (e) => nomidimsg(e.data);
}
function nomidimsg(data) {
  const [a, b, c] = data;
  const stat = a >> 4;
  const ch = a & 0x0f;
  const key = b & 0x7f,
    vel = c & 0x7f;
  stdout(data);
  stderr(data);
  switch (stat) {
    case 0x0b: //chan set
      // channels[ch].setProgram(key);
      break;
    case 0xc: //change porg
      channels[ch].setProgram(key);
      break;
    case 0x08:
      channels[ch].keyOff(key, vel);
      break;
    case 0x09:
      if (vel == 0) {
        channels[ch].keyOff(key, vel);
      } else {
        channels[ch].keyOn(key, vel);
      }
      break;
    default:
      break;
  }
}
async function openNextChannel(pid, str) {
  if (channels[cid]) {
    console.log("loading");
    await channels[cid].setProgram(pid, 0);
    controllers[cid].name = str;
    cid++;
  }
}
function presetUI_sic(pid, str) {
  const loadlink = mkdiv(
    "a",
    {
      href: "#",
      pid: pid,
      style: "cursor:crosshair",
      onclick: () => openNextChannel(pid, str),
    },
    "load preset"
  );
  mkdiv("li", {}, [str, "&nbsp", loadlink]).attachTo(flist);
  programs[pid] = str;
}

async function bindMidiAccess(port, tee) {
  const midiAccess = await navigator.requestMIDIAccess();
  const midiInputs = Array.from(midiAccess.inputs.values());
  const midiOutputs = Array.from(midiAccess.outputs.values());
  midiInputs.forEach((input) => {
    input.onmidimessage = ({ data, timestamp }) => {
      if (port) port.postMessage(data);
    };
  });

  return [midiInputs, midiOutputs];
}

export async function realCtx() {
  const ctx = new AudioContext({ sampleRate: 48000 });
  await SpinNode.init(ctx);
  await LowPassFilterNode.init(ctx);
  return ctx;
}

export function channel(ctx, sf2, id, ui) {
  if (!sf2) {
    throw new Error("no sf2");
  }
  const activeNotes = [];
  function recycledUints() {
    const pool = [];
    function dequeue(pcm, shdr, zone, ref) {
      if (pool.length == 0) return null;
      for (const i in pool) {
        if (pool[i].spinner.zref == ref) {
          const r = pool[i];
          r.spinner.reset();
          r.volEG.zone = zone;
          pool.splice(i, 1);
          return r;
        }
      }
      const { spinner, volEG, lpf } = pool.shift();
      spinner.reset();
      spinner.sample = { pcm, loops: shdr.loops, zref: ref };
      volEG.zone = zone;

      lpf.frequency = semitone2hz(zone.FilterFc);
      return { spinner, volEG, lpf };
    }
    function enqueue(unit) {
      pool.push(unit);
    }
    return {
      dequeue,
      enqueue,
      empty: () => pool.length == 0,
    };
  }
  let filterKV;
  async function setProgram(pid, bankId) {
    const pg = sf2.loadProgram(pid, bankId);
    filterKV = pg.filterKV;
    await pg.preload();
    console.log("preloaddon");
  }
  const pool = recycledUints();

  function silence() {
    activeNotes().forEach((v) => v.volEG.keyOff(0));
  }
  function mkZoneRoute(pcm, shdr, zone, ref) {
    const [spinner, volEG, lpf] = [
      new SpinNode(ctx, { ref, pcm, loops: shdr.loops }),
      mkEnvelope(ctx, zone),
      new LowPassFilterNode(ctx, semitone2hz(zone.FilterFc)),
    ];
    console.log("filter freq", zone.FilterFc, semitone2hz(zone.FilterFc));
    spinner.connect(volEG.gainNode).connect(lpf).connect(ctx.destination);
    //setTimeout(() => chart(vis, pcm), 12);
    return { spinner, lpf, volEG };
  }

  async function keyOn(key, vel) {
    console.log(ctx.state);
    const { shdr, pcm, ref, ...zone } = filterKV(key, vel)[0]; //.forEach(({ shdr, pcm, ref, ...zone }) => {
    console.log(shdr.sampleRate + "sr");
    if (pcm.byteLength != shdr.byteLength * 1)
      throw "unexpected pcm " + pcm.byteLength + " vs " + shdr.byteLength;
    const { spinner, volEG, lpf } = pool.empty()
      ? mkZoneRoute(pcm, shdr, zone, ref)
      : pool.dequeue(pcm, shdr, zone, ref);
    spinner.stride = zone.calcPitchRatio(key, ctx.sampleRate); // ({ key, zone, shdr });
    volEG.keyOn();
    activeNotes.push({ spinner, volEG, lpf, key });
    ui.zone = zone;

    ui.midi = key;
    ui.velocity = vel;
  }

  function keyOff(key) {
    for (let i = 0; i < activeNotes.length; i++) {
      if (activeNotes[i].key == key) {
        var unit = activeNotes[i];
        unit.volEG.keyOff();
        pool.enqueue(activeNotes.splice(i, 1)[0]);
        break;
      }
    }
  }

  return {
    keyOn,
    silence,
    keyOff,
    setProgram,
    id,
    ctx,
  };
}
