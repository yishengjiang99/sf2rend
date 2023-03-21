export function createChannel(uiController, channelId, sf2, spinner) {
  let _sf2 = sf2;
  let program;
  const key_on_map = [];

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
      zones.slice(3).map((zone, i) => {
        key_on_map[key] = channelId * +i;
        spinner.keyOn(channelId * 2 + i, zone, key, vel);
      });

      // zones[0].shdr.data().then((pcm) => {
      //   const abc = new AudioBufferSourceNode(spinner.context, {
      //     buffer: spinner.context.createBuffer(1, pcm.length, 48000),
      //     playbackRate: zones[0].calcPitchRatio(
      //       key,
      //       spinner.context.sampleRate
      //     ),
      //     loop: true,
      //     gain: 1,
      //   });
      //   abc.connect(spinner.context.destination);
      //   abc.start(0);
      //   abc.stop(3);
      // });
      // zones.slice(2, 2).map((zone, i) => {
      //   spinner.keyOn(channelId * 2 + 2 + i, zone, key, vel);
      // });

      if (!zones[0]) return;
      requestAnimationFrame(() => {
        uiController.active = true;
        uiController.velocity = vel;
        uiController.midi = key;
        //  uiController.zone = zones[0];
      });
    },
    keyOff(key, vel) {
      while ((key_on_map[key] || []).length) {
        spinner.keyOff(key_on_map[key].shift(), key, vel);
      }
      //      spinner.keyOff(channelId * 2 + 1, key, vel);

      requestAnimationFrame(() => (uiController.active = false));
    },
  };
}
