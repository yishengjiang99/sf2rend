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
      apath
        .subscribeNextMsg((data) => data.zack && data.arr)
        .then(({ arr, ref }) => {
          uiController.active = true;
          uiController.velocity = vel;
          uiController.midi = key;
          uiController.presetId = this.presetId;
          uiController.zone = { arr, ref };
        });
      zones.slice(0, 2).map((zone, i) => {
        spinner.port.postMessage([
          midi_ch_cmds.note_on,
          channelId,
          key,
          vel,
          [this.presetId, zone.ref],
          zone.calcPitchRatio(key, spinner.context.sampleRate),
        ]);
        apath.lowPassFilter(channelId * 2 + 1, zone.FilterFc);
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
