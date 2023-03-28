import { SpinNode } from "../spin/spin.js";
import { LowPassFilterNode } from "../lpf/lpf.js";
import { midi_ch_cmds } from "./constants.js";
import calcPitchRatio from "./calcPitchRatio.js";
import FFTNode from "../fft-64bit/fft-node.js";
export async function mkpath(ctx, additional_nodes = []) {
  await SpinNode.init(ctx).catch(console.trace);
  await FFTNode.init(ctx).catch(console.trace);
  await LowPassFilterNode.init(ctx).catch(console.trace);
  const spinner = new SpinNode(ctx, 16);
  const merger = new GainNode(ctx);
  const gainNodes = Array(16).fill(new GainNode(ctx, { gain: 1 }));
  const lpfs = Array(16).fill(new LowPassFilterNode(ctx));
  const channelIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const fft = new FFTNode(ctx);

  const channelState = channelIds.map(
    (index) =>
      new Proxy(
        {
          id: index,
          keys: [
            "zoneObj",
            "input",
            "midi",
            "velocity",
            "program",
            "active",
            "decibel",
          ],
          values: new Array(99),
        },
        {
          get(target, p) {
            return target.values[target.keys.indexOf(p)];
          },
          set(target, attr, value) {
            const index = target.keys.indexOf(attr);
            if (index > -1) {
              target.values[index] = value;
              return true;
            }
            return false;
          },
        }
      )
  );
  for (let i = 0; i < 16; i++) {
    spinner.connect(gainNodes[i], i, 0).connect(merger);
  }
  merger.connect(ctx.destination);

  const msg_cmd = (cmd, args) => spinner.port.postMessage({ ...args, cmd });
  spinner.port.onmessage = ({ data: { dv, ch } }) => {
    if (dv && ch) {
      console.log(dv, ch);
    }
  };
  return {
    analysis: {
      get waveForm() {
        return fft.getWaveForm();
      },
      get frequencyBins() {
        return fft.getFloatFrequencyData();
      },
    },
    spinner,
    loadPreset: spinner.shipProgram,
    channelState,
    setNewZone: function (zone) {
      return msg_cmd("newZone", { zone });
    },
    lowPassFilter: function (channel, initialFrequency) {
      lpfs[channel].FilterFC.linearRampToValueAtTime(
        initialFrequency,
        ctx.currentTime
      );
      return lpfs[channel];
    },

    mute(channel) {
      gainNodes[channel].linearRampToValueAtTime(0, 0.05);
    },
    async startAudio() {
      if (ctx.state !== "running") await ctx.resume();
    },
    bindKeyboard: function (get_active_channel_fn, eventpipe) {
      const keys = ["a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j"];
      window.onkeydown = (e) => {
        const channel = get_active_channel_fn();
        const baseOctave = this.channelState[channel].octave || 48;
        const index = keys.indexOf(e.key) + baseOctave;
        if (index < 0) return;
        eventpipe.postMessage([0x90 | channel, index, 120]);
        e.target.addEventListener(
          "keyup",
          () => {
            eventpipe.postMessage([0x80 | channel, index, 111]);
          },
          { once: true }
        );
      };
    },
  };
}
