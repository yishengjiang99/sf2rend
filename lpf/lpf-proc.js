import { mkLPF } from "./biquad.js";
let biquad;

class LowPassFilter extends AudioWorkletProcessor {
  constructor(options) {
    super(options);

    const { sampleRate, FilterFc, FilterQ } = options.processorOptions;
    mkLPF({ sampleRate, FilterFc, FilterQ }).then((biq) => {
      biquad = biq;
    });
  }
  process([inputs], [outputs]) {
    if (!biquad) {
      outputs[0].set(inputs[0]);
      return true;
    }
    inputs.forEach((inp, i) => {
      const dest = outputs[i] || outputs[0];
      inp.forEach((inpp, j) => {
        dest[j] = biquad.lpf(inpp);
      });
    });
    return true;
  }
}
registerProcessor("lpf", LowPassFilter);
