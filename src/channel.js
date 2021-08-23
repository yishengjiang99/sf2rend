import { load, loadProgram } from "../sf2-service/read.js";
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
      volEG.midiState = midicc;
    },
    set program({ pg, pid, bankId, name }) {
      _pg = pg;
      _pid = pid;
      ui.name = name || "pid " + pid + " bid " + bankId;
    },
    keyOn(key, vel) {
      if (!_pg) return;
      let eg;
      console.assert(_pg != null);
      const res = _pg.filterKV(key, vel)[0];
      if (!res) return;
      spinner.keyOn(channelId, res, key, vel);

      requestAnimationFrame(() => {
        volEG.zone = res;

        eg = volEG.keyOn(vel);
        ui.velocity = vel;
        ui.midi = key;
        ui.env1 = eg;
        ui.zone = res;
      });
    },
    keyOff(key, vel) {
      if (!_pg) return;

      spinner.keyOff(channelId, key, vel);
      //volEG.keyOff();
    },
  };
}
function semitone2hz(c) {
  return Math.pow(2, (c - 6900) / 1200) * 440;
}
