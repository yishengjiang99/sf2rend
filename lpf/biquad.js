import { wasmbin } from "./biquad.wasm.js";
let mod;
export async function mkLPF({ sampleRate, FilterFC, FilterQ }) {
  if (!mod) mod = await WebAssembly.compile(wasmbin);
  const instance = new WebAssembly.Instance(mod, {
    env: {
      cos: Math.cos,
      sin: Math.sin,
      tanh: Math.tanh,
      sinh: Math.sinh,
      pow: Math.pow,
      sqrt: Math.sqrt,
    },
  });
  const tref = instance.exports.mkk();
  //  const mem = new WebAssembly.Memory({ initial: 1, maximum: 1 });

  const dbgain = FilterQ / 10;
  const fc = Math.pow(2, (FilterFC - 6900) / 1200) * 440;
  const BW = 1.0;
  const sr = sampleRate;
  const params = new Float64Array([dbgain, fc, sr, BW]);

  const LPF = 0;
  instance.exports.BiQuad_new(
    tref,
    LPF,
    params[0],
    params[1],
    params[2],
    params[3]
  ); // fc, sr, BW);

  return {
    get ref() {
      return tref;
    },
    get biquad() {
      const [a0, a1, a2, a3, a4, x1, x2, y1, y2] = new Float64Array(
        instance.exports.memory.buffer,
        tref,
        9
      );
      return { a0, a1, a2, a3, a4, x1, x2, y1, y2 };
    },
    lpf(input) {
      return instance.exports.BiQuad(input, tref);
    },
  };
}
