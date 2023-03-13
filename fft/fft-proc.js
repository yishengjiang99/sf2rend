import FFT64 from "./FFT64.js";

class FFTProc extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    const { wasmModule } = options.processorOptions;
    this.fft = FFT64(5, wasmModule, new WebAssembly.Instance(wasmModule));
  }
  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    for (let channel = 0; channel < output.length; channel++) {
      if (input[channel]) output[channel].set(input[channel]);
    }
    new Promise(() => {
      if (input[0]) {
        this.fft.inputPCM(input[0]);
        const bins = this.fft.getFloatFrequencyData()[0];
        this.port.postMessage(bins.buffer, [bins.buffer]);
      }
    });
    return true;
  }
}
registerProcessor("proc-fft", FFTProc);
