import { LowPassFilterNode } from "./lpf/lpf.js";
import { SpinNode } from "./spin/spin.js";
import mkEnvelope from "./adsr.js";
import { semitone2hz } from "./sf2-service/zoneProxy.js";
import { mkcanvas, chart } from "./chart/chart.js";

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
    spinner.stride = calcPlaybackRatio({ key, zone, shdr });
    volEG.keyOn();
    activeNotes.push({ spinner, volEG, lpf, key });
    ui.zone = zone;

    ui.midi = key;
    ui.velocity = vel;
  }
  function calcPlaybackRatio({
    key,
    shdr: { originalPitch, sampleRate },
    zone,
  }) {
    const rootkey =
      zone.OverrideRootKey > -1 ? zone.OverrideRootKey : originalPitch;
    const samplePitch =
      rootkey * 100 + zone.CoarseTune * 100 + zone.FineTune * 1;
    const pitchDiff = (key * 100 - samplePitch) / 1200;
    const r = Math.pow(2, pitchDiff) * (sampleRate / ctx.sampleRate);
    return r;
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
