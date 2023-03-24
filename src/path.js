import { SpinNode } from "../spin/spin.js";
import { LowPassFilterNode } from "../lpf/lpf.js";
import { mkcanvas } from "../chart/chart.js";
import { timeseries } from "./timeseries.js";
import { mkdiv } from "https://unpkg.com/mkdiv@3.1.0/mkdiv.js";

export async function mkpath(ctx, additional_nodes = []) {
  await SpinNode.init(ctx);
  await LowPassFilterNode.init(ctx);
  const spinner = new SpinNode(ctx, 16);
  const merger = new GainNode(ctx);
  const gainNodes = Array(16).fill(new GainNode(ctx, { gain: 1 }));
  const lpfs = Array(16).fill(new LowPassFilterNode(ctx));

  const masterMixer = new GainNode(ctx, { gain: 1.0 });
  for (let i = 0; i < 16; i++) {
    spinner.connect(gainNodes[i], i, 0).connect(merger);
  }
  let head = merger;
  while (additional_nodes.length) {
    head = additional_nodes.shift();
    merger.connect(head);
  }
  const msg_cmd = (cmd, args) => spinner.port.postMessage({ ...args, cmd });
  return {
    spinner,
    loadPreset: spinner.shipProgram,
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
  };
}
