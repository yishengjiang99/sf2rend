import { wasmbin } from "./lpf.wasm.js";

function registerProcessor(name, processorCtor) {
  // thanks https://github.com/guest271314/webtransport/blob/main/webTransportAudioWorkletWebAssemblyMemoryGrow.js
  return `console.log(globalThis);\n${processorCtor};\nregisterProcessor('${name}', ${processorCtor.name});`;
}
export class LowPassFilterNode extends AudioWorkletNode {
  static param_defaults = { frequency: 13500, Q: 100 };
  static async init(ctx) {
    const procUrl = URL.createObjectURL(
      new Blob([registerProcessor("lpf-proc", LowPassFilterProc)], {
        type: "text/javascript",
      })
    );
    await ctx.audioWorklet
      .addModule(procUrl, { credentials: "omit" })
      .catch((e) => console.trace(e));
  }
  constructor(ctx, options = {}) {
    super(ctx, "lpf-proc", {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      processorOptions: Object.assign(options, self.param_defaults, {
        wasmbin,
      }),
    });
  }
  set frequency(freq) {
    this.port.postMessage(freq / this.context.sampleRate);
  }
}

class AudioWorkletProcessor {}
class LowPassFilterProc extends AudioWorkletProcessor {
  static ct2hz(cents) {
    return 8.176 * Math.pow(2.0, cents / 1200.0);
  }
  static get parameterDescriptors() {
    return [
      {
        name: "FilterFC",
        defaultValue: 13500,
        minValue: 0,
        maxValue: 20000,
        automationRate: "a-rate",
      },
    ];
  }

  constructor(options) {
    super(options);
    const {
      processorOptions: { frequency, Q, wasmbin },
    } = options;
    this.initialFC = frequency;
    const instance = new WebAssembly.Instance(new WebAssembly.Module(wasmbin));
    const { memory, fcArray, newLpf, inputArray, process_LIST } =
      instance.exports;
    this.lpf = newLpf(0, frequency, 48000);
    this.lpfData = new Float32Array(memory.buffer, this.lpf, 4);
    this.process_LIST = process_LIST;
    this.inputArray = new Float32Array(memory.buffer, inputArray, 128);
    this.dynamicFcArray = new Float32Array(memory.buffer, fcArray, 129);
  }
  onmsg({ data }) {
    console.log(data);
  }
  process([inputs], [outputs], params) {
    if (!inputs.length) return true;
    this.inputArray.set(inputs[0]);
    this.dynamicFcArray.set(params.FilterFC);
    for (let i = 0; i < 1; i++)
      this.process_LIST(this.lpfs, 128, this.inputArray, this.dynamicFcArray);
    outputs[0].set(this.inputArray);
    outputs[1].set(this.inputArray);

    return true;
  }
}
