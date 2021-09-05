import { load, loadProgram } from "../sf2-service/read.js";
export function channel(aggCtx, channelId, ui) {
  const activeNotes = [];
  const ctx = aggCtx.ctx;
  const spinner = aggCtx.spinner;
  const volEG = aggCtx.egs[channelId];
  let _midicc;
  let _pg;
  let _pid;
  let _active = false;
  return {
    set active(a) {
      _active = a;
    },
    get active() {
      return _active;
    },
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
    ui,
    keyOn(key, vel) {
      if (!_pg) return;
      let eg;
      console.assert(_pg != null);

      let zones = _pg.zMap.filter(
        (z) =>
          (vel == -1 || (z.VelRange.lo < vel && z.VelRange.hi >= vel)) &&
          (key == -1 || (z.KeyRange.lo < key && z.KeyRange.hi >= key))
      );
      if (zones.length == 0) {
        zones = [_pg.zMap[0]];
      }
      zones.slice(0, 2).map((zone, i) => {
        spinner.keyOn(channelId * 2 + i, zone, key, vel);
        if (i == 0) {
          requestAnimationFrame(() => {
            volEG.zone = zone;
            ui.active = true;
            ui.velocity = vel;
            ui.midi = key;
            ui.env1 = volEG.keyOn(vel);
            ui.zone = zone;
          });
        }
      });
    },
    keyOff(key, vel) {
      if (!_pg) return;
      spinner.keyOff(channelId * 2, key, vel);
      spinner.keyOff(channelId * 2 + 1, key, vel);
      requestAnimationFrame(() => (ui.active = false));
      //volEG.keyOff();
    },
  };
}
function semitone2hz(c) {
  return Math.pow(2, (c - 6900) / 1200) * 440;
}
