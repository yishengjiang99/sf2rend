/* eslint-disable no-unused-vars */
class SpinProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: "stride",
        type: "a-rate",
        minValue: -20,
        maxValue: 20,
        defaultValue: 1.0,
      },
    ];
  }
  constructor(options) {
    super(options);
    const {
      processorOptions: { sb, wasm },
    } = options;
    this.pcm = new Float32Array(sb, 8);
    this.pcm_updated = new Uint32Array(sb, 0, 1);
    this.pcm_meta = new Uint32Array(sb, 0, 4);

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
    const refs = new Uint32Array(this.memory.buffer, this.spinner, 2);
    this.inputArray = new Float32Array(
      this.memory.buffer,
      refs[0],
      this.pcm.length
    );
    this.output = new Float32Array(this.memory.buffer, refs[1], 128);
    this.sync();
  }
  sync() {
    const [_, loopstart, loopend, byteLength] = this.pcm_meta;
    const loops = new Uint32Array(this.memory.buffer, this.spinner + 16, 2);
    loops[0] = loopstart;
    loops[1] = loopend;
    this.inputArray.set(this.pcm, 0, byteLength);
    this.pcm_meta[0] = 0;
    this.inst.exports.reset();
    console.log("reset");
  }

  process(_, [[o]], parameters) {
    if (this.pcm_meta[0] == 1) {
      this.sync();
    }
    for (let i = 0; i < 128; i++) {
      this.output[i] = 0;
    }
    const stride = parseFloat(parameters["stride"][0]);

    this.inst.exports.spin(this.spinner, stride);

    o.set(this.output);
    return true;
  }
}
registerProcessor("spin-proc", SpinProcessor);
