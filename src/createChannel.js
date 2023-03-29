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
        // uiController.env1 = zones[0].arr
        //   .slice(34, 39)
        //   .map((d) => Math.pow(2, d / 1200));
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
