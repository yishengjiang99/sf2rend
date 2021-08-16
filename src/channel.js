import { SpinNode } from "../spin/spin.js";
import { loadProgram } from "../sf2-service/read.js";
import { mkEnvelope } from "./adsr.js";
export function channel(aggregatedCtx, sf2, channelId, ui) {
  const { ctx, spinner, lpf } = aggregatedCtx;
  console.assert(sf2 != null && sf2.presetRefs != null);
  const activeNotes = [];
  const volEG = mkEnvelope(ctx);
  spinner
    .connect(lpf, channelId, channelId)
    .connect(volEG.gainNode)
    .connect(ctx.destination);
  let _midicc;
  let pg;

  async function setProgram(pid, bankId, name = "") {
    ui.name = name || "pid " + pid + " bid " + bankId;
    pg = loadProgram(sf2, pid, bankId);
    await spinner.shipProgram(pg);
    return pg;
  }
  function silence() {
    activeNotes().forEach((v) => v.volEG.keyOff(0));
  }
  async function keyOn(key, vel) {
    if (!pg) return;
    const zone = pg.filterKV(key, vel)[0];
    spinner.keyOn(channelId, zone, key, vel);
    volEG.midiState = _midicc;
    volEG.zone = zone;
    volEG.keyOn(ctx.currentTime + ctx.baseLatency);
    activeNotes.push({ spinner, volEG, lpf, key });
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
    ctx,
    set midicc(cc) {
      _midicc = cc;
    },
  };
}
function semitone2hz(c) {
  return Math.pow(2, (c - 6900) / 1200) * 440;
}
