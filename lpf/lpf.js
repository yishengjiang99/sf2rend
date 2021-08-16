let wasmbin;
export class LowPassFilterNode extends AudioWorkletNode {
  static async init(ctx) {
    await ctx.audioWorklet
      .addModule("lpf/lpf.proc.js")
      .catch((e) => console.trace(e));
    if (!wasmbin) wasmbin = await getwasm();
  }
  constructor(ctx, cutoffFrequency) {
    if (cutoffFrequency > ctx.sampleRate * 0.5) {
      cutoffFrequency = ctx.sampleRate * 0.5;
    }
    super(ctx, "lpf", {
      numberOfInputs: 16,
      numberOfOutputs: 16,
      processorOptions: {
        outputChannelCount: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
        wasmbin,
        filterFC: cutoffFrequency / ctx.sampleRate,
      },
    });
  }
  set frequency(freq) {
    this.port.postMessage(freq / this.context.sampleRate);
  }
  modulate(input) {
    //input.connect(this, 0, 1);
  }
}
export const getwasm = async () =>
  new Uint8Array(await fetch("lpf/lpf.wasm").then((res) => res.arrayBuffer()));

export function mkLPF(fc, wasmbin) {
  const instance = new WebAssembly.Instance(
    new WebAssembly.Module(wasmbin),
    {}
  );
  if (fc > 0.5) throw "invalid biquad pc bc filter threshold over .5 nyquist)";
  instance.exports.newLpf(0, fc);
  return function lpf(input, detune = 0) {
    return instance.exports.process_input(0, input, detune);
  };
}
