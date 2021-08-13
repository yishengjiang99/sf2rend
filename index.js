import { mkdiv, logdiv } from "./mkdiv/mkdiv.js";
import { load, loadProgram } from "./sf2-service/read.js";
import { SpinNode } from "./spin/spin.js";
import { LowPassFilterNode } from "./lpf/lpf.js";
import { mkui } from "./ui.js";
import { fetchmidilist, effects } from "./midilist.js";
import { mkcanvas, renderFrames } from "./chart/chart.js";

const flist = document.querySelector("#sf2list");
const cpanel = document.querySelector("#channelContainer");
const { stdout } = logdiv(document.querySelector("pre"));
window.stdout = stdout;
const cmdPanel = document.querySelector("footer");

main();

async function main() {
  const timeslide = mkdiv("input", {
    type: "range",
    min: -2,
    max: 4000,
    value: -2,
  });
  const pt = (function (n) {
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
  const sf2 = await loadf("file.sf2");
  const ctx = await initAudio();
  const midiSink = await initMidiSink(ctx, sf2, controllers, pt);
  const { presets, totalTicks, midiworker } = await initMidiReader("song.mid");
  timeslide.setAttribute("max", totalTicks);
  await preloadChannels(midiSink.channels, presets);
  let cid = 0;
  flist.onclick = ({ target }) =>
    // target.classList.contain("chlink") &&
    midiSink.channels[cid++].setProgram(
      target.getAttribute("pid"),
      target.getAttribute("bid")
    );
  bindMidiWorkerToAudioAndUI(midiworker, pt, {
    timeslide,
    cmdPanel,
    playlist: mkdiv("div", {}, []),
  });
  bindMidiAccess(pt);
}

async function preloadChannels(channels, presets) {
  for await (const _ of (async function* g() {
    for (const preset of presets) {
      console.log("prload" + preset);
      const { pid, channel } = preset;
      yield await channels[channel].setProgram(pid, channel == 9 ? 128 : 0);
    }
  })()) {
    //eslint
  }
}
async function loadf(file) {
  flist.innerHTML = "";
  return load(file, {
    onHeader(pid, bid, str) {
      flist.append(
        mkdiv("a", { class: "chlink", pid, bid }, [str]).wrapWith("li")
      );
    },
  });
}

function initMidiReader(url) {
  return new Promise((resolve, reject) => {
    const midiworker = new Worker("./midiworker.js#" + url, { type: "module" });
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
  // playlist.onclick = (e) => {
  //   if (e.target.hasAttribute("midiurl")) {
  //     midiworker.postMessage({ url: e.target.getAttribute("midiurl") });
  //   }
  // };
  cmdPanel
    .querySelectorAll("button.cmd")
    .forEach((btn) =>
      btn.addEventListener("click", (e) =>
        midiworker.postMessage({ cmd: e.target.getAttribute("cmd") })
      )
    );
}
async function initMidiSink(ctx, sf2, controllers, pt) {
  const channels = [];
  const pool = AUnitPool();
  const ccs = midiCCState();
  for (let i = 0; i < 16; i++) {
    channels[i] = channel(ctx, sf2, i, controllers[i], pool);
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
        //    channels[ch].midicc = ccs.subarray(ch * 128, ch * 128+128);
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
  channels.forEach(
    (ch, cid) => (ch.midicc = ccs.subarray(cid * 128, cid * 128 + 128))
  );
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
function mkEnvelope(ctx, zone) {
  const volumeEnveope = new GainNode(ctx, { gain: 0 });
  let delay, attack, hold, decay, release, gainMax, sustain, _midiState;
  setZone(zone);

  function setZone(zone) {
    [delay, attack, hold, decay, release] = [
      zone.VolEnvDelay,
      zone.VolEnvAttack,
      zone.VolEnvHold,
      zone.VolEnvDecay,
      zone.VolEnvRelease,
    ].map((v) => (v == -1 || v <= -12000 ? 0.001 : Math.pow(2, v / 1200)));
    sustain = Math.pow(10, zone.VolEnvSustain / -200);
  }
  return {
    set zone(zone) {
      setZone(zone);
    },
    set midiState(staet) {
      _midiState = staet;
    },
    keyOn(time) {
      const sf2attenuate = Math.pow(10, zone.Attenuation * -0.005);
      const midiVol = _midiState[effects.volumecoarse] / 128;
      const midiExpre = _midiState[effects.expressioncoarse] / 128;
      gainMax = 3 * sf2attenuate * midiVol * midiExpre;
      const tt = time - ctx.currentTime;

      volumeEnveope.gain.linearRampToValueAtTime(gainMax, attack);
      volumeEnveope.gain.linearRampToValueAtTime(
        sustain,
        attack + hold + decay + tt
      );
    },
    keyOff(time) {
      volumeEnveope.gain.cancelScheduledValues(0);
      //   console.log(release + "rel");
      volumeEnveope.gain.linearRampToValueAtTime(0.0, release);
    },
    gainNode: volumeEnveope,
  };
}
function channel(ctx, sf2, id, ui, pool) {
  const vis = mkcanvas({ container: ui.canc, height: 80 });
  const activeNotes = [];
  function mkZoneRoute(pcm, shdr, zone, ref) {
    const lops = shdr.loops;
    //set to no loop
    if (zone.SampleModes == 0 || lops[1] <= lops[0]) lops[0] = -1;
    const [spinner, volEG, lpf] = [
      new SpinNode(ctx, { pcm, loops: shdr.loops, ref }),
      mkEnvelope(ctx, zone),
      new LowPassFilterNode(ctx, semitone2hz(zone.FilterFc)),
    ];

    spinner.connect(volEG.gainNode).connect(lpf).connect(ctx.destination);

    return { spinner, lpf, volEG };
  }
  let _midicc;
  let filterKV, pg, _pid, _bankId;
  async function setProgram(pid, bankId) {
    _pid = pid;
    _bankId = bankId;
    ui.name = "pid " + pid + " bid " + bankId;
    pg = loadProgram(sf2, pid, bankId);
    filterKV = pg.filterKV;
    await pg.preload();
  }
  function silence() {
    activeNotes().forEach((v) => v.volEG.keyOff(0));
  }
  async function keyOn(key, vel) {
    if (!filterKV && _pid && _bankId) {
      setProgram(_pid, _bankId);
    }
    const { shdr, ref, ...zone } = filterKV(key, vel)[0];
    const pcm = await shdr.data();
    const { spinner, volEG, lpf } =
      pool.dequeue(pcm, shdr, zone, ref) || mkZoneRoute(pcm, shdr, zone, ref);
    if (spinner.zref != ref)
      spinner.sample = {
        pcm,
        loops: shdr.loops,
        zref: ref,
        shdr,
        zone,
      };

    spinner.stride = zone.calcPitchRatio(key, ctx.sampleRate); // ({ key, zone, shdr });
    volEG.midiState = _midicc;
    spinner.reset();
    volEG.keyOn(ctx.currentTime + ctx.baseLatency);

    activeNotes.push({ spinner, volEG, lpf, key });
    ui.zone = zone;

    ui.midi = key;
    ui.velocity = vel;
    renderFrames(vis, pcm);
    requestAnimationFrame(() => renderFrames(vis, pcm));
  }

  function keyOff(key) {
    for (let i = 0; i < activeNotes.length; i++) {
      if (activeNotes[i].key == key) {
        var unit = activeNotes[i];
        unit.volEG.keyOff(ctx.currentTime);
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
    set midicc(cc) {
      _midicc = cc;
    },
  };
}
function semitone2hz(c) {
  return Math.pow(2, (c - 6900) / 1200) * 440;
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
function AUnitPool() {
  const pool = [];
  function dequeue(pcm, shdr, zone, ref) {
    //if (pool.length < 5) return null;

    for (const i in pool) {
      if (pool[i].spinner.zref == ref) {
        const r = pool[i];
        r.volEG.zone = zone;
        pool.splice(i, 1);
        return r;
      }
    }
    for (const i in pool) {
      if (pool[i].spinner.flsize <= pcm.length) {
        const r = pool[i];
        r.volEG.zone = zone;
        pool.splice(i, 1);
        return r;
      }
    }
    if (pool.length < 5) return null;
    const { spinner, volEG, lpf } = pool.shift();
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
