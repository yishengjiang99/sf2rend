import { wasmbin } from "./build/fft.wasm.js";

function buildProcessorSource(name) {
  return `
class FFTProc extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    const { wasmModule } = options.processorOptions;
    this.fft = this.FFT64(7, new WebAssembly.Instance(wasmModule));
  }

  FFT64(n, instance) {
    const sizeofDouble = Float64Array.BYTES_PER_ELEMENT;
    const N = 1 << n;
    const FFT = instance.exports.FFT;
    const iFFT = instance.exports.iFFT;
    const bitReverse = instance.exports.bit_reverse;
    const heap = instance.exports.memory.buffer;
    const stblRef = instance.exports.malloc((N / 4) * sizeofDouble);
    const stbl = new Float64Array(heap, stblRef, N / 4);

    for (let i = 0; i < N / 4; i++) {
      stbl[i] = Math.sin((2 * Math.PI * i) / N);
    }

    const complexRef = instance.exports.malloc(N * 2 * sizeofDouble);
    const complex = new Float64Array(heap, complexRef, 2 * N);

    function clearComplex() {
      complex.fill(0);
    }

    function inputPCM(samples) {
      clearComplex();
      const limit = Math.min(samples.length, N);
      for (let i = 0; i < limit; i++) {
        complex[i * 2] = samples[i];
      }
    }

    function getFloatFrequencyData() {
      FFT(complexRef, n, stblRef);
      bitReverse(complexRef, n);
      return complex.filter((value, index) => index < N && index % 2 === 1);
    }

    function getWaveForm() {
      bitReverse(complexRef, n);
      iFFT(complexRef, n, stblRef);
      return complex.filter((value, index) => index < 2 * N && index % 2 === 0);
    }

    return {
      getFloatFrequencyData,
      getWaveForm,
      inputPCM,
    };
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    for (let channel = 0; channel < output.length; channel++) {
      if (input[channel]) {
        output[channel].set(input[channel]);
      }
    }

    if (input[0]) {
      this.fft.inputPCM(input[0]);
      const bins = this.fft.getFloatFrequencyData();
      const waveForm = this.fft.getWaveForm();
      this.port.postMessage(
        {
          bins: bins.buffer,
          waveForm: waveForm.buffer,
        },
        [waveForm.buffer, bins.buffer]
      );
    }

    return true;
  }
}

registerProcessor(${JSON.stringify(name)}, FFTProc);
//# sourceURL=fft-worklet.js
`;
}

export default class FFTNode extends AudioWorkletNode {
  static wasmModule = null;

  static async init(ctx) {
    if (!FFTNode.wasmModule) {
      FFTNode.wasmModule = await WebAssembly.compile(wasmbin);
    }

    const procUrl = URL.createObjectURL(
      new Blob([buildProcessorSource("proc-fft")], {
        type: "text/javascript",
      })
    );

    try {
      await ctx.audioWorklet.addModule(procUrl, { credentials: "omit" });
    } finally {
      URL.revokeObjectURL(procUrl);
    }
  }

  constructor(ctx, outputChannelCount = [2]) {
    super(ctx, "proc-fft", {
      numberOfInputs: outputChannelCount.length,
      numberOfOutputs: outputChannelCount.length,
      outputChannelCount,
      processorOptions: {
        wasmModule: FFTNode.wasmModule,
      },
    });

    this.waveFormBuffer = null;
    this.fftBuffer = null;
    this.port.onmessage = ({ data: { bins, waveForm } }) => {
      this.waveFormBuffer = waveForm;
      this.fftBuffer = bins;
    };
  }

  getByteTimeDomainData() {
    return this.getWaveForm();
  }

  getWaveForm() {
    return this.waveFormBuffer
      ? new Float64Array(this.waveFormBuffer)
      : new Float64Array(0);
  }

  getFloatFrequencyData() {
    return this.fftBuffer ? new Float64Array(this.fftBuffer) : new Float64Array(0);
  }
}
