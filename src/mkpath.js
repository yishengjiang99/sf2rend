import { SpinNode } from "../spin/spin.js";
import { LowPassFilterNode } from "../lpf/lpf.js";
import { mkcanvas } from "../chart/chart.js";
import { timeseries } from "./timeseries.js";
import { midi_ch_cmds } from "./midilist.js";
import calcPitchRatio from "./calcPitchRatio.js";
export async function mkpath(ctx, additional_nodes = []) {
  await SpinNode.init(ctx);
  await LowPassFilterNode.init(ctx);
  const spinner = new SpinNode(ctx, 16);
  const merger = new GainNode(ctx);
  const gainNodes = Array(16).fill(new GainNode(ctx, { gain: 1 }));
  const lpfs = Array(16).fill(new LowPassFilterNode(ctx));
  const channelIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
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
  const masterMixer = new GainNode(ctx, { gain: 1.0 });
  for (let i = 0; i < 16; i++) {
    spinner.connect(gainNodes[i], i, 0).connect(merger);
  }
  let head = merger;
  while (additional_nodes.length) {
    const node = additional_nodes.shift();
    head.connect(node);
    head = node;
  }
  const msg_cmd = (cmd, args) => spinner.port.postMessage({ ...args, cmd });
  return {
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
    viewTimeseries({ container }) {
      container.classList.add("timerseries");
      const analyzer = new AnalyserNode(ctx, { fft: 1024 });
      additional_nodes.push(analyzer);
      timeseries({
        analyzer,
        width: 540,
        height: 255,
        canvas: mkcanvas({ container }).canvas,
      });
    },
    mute(channel) {
      gainNodes[channel].linearRampToValueAtTime(0, 0.05);
    },
    async startAudio() {
      head.connect(masterMixer).connect(ctx.destination);
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
