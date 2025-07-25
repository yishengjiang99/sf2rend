import { DRUMSCHANNEL, midi_ch_cmds, midi_effects, nvpc } from "./constants.js";

export function createChannel(uiController, channelId, sf2, apath) {
  let _sf2 = sf2;
  let program;
  let bankId = channelId == DRUMSCHANNEL ? 128 : 0;

  const spinner = apath.spinner;
  const kd_map = Array(nvpc).fill(0);
  let ct_cnt = 0;
  return {
    setSF2(sf2) {
      _sf2 = sf2;
    },
    async setProgram(pid, bid) {
      this.presetId = pid | bid;
      program = _sf2.loadProgram(pid, bid);
      if (!program) {
        alert(bid + " " + pid + " no found");
        uiController.hidden = true;
        return;
      }
      await spinner.shipProgram(program, pid | bid);
      uiController.hidden = false;
      uiController.name = program.name;
      uiController.presetId = this.presetId;
      uiController.zone = program.filterKV(60, 60)[0];
      return program;
    },
    setCC({ cc, val }) {
      if (cc === midi_effects.bankselectcoarse) {
        alert("bank seleec to " + val);
        bankId |= val << 7;
      } else if (cc === midi_effects.bankselectfine) {
        bankId |= val;
      }
      uiController.CC = {key: cc, value: val};
    },
    keyOn(key, vel) {
      const zones = program.filterKV(key, vel);
      zones.map((zone, i) => {
        spinner.port.postMessage([
          midi_ch_cmds.note_on,
          channelId,
          key,
          vel,
          zone.arr,
        ]);
      });

      if (!zones[0]) return;
      return zones[0];
    },
    keyOff(key, vel) {
      spinner.port.postMessage([midi_ch_cmds.note_off, channelId, key, vel]);
      requestAnimationFrame(() => (uiController.active = false));
    },
  };
}
