import { wasmbin } from "./fft.wasm.js";
import FFT64 from "./FFT64.js";

export async function fftmod(n = 12) {
  const module = await WebAssembly.compile(wasmbin);
  const instance = await WebAssembly.instantiate(module);
  return FFT64(n, module, instance);
}
