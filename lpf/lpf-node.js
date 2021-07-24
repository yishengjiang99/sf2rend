export class LPFWorkletNode extends AudioWorkletNode {
  static async init(ctx) {
    await ctx.audioWorklet.addModule("./lpf-proc.js");
  }
  constructor(ctx, { FilterFC, FilterQ }) {
    super(ctx, "lpf", {
      numberOfInputs: 3,
      numberOfOutputs: 1,
      channelCount: [2, 1, 1],
      processorOptions: {
        FilterFC,
        FilterQ,
        sampleRate: ctx.sampleRate,
      },
    });
  }
  addLFO(freq, delay, ModLFO2FilterFC) {}
}
