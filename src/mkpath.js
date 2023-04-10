import { SpinNode } from "../spin/spin.js";
import { LowPassFilterNode } from "../lpf/lpf.js";
import {midi_ch_cmds, midi_effects} from "./constants.js";
import FFTNode from "../fft-64bit/fft-node.js";
import { mkdiv } from "../mkdiv/mkdiv.js";
import {drawLoops} from "../volume-meter/main.js";
import createAudioMeter from "../volume-meter/volume-meter.js"
import {anti_denom_dither} from './misc.js';
export async function mkpath(ctx, eventPipe) {
  await SpinNode.init(ctx).catch(console.trace);
  await FFTNode.init(ctx).catch(console.trace);
  await LowPassFilterNode.init(ctx).catch(console.trace);
  const spinner = new SpinNode(ctx);
  const lpfs = Array(32).fill(new LowPassFilterNode(ctx));
  const channelIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const fft = new FFTNode(ctx);
  const whitenoise = anti_denom_dither(ctx);
  whitenoise.start();
  const clipdetect = createAudioMeter(ctx);

  whitenoise.connect(spinner).connect(ctx.destination, 0);
  spinner.connect(fft, 1).connect(ctx.destination);
  spinner.connect(clipdetect, 2);

  const channelState = [];

  const msg_cmd = (cmd, args) => spinner.port.postMessage({ ...args, cmd });
  spinner.port.onmessage = ({ data: { dv, ch } }) => {
    if (dv && ch) {
      console.log(dv, ch);
    }
  };
  return {
    detectClips(canvas) {
      const timer = drawLoops(canvas, clipdetect);
      return function cleanup() {
        cancelAnimationFrame(timer);
      };
    },
    analysis: {
      get waveForm() {
        return fft.getWaveForm();
      },
      get frequencyBins() {
        return fft.getFloatFrequencyData();
      },
    },
    spinner,
    querySpState: async function (channelId) {
      spinner.port.postMessage({ query: channelId });
      return await new Promise((resolve, reject) => {
        setTimeout(reject, 100);
        spinner.port.onmessage = ({ data }) => {
          if (data.queryResponse) resolve(data.queryResponse);
        };
      });
    },
    loadPreset: spinner.shipProgram,
    channelState,
    setNewZone: function (zone) {
      return msg_cmd("newZone", { zone });
    },
    lowPassFilter: function (channel, initialFrequency) {
      lpfs[channel].parameters
        .get("FilterFC")
        .linearRampToValueAtTime(initialFrequency, ctx.currentTime);
      return lpfs[channel];
    },
    silenceAll() {
      spinner.port.postMessage({cmd: "reset_gm"});
    },
    ghettoRampMidiCCToValueAtTime(ch, cc, val, time) {

    },
    async mute(channel, bool) {
      this.startAudio();
      const ramp = bool ? [60, 44, 3] : [33, 55, 80];
      while (ramp.length) {
        eventPipe.postMessage([midi_ch_cmds.continuous_change | channel, 7, ramp.shift()]);
        await new Promise(r => setTimeout(r, 5));
      }
    },
    async startAudio() {
      if (ctx.state !== "running") await ctx.resume();
    },
    ctrl_bar(container) {
      "gm_reset|debug"
        .split("|")
        .map((cmd) =>
          mkdiv(
            "button",
            { onclick: () => spinner.port.postMessage({ cmd }) },
            cmd
          ).attachTo(container)
        );
    },
    subscribeNextMsg: async function (precateFn) {
      return await new Promise((resolve, reject) => {
        setTimeout(reject, 2000);
        spinner.port.onmessage = ({ data }) => {
          if (precateFn(data)) resolve(data);
        };
      });
    },
    bindToolbar: function () {
      document
        .querySelectorAll("input[type=checkbox], input[type=range]")
        .forEach((b) => {
          if (b.dataset.path_cmd) {
            let cmd = b.dataset.path_cmd;
            let p1 = parseInt(b.dataset.p1 || "0");
            b.addEventListener("click", (e) => {
              const value = b.type == "checkbox" ? b.checked : b.value;

              switch (cmd) {
                case "solo":
                  channelIds.forEach((id) => id != p1 && this.mute(id, value));
                  eventPipe.postMessage([midi_ch_cmds.continuous_change | p1, midi_effects.volumecoarse, 50]);
                  setTimeout(() => eventPipe.postMessage([midi_ch_cmds.continuous_change | p1, midi_effects.volumecoarse, 99]), 10);
                  setTimeout(() => eventPipe.postMessage([midi_ch_cmds.continuous_change | p1, midi_effects.volumecoarse, 126]), 15);
                  break;
                case "mute":
                  this.mute(p1, value);
                  break;
                case "lpf":
                  this.lowPassFilter(p1, value);
                  break;
                default:
                  spinner.port.postMessage({
                    cmd: b.dataset.path_cmd,
                  });
                  break;
              }
            });
          }
        });
    },
    bindKeyboard: function (get_active_channel_fn, eventpipe) {
      const keys = ["a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j"];
      window.onkeydown = (e) => {
        if (e.repeat) return;
        if (e.isComposing) return;
        const channel = get_active_channel_fn();
        const baseOctave = 48;
        const index = keys.indexOf(e.key);

        if (index < 0) return;
        const key = index + baseOctave;
        e.target.addEventListener(
          "keyup",
          () => {
            eventpipe.postMessage([0x80 | channel, key, 111]);
          },
          { once: true }
        );
        eventpipe.postMessage([0x90 | channel, key, 120]);
      };
    },
  };
}
