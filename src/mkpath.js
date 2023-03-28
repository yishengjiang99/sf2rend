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
    spinner.connect(lpfs[i], i, 0).connect(gainNodes[i]).connect(merger);
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
    /* forwards and enhances midi messages */
    ooMIDIChannelMessage: function ({ data }) {
      const [a, b, c] = data;
      const cmd = a & 0xf0;
      const ch = a & 0x0f;
      const key = b & 0x7f;
      const velocity = c & 0x7f;
      const zone = this.channelState[ch].zoneObj;
      switch (cmd) {
        case midi_ch_cmds.note_on:
          if (zone) {
            const pitchRatio = calcPitchRatio(key, ctx.sampleRate, zone);
            spinner.port.postMessage([
              0x9000,
              ch,
              pitchRatio,
              velocity,
              zone.ref,
            ]);
            queueMicrotask(() => (this.channelState[ch][key] = "on"));
          }
          break;

        default:
          break;
      }
    },
    bindKeyboard: function (channel) {
      this.channelState[channel].active = "keyboard";
      if (!this.channelState[channel].zoneObj) {
        return false;
      }
      const keys = ["a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j"];
      window.onkeydown = (e) => {
        const index = keys.indexOf(e.key);
        const baseOctave = this.channelState[channel].octave || 48;
        if (index < 0) return;
        this.ooMIDIChannelMessage({
          data: [midi_ch_cmds.note_on | channel, index + baseOctave, 100],
        });
      };
      window.onkeyup = (e) => {
        const baseOctave = this.channelState[channel].octave || 48;
        const index = keys.indexOf(e.target.index + baseOctave);
        if (index < 0) return;
        this.spinner.keyOff(channel, index + baseOctave, 100);
      };
    },
  };
}
