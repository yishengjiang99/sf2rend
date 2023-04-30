class LowPassFilterProc extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: "FilterFC",
        defaultValue: 6000,
        minValue: 0,
        maxValue: 12000,
        automationRate: "a-rate",
      },
      {
        name: "FilterQ_Cb",
        defaultValue: 0,
        minValue: -960,
        maxValue: 0,
        automationRate: "k-rate",
      },
    ];
  }

  constructor(options) {
    super(options);
    const {
      processorOptions: {FilterFC, wasmbin, FilterQ},
    } = options;
    this.FilterFC = FilterFC;
    this.FilterQ = FilterQ;
    const instance = new WebAssembly.Instance(new WebAssembly.Module(wasmbin), {
      env: {
        sinf: (x) => Math.sin(x),
        cosf: (x) => Math.cos(x),
        sinhf: (x) => Math.sinh(x),
        powf: (b, x) => Math.pow(b, x),
        sample_rate_log2: 1200 * Math.log2(globalThis.sampleRate / 8.176)
      },
    });
    this.instance = instance;
    const { setLPF, BiQuad } = instance.exports;
    this.lpf = setLPF(this.FilterFC, this.FilterQ);
    this.setLPF = setLPF;
    this.processSample = BiQuad;
  }
  onmsg({ data }) {
    console.log(data);
  }
  process([inputs], [outputs], params) {

    if (!inputs.length) return true;
    if (params.FilterQ_Cb[0] <= 0) {
      outputs[0].set(inputs[1]);
      outputs[1].set(inputs[0]);
      return true;
    }
    const filterQ = -1 * Math.pow(10, params.FilterQ_Cb[0] / 200);
    const bandwidth = 1 / filterQ;
    if (params.FilterFC[0] !== this.FilterFC) {
      this.FilterFC = params.FilterFC[0];
      this.lpf = this.setLPF(this.FilterFC, bandwidth);
    }

    const inputChannel = Math.min(inputs.length, outputs.length) - 1;
    for (let j = 0;j < 128;j++) {
      outputs[0][j] = this.processSample(inputs[0][j], this.lpf);
    }
    for (let j = 0;j < 128;j++) {
      outputs[1][j] = this.processSample(inputs[inputChannel][j], this.lpf);
    }



    return true;
  }
}
registerProcessor("lpf-proc", LowPassFilterProc);
