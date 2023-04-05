import { SpinNode } from "../spin/spin.js";
import { LowPassFilterNode } from "../lpf/lpf.js";
import { midi_ch_cmds } from "./constants.js";
import calcPitchRatio from "./calcPitchRatio.js";
import FFTNode from "../fft-64bit/fft-node.js";
import { mkdiv } from "../mkdiv/mkdiv.js";
export async function mkpath(ctx, additional_nodes = []) {
  await SpinNode.init(ctx).catch(console.trace);
  await FFTNode.init(ctx).catch(console.trace);
  await LowPassFilterNode.init(ctx).catch(console.trace);
  const spinner = new SpinNode(ctx, 16);
  const merger = new GainNode(ctx);
  const gainNodes = Array(16).fill(new GainNode(ctx, { gain: 1 }));
  const lpfs = Array(32).fill(new LowPassFilterNode(ctx));
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
    spinner.connect(lpfs[i], i).connect(gainNodes[i]).connect(merger);
  }
  merger.connect(fft).connect(ctx.destination);

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
    querySpState: async function (channelId) {
      spinner.port.postMessage({ query: channelId });
      return await new Promise((resolve, reject) => {
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
      merger.gain.linearRampToValueAtTime(0, 0.05);
    },
    mute(channel, bool) {
      this.startAudio();
      gainNodes[channel].gain.linearRampToValueAtTime(bool ? 0 : 1, 0.045);
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
        const channel = get_active_channel_fn();
        const baseOctave = this.channelState[channel].octave || 48;
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
