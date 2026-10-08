import { wasmbin } from "./lpf.wasm.js";

/* global __BUILD_ID__ */
export class LowPassFilterNode extends AudioWorkletNode {
  static default_params = {FilterFC: 13500, FilterQ: 0};
  static async init(ctx) {
    await ctx.audioWorklet.addModule(`lpf/lpf-proc.js?v=${__BUILD_ID__}`);
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
