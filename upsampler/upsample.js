import { wasmbin } from "./wasbin.js";
export function upsampler() {
  const module = new WebAssembly.Module(wasmbin);
  const instance = new WebAssembly.Instance(module, {
    env: {
      powf: Math.pow,
    },
  });
  const heap = new Uint8Array(instance.exports.memory.buffer);

  function* upsample(input, pitch, sampleRate, outpf) {
    input = input.slice(0, 9000);
    const output = 0x1000;
    const sampleRef = 0x4000;
    const ref = instance.exports.init(output, sampleRef, input.byteLength);
    heap.set(new Uint8Array(input.buffer), sampleRef);
    instance.exports.setRatio(
      ref,
      sampleRate,
      Math.pow(2, (pitch - 69) / 12) * 440.0
    );

    while (instance.exports.upsample_wave_table(ref) != 1) {
      outpf.set(new Float32Array(heap.buffer, output, 4096));
      yield;
    }
    outpf.set(new Float32Array(heap.buffer, output, 4096));
    return;
  }
  return {
    heap,
    upsample,
  };
}
