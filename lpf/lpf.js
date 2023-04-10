import { wasmbin } from "./lpf.wasm.js";


export class LowPassFilterNode extends AudioWorkletNode {
  static param_defaults = { frequency: 13500, Q: 1.0 };
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
        ...{frequency: 13500, Q: .8},
        ...options,
        wasmbin,
      },
    });
  }
  set frequency(freq) {
    this.port.postMessage(freq / this.context.sampleRate);
  }
}
