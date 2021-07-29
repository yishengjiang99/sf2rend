const clamp = (min, v, max) => (min > v ? min : max < v ? max : v);
class LowPassFilterProc extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    const { filterFC, wasmbin } = options.processorOptions;
    console.log(filterFC);
    const instance = new WebAssembly.Instance(
      new WebAssembly.Module(wasmbin),
      {}
    );
    instance.exports.newLpf(0, filterFC);
    this.lpf = (input, detune) =>
      instance.exports.process_input(0, input, detune);

    this.srInverse = 1 / sampleRate;
    this.buffer = instance.exports.memory.buffer;
    this.port.onmessage = this.onmsg.bind(this);
  }
  onmsg({ data }) {
    new Float32Array(this.buffer, 0, 1)[0] = data;
  }
  process([input, control], [output]) {
    // debugger;
    for (let ch = 0; ch < input.length; ch++) {
      for (let i = 0; i < 128; i++) {
        const detune =
          control && control[0] ? control[0][i] * this.srInverse : 0;
        output[ch][i] = clamp(-1, this.lpf(input[ch][i], detune), 1);
      }
    }
    return true;
  }
}
registerProcessor("lpf", LowPassFilterProc);
