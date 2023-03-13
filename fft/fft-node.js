import { wasmbin } from "./fft.wasm.js";
let wasmModule;
export default class FFTNode extends AudioWorkletNode {
  static async init(ctx) {
    await ctx.audioWorklet.addModule("./fft-proc.js");
    wasmModule = await WebAssembly.compile(wasmbin);
  }
  constructor(ctx, outputChannelCount) {
    super(ctx, "proc-fft", {
      numberOfInputs: outputChannelCount.length,
      numberOfOutputs: outputChannelCount.length,
      outputChannelCount: outputChannelCount,
      processorOptions: {
        wasmModule,
      },
    });
    this.port.onmessage = ({ data }) => (this.fftBuffer = data);
  }
  getByteTimeDomainData() {
    return new Float64Array(this.fftBuffer);
  }
}
