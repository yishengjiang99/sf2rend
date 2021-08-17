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
      const zone = _pg.filterKV(key, vel)[0];
      volEG.midiState = _midicc;
      volEG.zone = zone;
      spinner.keyOn(channelId, zone, key, vel);
      volEG.keyOn(0);

      requestAnimationFrame(() => {
        ui.velocity = vel;
        ui.key = key;
      });
    },
    keyOff(key, vel) {
      volEG.keyOff(0);
    },
  };
}
function semitone2hz(c) {
  return Math.pow(2, (c - 6900) / 1200) * 440;
}
