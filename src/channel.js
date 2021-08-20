import { load, loadProgram } from "sf2-service";
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
      let eg;
      console.assert(_pg != null);
      const zone = _pg.filterKV(key, vel)[0];
      volEG.zone = zone;
      volEG.midiState = _midicc;
      spinner.keyOn(channelId, zone, key, vel);
      eg = volEG.keyOn(vel);

      requestAnimationFrame(() => {
        ui.velocity = vel;
        ui.midi = key;
        ui.env1 = eg;
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
