import { wasmbin } from "./lpf.wasm.js";


export class LowPassFilterNode extends AudioWorkletNode {
  static param_defaults = { frequency: 13500, Q: 1.0 };
  static async init(ctx) {
    await ctx.audioWorklet
      .addModule("lpf/lpf-proc.js")
      .catch((e) => console.trace(e));
  }
  constructor(ctx, options = {}) {
    super(ctx, "lpf-proc", {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      processorOptions: {
        ...{ frequency: 13500, Q: 1.0 },
        ...options,
        wasmbin,
      },
    });
  }
  set frequency(freq) {
    this.port.postMessage(freq / this.context.sampleRate);
  }
}
