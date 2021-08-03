import Module from "./spin.wasm.js";
const sinwave = new Float32Array(4096 + 10);
sinwave.map((v, i) => (sinwave[i] = Math.sin((2 * Math.PI * i) / 4096)));

const spinner = Module().then(async (module) => {
  await module.ready;
  const ref = module._newSpinner(4096 + 10, 0, 4096);
  const struct = new Uint32Array(module.HEAPU8.buffer, ref, 8);
  const uiInput = new Float32Array(module.HEAPU8.buffer, struct[2], 256);
  for (let i = 0; i < 128; i++) {
    uiInput[i] = 1.1;
  }
  const pcmInput = new Float32Array(module.HEAPU8.buffer, struct[0], 5006);
  console.log(struct, uiInput, pcmInput);
  pcmInput.set(sinwave);
  console.log(pcmInput);
  const output = new Float32Array(module.HEAPU8.buffer, struct[1], 128);
  console.log(output);
  console.log(struct, output);

  module._spin(ref);
  console.log(struct, new Uint32Array(module.HEAPU8.buffer, ref, 8), output);
  return {
    spin: () => module._spin(ref),
    pcmInput,
    uiInput,
  };
})

/* eslint-disable no-unused-vars */
class SpinProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: "stride",
        type: "a-rate",
        minValue: -40,
        maxValue: 4000,
        defaultValue: 1.0,
      },
    ];
  }
  constructor(options) {
    super(options);
    console.log("new spin");
    const {
      processorOptions: { sb, wasm },
    } = options;
    this.pcm = new Float32Array(sb, 16 + 128 * 4);
    this.pcm_meta = new Uint32Array(sb, 0, 4);
    this.ui_input = new Float32Array(sb, 16, 128);

    this.inst = new WebAssembly.Instance(new WebAssembly.Module(wasm), {
      env: {},
    });
    const {
      exports: { memory, newSpinner },
    } = this.inst;
    this.memory = memory;
    this.spinner = newSpinner(
      this.pcm.length,
      this.pcm_meta[1],
      this.pcm_meta[2]
    );

    this.sync();
  }
  sync() {
    this.pcm_meta[0] = 0;

    const [_, loopstart, loopend, byteLength] = this.pcm_meta;
    const loops = new Uint32Array(this.memory.buffer, this.spinner + 16, 2);
    loops[0] = loopstart;
    loops[1] = loopend;

    const refs = new Uint32Array(this.memory.buffer, this.spinner, 2);
    this.inputArray = new Float32Array(
      this.memory.buffer,
      refs[0],
      this.pcm.length
    );
    this.inputArray.set(this.pcm, 0, byteLength);

    this.output = new Float32Array(this.memory.buffer, refs[1], 128);
    this.inst.exports.reset();
  }

  process(_, [[o]], parameters) {
    if (this.pcm_meta[0] == -1) {
      return false;
    }
    if (this.pcm_meta[0] == 1) {
      this.sync();
    }
    if (this.pcm_meta[0] == 2) {
      this.inst.exports.reset();
      this.pcm_meta[0] = 0;
    }

    // for (let i = 0; i < 128; i++) {
    //   this.output[i] = 0;
    // }
    const stride = parameters.stride[0];
    this.inst.exports.spin(this.spinner, stride);
    o.set(this.output);
    return true;
  }
}
registerProcessor("spin-proc", SpinProcessor);
