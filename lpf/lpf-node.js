export class LPFWorkletNode extends AudioWorkletNode {
  static async init(ctx) {
    try {
      await ctx.audioWorklet.addModule("lpf/lpf-proc.js");
    } catch (e) {
      console.trace(e);
      throw e;
    }
  }
  constructor(ctx, { FilterFc, FilterQ }) {
    super(ctx, "lpf", {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: [1],
      processorOptions: {
        FilterFc,
        FilterQ,
        sampleRate: ctx.sampleRate,
      },
    });
  }
  // addLFO(freq, delay, ModLFO2FilterFC) {}
}
