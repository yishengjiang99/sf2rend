import { midi_ch_cmds } from "./constants.js";

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
      console.log("ch chan ", channelId);
      const zones = program.filterKV(key, vel);

      key_on_map[key] = key_on_map[key] || [];

      zones.slice(0, 2).map((zone, i) => {
        spinner.port.postMessage([
          midi_ch_cmds.note_on,
          channelId * 2 + i,
          zone.ref,
          zone.calcPitchRatio(key, spinner.context.sampleRate),
          vel,
        ]);
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
