import Module from "./spin.wasm.js";
export async function init() {
  const module = await Module();
  await module.ready;
  const buf = module.HEAPU8.buffer;

  const structSize = 8 * Uint32Array.BYTES_PER_ELEMENT;
  const ref0 = module._initSpinners();
  const spinners = [];
  for (let i = 0; i < 16; i++) {
    const ref = ref0 + structSize;
    const struct = new Uint32Array(buf, ref, 8);
    const uiInput = new Float32Array(buf, struct[4], 256);
    const output = new Float32Array(buf, struct[3], 128);
    const pcmInput = new Float32Array(buf, struct[0], 5096);
    function loadPCMs(pcmSets) {
      const refs = [];
      for (const pcm of pcmSets) {
        const ref = module._mallocTable(pcm.length);
        new Float32Array(buf, ref, pcm.length).set(pcm);
        refs.push(ref);
      }
      return refs;
    }
    spinners.push({
      ref,
      struct,
      uiInput,
      output,
      loadPCMs,
      pcmInput,
      get pcmHeader() {
        return struct.slice(0, 2);
      },
      set pcmHeader({ loopStart, loopEnd, pcmRef }) {
        struct[0] = pcmRef;
        struct[1] = loopStart;
        struct[2] = loopEnd;
        console.log(struct);
      },
      spin: () => {
        module._spin(ref);
        console.log(struct);
      },
    });
  }
  return spinners;
}
