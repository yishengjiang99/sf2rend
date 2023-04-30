import { wasmbin } from "./lpf.wasm.js";


export class LowPassFilterNode extends AudioWorkletNode {
  static default_params = {FilterFC: 13500, FilterQ: 0};
  static async init(ctx) {
    try {
      await ctx.audioWorklet
        .addModule("lpf-proc.js");
    } catch (e) {
      await ctx.audioWorklet.addModule('lpf/lpf-proc.js');
    }
  }
  constructor(ctx, options = {}) {
    super(ctx, "lpf-proc", {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      processorOptions: {
        ...self.default_params,
        ...options,
        wasmbin,
      },
    });
  }
}
