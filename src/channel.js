import { SpinNode } from "../spin/spin.js";
import { mkcanvas, renderFrames } from "../chart/chart.js";
import { loadProgram } from "../sf2-service/read.js";
import { mkEnvelope } from "./adsr.js";
import { LowPassFilterNode } from "../lpf/lpf.js";
export function channel(ctx, sf2, id, ui) {
  console.assert(sf2 != null && sf2.presetRefs != null);
  const activeNotes = [];
  const spinner = SpinNode.alloc(ctx);
  const volEG = mkEnvelope(ctx);
  const lpf = new LowPassFilterNode(ctx, 15555);
  spinner.connect(volEG.gainNode).connect(lpf).connect(ctx.destination);
  let _midicc;
  let pg;

  async function setProgram(pid, bankId, name = "") {
    ui.name = name || "pid " + pid + " bid " + bankId;
    pg = loadProgram(sf2, pid, bankId);
    await spinner.shipProgram(pg);
    return pg;
    // await pg.preload();
  }
  function silence() {
    activeNotes().forEach((v) => v.volEG.keyOff(0));
  }
  async function keyOn(key, vel) {
    if (!pg) return;
    const zone = pg.filterKV(key, vel)[0];
    spinner.keyOn(id, zone, key, vel);
    volEG.midiState = _midicc;
    volEG.zone = zone;
    lpf.frequency = semitone2hz(zone.FilterFc);
    volEG.keyOn(ctx.currentTime + ctx.baseLatency);
    activeNotes.push({ spinner, volEG, lpf, key });
    ui.zone = zone;
    ui.midi = key;
    ui.velocity = vel;
  }

  function keyOff(key) {
    for (let i = 0; i < activeNotes.length; i++) {
      if (activeNotes[i].key == key) {
        var unit = activeNotes[i];
        unit.volEG.keyOff(ctx.currentTime + ctx.baseLatency);

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
