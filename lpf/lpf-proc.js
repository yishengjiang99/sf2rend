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
        maxValue: 48000,
        automationRate: "k-rate",
      },
    ];
  }

  constructor(options) {
    super(options);

    const {
      processorOptions: { frequency, wasmbin, Q },
    } = options;
    this.cutoffFc = frequency;
    this.Q = Q;
    const instance = new WebAssembly.Instance(new WebAssembly.Module(wasmbin), {
      env: {
        sinf: (x) => Math.sin(x),
        cosf: (x) => Math.cos(x),
        sinhf: (x) => Math.sinh(x),
      },
    });
    this.instance = instance;
    const { setLPF, BiQuad } = instance.exports;
    this.lpf = setLPF(this.cutoffFc, 0.85);
    this.setLPF = setLPF;
    this.processSample = BiQuad;
  }
  onmsg({ data }) {
    console.log(data);
  }
  process([inputs], [outputs], params) {

    if (!inputs.length) return true;
    this.setLPF(params.FilterFC[0]);

    if (this.cutoffFc >= 13500) {
      outputs[0].set(inputs[1]);
      outputs[1].set(inputs[1]);
      return true;
    }
    debugger;
    const inputChan = Math.min(inputs.length, outputs.length) - 1;
    for (let j = 0;j < 128;j++) {
      outputs[0][j] = this.processSample(inputs[0][j], this.lpf);
    }
    for (let j = 0;j < 128;j++) {
      outputs[1][j] = this.processSample(inputs[inputChan][j], this.lpf);
    }



    return true;
  }
}
registerProcessor("lpf-proc", LowPassFilterProc);
