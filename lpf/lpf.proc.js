const clamp = (min, v, max) => (min > v ? min : max < v ? max : v);
class LowPassFilterProc extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    const { filterFC, wasmbin } = options.processorOptions;
    const instance = new WebAssembly.Instance(
      new WebAssembly.Module(wasmbin),
      {}
    );
    this.lpf = instance.exports.newLpf(0, filterFC);

    this.instance = instance;
    this.buffer = instance.exports.memory.buffer;
    this.port.onmessage = this.onmsg.bind(this);
  }
  onmsg({ data }) {
    // const state=new Float32Array(this.buffer, 0, 1);
    // stae
  }
  process(input, output) {
    for (let i = 0; i < input.length; i++) {
      for (let ch = 0; ch < input[i]; ch++) {
        this.lpfs[i * 2 + ch] =
          this.lpfs[i * 2 + ch] ||
          this.instance.exports.newLpf((i * 2 + ch) * 4 * 4, 0.45);
        this.instance.exports.process_LIST(
          this.lpfs[i * 2 + ch],
          input[ch][i],
          input[ch][i].length
        );
        output[i][ch].set(input[i][ch]);
      }
    }
    return true;
  }
}
registerProcessor("lpf", LowPassFilterProc);
