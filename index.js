import { mkdiv, logdiv } from "./mkdiv/mkdiv.js";
import { load } from "./sf2-service/read.js";
import { SpinNode } from "./spin/spin.js";
import { LowPassFilterNode } from "./lpf/lpf.js";
import { mkui } from "./ui.js";
import { effects } from "./misc.js";
import { chart, mkcanvas, renderFrames } from "./chart/chart.js";

const flist = document.querySelector("#sf2list");
const cpanel = document.querySelector("#channelContainer");
const { stdout, stderr, infoPanel, errPanel } = logdiv();
stderr("loading..");
infoPanel.attachTo(cpanel);
errPanel.attachTo(cpanel);
window.stdout = stdout;

let ctx;
const { controllers } = mkui(cpanel, nomidimsg);
const channels = [],
  programs = {};
let cid = 0;
const ccs = new Uint8Array(128 * 16);

function loadf(file) {
  flist.innerHTML = "";
  load(file, {
    onHeader: (pid, bid, str) => {
      const loadlink = mkdiv(
        "a",
        {
          href: "#",
          pid: pid,
          style: "cursor:crosshair",
          onclick: () => {
            console.log("loading");
            controllers[cid].name = str;
            channels[cid].setProgram(pid, bid);
            cid++;
          },
        },
        "load preset"
      );
      mkdiv("li", {}, [str, "&nbsp", loadlink]).attachTo(flist);
      programs[pid] = str;
    },
  })
    .then((_sf2) => {
      ctx = initAudio(_sf2);
    })
    .then(() => {
      document
        .querySelector("#midic")
        .addEventListener("click", initMidi, { once: true });
    });
}
loadf("file.sf2");
const midiCC = midiCCState();
const timeslide = mkdiv("input", {
  type: "range",
  min: -2,
  max: 4000,
  value: -2,
}).attachTo(cpanel);
document.querySelector(".cover").innerHTML = "welcome";
flist.innerHTML = "";
initworker(
  "https://grep32bit.blob.core.windows.net/midi/Blink_182_-_All_The_Small_Things_.mid"
);

function midiCCState() {
  for (let i = 0; i < 16; i++) {
    ccs[i * 128 + 7] = 100; //defalt volume
    ccs[i * 128 + 11] = 127; //default expression
    ccs[i * 128 + 10] = 64;
  }
  return new Proxy(ccs, {
    get(ccs, idx) {
      return new Proxy(ccs.subarray(idx * 128, idx * 128 + 129), {
        get(target, attr) {
          return target[attr];
        },
        set(target, attr, value) {
          if (!isNaN(attr)) {
            target[attr] = value;
            return;
          }
          if (effects.indexOf(attr) >= 0) target[effects.indexOf(attr)] = value;
        },
      });
    },
  });
}
function mkEnvelope(ctx, zone) {
  const volumeEnveope = new GainNode(ctx, { gain: 0 });
  let delay, attack, hold, decay, release, gainMax, sustain, _midiState;

  function setZone(zone) {
    [delay, attack, hold, decay, release] = [
      zone.VolEnvDelay,
      zone.VolEnvAttack,
      zone.VolEnvHold,
      zone.VolEnvDecay,
      zone.VolEnvRelease,
    ].map((v) => (v == -1 || v <= -12000 ? 0.001 : Math.pow(2, v / 1200)));
  }
  setZone(zone);

  return {
    set zone(zone) {
      setZone(zone);
    },
    set midiState(staet) {
      _midiState = staet;
    },
    keyOn() {
      const sf2attenuate = Math.pow(10, zone.Attenuation * -0.005);
      const midiVol = _midiState[effects.volumecoarse] / 128;
      const midiExpre = _midiState[effects.expressioncoarse] / 128;
      gainMax = 3 * sf2attenuate * midiVol * midiExpre;
      volumeEnveope.gain.linearRampToValueAtTime(gainMax, attack);

      if (sustain > 0) {
        //  volumeEnveope.gain.setTargetAtTime(0, attack + hold, decay / 2);
        //  volumeEnveope.gain.linearRampToValueAtTime(sustain, this.sustainTime);
      }
      console.log(gainMax, zone.VolEnvSustain, this.sustainTime);
    },
    keyOff() {
      volumeEnveope.gain.cancelScheduledValues(0);
      //   console.log(release + "rel");
      volumeEnveope.gain.linearRampToValueAtTime(0.0, release);
    },
    gainNode: volumeEnveope,
  };
}

async function initworker(url) {
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
    case 0xb: //chan set
      ccs[ch * 16 + key] = vel;
      break;
    case 0xc: //change porg
      channels[ch].setProgram(key, ch == 9 ? 128 : 0);
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
  const ctx = new AudioContext({ sampleRate: 44100 });
  await SpinNode.init(ctx);
  await LowPassFilterNode.init(ctx);
  return ctx;
}

export function channel(ctx, sf2, id, ui) {
  if (!sf2) {
    throw new Error("no sf2");
  }
  const vis = mkcanvas({ container: ui.canc });
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
      // if (pool.length < 3) return null;

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
    const lops = shdr.loops;
    //set to no loop
    if (zone.SampleModes == 0 || lops[1] <= lops[0]) lops[0] = -1;
    const [spinner, volEG, lpf] = [
      new SpinNode(ctx, { ref, pcm, loops: shdr.loops }),
      mkEnvelope(ctx, zone),
      new LowPassFilterNode(ctx, semitone2hz(zone.FilterFc)),
    ];
    console.log("filter freq", zone.FilterFc, semitone2hz(zone.FilterFc));
    if (id == 9) {
      spinner.connect(ctx.destination);
    } else
      spinner.connect(volEG.gainNode).connect(lpf).connect(ctx.destination);
    return { spinner, lpf, volEG };
  }

  async function keyOn(key, vel) {
    const { shdr, pcm, ref, ...zone } = filterKV(key, vel)[0]; //.forEach(({ shdr, pcm, ref, ...zone }) => {
    if (pcm.byteLength != shdr.byteLength * 1)
      throw "unexpected pcm " + pcm.byteLength + " vs " + shdr.byteLength;
    const { spinner, volEG, lpf } =
      pool.dequeue(pcm, shdr, zone, ref) || mkZoneRoute(pcm, shdr, zone, ref);
    //      : pool.dequeue(pcm, shdr, zone, ref);

    spinner.stride = zone.calcPitchRatio(key, ctx.sampleRate); // ({ key, zone, shdr });
    volEG.midiState = midiCC[id];
    volEG.keyOn();

    activeNotes.push({ spinner, volEG, lpf, key });
    ui.zone = zone;

    ui.midi = key;
    ui.velocity = vel;
    setTimeout(() => chart(vis, pcm), 12);
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
function semitone2hz(c) {
  return Math.pow(2, (c - 6900) / 1200) * 440;
}
