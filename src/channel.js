import { loadProgram } from "../sf2-service/read.js";
export function channel(aggCtx, channelId, ui) {
  const activeNotes = [];
  const ctx = aggCtx.ctx;
  const spinner = aggCtx.spinner;
  const volEG = aggCtx.egs[channelId];
  let _midicc;
  let _pg;
  let _pid;
  return {
    get pid() {
      return _pid;
    },
    set midicc(midicc) {
      _midicc = midicc;
    },
    set program({ pg, pid, bankId, name }) {
      _pg = pg;
      _pid = pid;
      ui.name = name || "pid " + pid + " bid " + bankId;
    },
    keyOn(key, vel) {
      console.assert(_pg != null);
      _pg.filterKV(key, vel).forEach((zone) => {
        volEG.zone = zone;
        volEG.midiState = _midicc;
        volEG.keyOn(ctx.currentTime + ctx.baseLatency);
        spinner.keyOn(channelId, zone, key, vel);
      });
      requestAnimationFrame(() => {
        ui.velocity = vel;
        ui.key = key;
      });
    },
    keyOff(key, vel) {
      volEG.keyOff();
    },
  };
}
function semitone2hz(c) {
  return Math.pow(2, (c - 6900) / 1200) * 440;
}
