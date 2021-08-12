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
      processorOptions: { sb, wasm, lpfwasm, fc },
    } = options;

    this.inst = new WebAssembly.Instance(new WebAssembly.Module(wasm), {
      env: {},
    });
    this.port.onmessage = this.hdlemsg.bind(this);

    const {
      exports: { memory, newSpinner },
    } = this.inst;
    this.memory = memory;
  }
  hdlemsg({ data: { pcm, loops } }) {
    if (pcm && loops) {
      const fl = new Float32Array(pcm);

      if (
        !this.spinner ||
        !this.inputArray ||
        this.inputArray.length < fl.length
      ) {
        this.spinner = this.inst.exports.newSpinner(
          pcm.length,
          loops[0],
          loops[1]
        );
        this.spinStruct = [
          new Uint32Array(this.memory.buffer, this.spinner, 6),
          new Float32Array(this.memory.buffer, this.spinner + 24, 6),
        ];

        this.inputArray = new Float32Array(
          this.memory.buffer,
          this.spinStruct[0][0],
          pcm.length
        );
        this.output = new Float32Array(
          this.memory.buffer,
          this.spinStruct[0][1],
          128
        );
      }
      this.inputArray.set(fl);
      this.spinStruct[0][3] = 0;
      this.spinStruct[0][4] = loops[0];
      this.spinStruct[0][5] = loops[1];
    }
  }
  // sync() {
  //   this.pcm_meta[0] = 0;

  //   const [_, loopstart, loopend, byteLength] = this.pcm_meta;
  //   const loops = new Uint32Array(this.memory.buffer, this.spinner + 16, 2);
  //   loops[0] = loopstart;
  //   loops[1] = loopend;

  //   const refs = new Uint32Array(this.memory.buffer, this.spinner, 2);
  //   this.inputArray = new Float32Array(
  //     this.memory.buffer,
  //     refs[0],
  //     this.pcm.length
  //   );
  //   this.inputArray.set(this.pcm, 0, byteLength);

  //   this.output = new Float32Array(this.memory.buffer, refs[1], 128);
  //   this.inst.exports.reset();
  // }

  process(_, [[o]], parameters) {
    if (!this.output) return true;

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
