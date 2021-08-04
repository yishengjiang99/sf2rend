/* eslint-disable no-unused-vars */
class SpinProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: "stride",
        type: "a-rate",
        minValue: -40,
        maxValue: 40,
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
    this.pcm = new Float32Array(sb, 16);
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
    /*
      float *inputf, *outputf;
  float fract;
  uint32_t position, loopStart, loopEnd;
  float stride, strideInc;*/
    this.spinStruct = [
      new Uint32Array(memory.buffer, this.spinner, 6),
      new Float32Array(memory.buffer, this.spinner + 24, 2),
    ];

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
      //this.inst.exports.reset();

      this.pcm_meta[0] = 0;
    }

    // for (let i = 0; i < 128; i++) {
    //   this.output[i] = 0;
    // }
    const stride = parameters.stride;
    const strideInc = (stride[stride.length - 1] - stride[0]) / 128;
    this.spinStruct[1][0] = stride[0];
    this.spinStruct[1][1] = strideInc;

    this.inst.exports.spin(this.spinner, 128);
    o.set(this.output);
    return true;
  }
}
registerProcessor("spin-proc", SpinProcessor);
