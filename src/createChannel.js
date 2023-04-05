import { midi_ch_cmds } from "./constants.js";

export function createChannel(uiController, channelId, sf2, apath) {
  let _sf2 = sf2;
  let program;
  const spinner = apath.spinner;

  return {
    setSF2(sf2) {
      _sf2 = sf2;
    },
    async setProgram(pid, bid) {
      this.presetId = pid | bid;
      program = _sf2.loadProgram(pid, bid);
      uiController.hidden = false;

      if (!program) {
        alert(bid + " " + pid + " no found");
        return;
      }
      await spinner.shipProgram(program, pid | bid);
      uiController.hidden = false;
      uiController.name = program.name;
      uiController.presetId = this.presetId;
    },
    setCC({ key, vel }) {
      spinner.port.postMessage([0xb0, channelId, key, vel]);
      uiController.CC = { key, value: vel };
    },
    keyOn(key, vel) {
      const zones = program.filterKV(key, vel);
      zones.slice(0, 2).map((zone, i) => {
        spinner.port.postMessage([
          midi_ch_cmds.note_on,
          channelId * 2 + i,
          zone.calcPitchRatio(key, spinner.context.sampleRate),
          vel,
          [this.presetId, zone.ref],
        ]);
        apath.lowPassFilter(channelId * 2 + 1, zone.FilterFc);
      });
      if (!zones[0]) return;
      requestAnimationFrame(() => {
        uiController.active = true;
        uiController.velocity = vel;
        uiController.midi = key;
        uiController.zone = zones[0];
      });
      return zones[0];
    },
    keyOff(key, vel) {
      spinner.keyOff(channelId * 2 + 1, key, vel);
      spinner.keyOff(channelId * 2, key, vel);
      requestAnimationFrame(() => (uiController.active = false));
    },
  };
}
