class SpinProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: "stride",
        type: "a-rate",
        minValue: 0,
        maxValue: 20000,
        defaultValue: 1.0,
      },
    ];
  }
  constructor(options) {
    super(options);
    const {
      processorOptions: { sb, wasm, loopStart, loopEnd },
    } = options;
    this.sb = new Float32Array(sb);

    const inst = new WebAssembly.Instance(new WebAssembly.Module(wasm), {
      env: {},
    });
    this.memory = inst.exports.memory;
    this.spinner = inst.exports.newSpinner(this.sb.length, loopStart, loopEnd);
    this.refs = new Uint32Array(this.memory.buffer, this.spinner, 2);
    this.output = new Float32Array(this.memory.buffer, this.refs[1], 128);
    this.wasm = inst;

    this.spin = inst.exports.spin;
    inst.exports.reset();
    this.sync();
  }
  sync() {
    console.log("sets");
    const inputArray = new Float32Array(
      this.memory.buffer,
      this.refs[0],
      this.sb.length
    );
    inputArray.set(this.sb);
    //     this.wasm.exports.reset();
    //     console.log("reset");
  }

  process(_, [[o]], parameters) {
    for (let i = 0; i < 128; i++) {
      this.output[i] = 0;
    }
    const stride = parseFloat(parameters["stride"][0]);
    this.spin(this.spinner, stride);

    o.set(this.output);
    return true;
  }
}
registerProcessor("spin-proc", SpinProcessor);
