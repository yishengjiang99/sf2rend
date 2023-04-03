import { SpinNode } from "../sp2/spin-node.js";
import { LowPassFilterNode } from "../lpf/lpf.js";
import FFTNode from "../fft-64bit/fft-node.js";
import { mkdiv } from "../mkdiv/mkdiv.js";
export async function mkpath(ctx) {
  await SpinNode.init(ctx).catch(console.trace);
  await FFTNode.init(ctx).catch(console.trace);
  await LowPassFilterNode.init(ctx).catch(console.trace);
  const spinner = new SpinNode(ctx, 16);
  const merger = new GainNode(ctx);
  const gainNodes = Array(16).fill(new GainNode(ctx, { gain: 0.3 }));
  const lpfs = Array(32).fill(new LowPassFilterNode(ctx));
  const channelIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const fft = new FFTNode(ctx);

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
        return fft.waveForm;
      },
      get frequencyBins() {
        return fft.FrequencyBins;
      },
    },
    spinner,
    subscribeNextMsg: async function (precateFn) {
      return await new Promise((resolve, reject) => {
        setTimeout(reject, 2000);
        spinner.port.onmessage = ({ data }) => {
          if (precateFn(data)) resolve(data);
        };
      });
    },
    querySpState: async function (channelId) {
      spinner.port.postMessage({ query: channelId });
      return await new Promise((resolve, reject) => {
        spinner.port.onmessage = ({ data }) => {
          if (data.queryResponse) resolve(data.queryResponse);
        };
      });
    },
    loadPreset: spinner.shipProgram,
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
    mute(channel) {
      gainNodes[channel].linearRampToValueAtTime(0, 0.05);
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
    bindKeyboard: function (get_active_channel_fn, eventpipe) {
      const keys = ["a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j"];
      window.onkeydown = (e) => {
        if (e.repeat) return;
        if (e.isEditing) return;
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
