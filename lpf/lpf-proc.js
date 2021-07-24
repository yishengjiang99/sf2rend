import { mkLPF } from "./biquad.js";

class LowPassFilter extends AudioWorkletProcessor {
  constructor(options) {
    super(options);

    const { sampleRate, FilterFC, FilterQ } = options.processorOptions;
    this.biquad = mkLPF({ sampleRate, FilterFC, FilterQ });
  }
  process([inputs], [outputs]) {
    inputs.forEach((inp, i) => {
      const dest = outputs[i] || outputs[0];
      inp.forEach((inpp, j) => {
        dest[j] = this.biquad.lpf(inpp);
      });
    });
    return true;
  }
}
registerProcessor("lpf", LowPassFilter);
