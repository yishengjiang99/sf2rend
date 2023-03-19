export function createChannel(uiController, channelId, sf2, spinner) {
  let _sf2 = sf2;
  let program;

  return {
    setSF2(sf2) {
      _sf2 = sf2;
    },
    async setProgram(pid, bid) {
      program = _sf2.loadProgram(pid, bid);
      await spinner.shipProgram(program, pid | bid);
      uiController.name = program.name;
      uiController.presetId = pid;
    },
    setCC({ key, vel }) {
      spinner.port.postMessage([0xb0, channelId, key, vel]);
      uiController.CC = { key, value: vel };
    },
    keyOn(key, vel) {
      const zones = program.filterKV(key, vel);
      zones.slice(0, 2).map((zone, i) => {
        spinner.keyOn(channelId * 2 + i, zone, key, vel);
      });

      if (!zones[0]) return;
      requestAnimationFrame(() => {
        uiController.active = true;
        uiController.velocity = vel;
        uiController.midi = key;
        //  uiController.zone = zones[0];
      });
    },
    keyOff(key, vel) {
      spinner.keyOff(channelId * 2, key, vel);
      spinner.keyOff(channelId * 2 + 1, key, vel);

      requestAnimationFrame(() => (uiController.active = false));
    },
  };
}
