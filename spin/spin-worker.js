import Module from "./spin.emcc.js";
async function init() {
  const module = await Module();
  await module.ready;
  const buf = module.HEAPU8.buffer;

  const structSize = 8 * Uint32Array.BYTES_PER_ELEMENT;
  const ref0 = module._initSpinners();
  function loadPCMs(pcmSets) {
    const refs = [];
    for (const pcm of pcmSets) {
      const ref = module._mallocTable(pcm.length);
      new Float32Array(buf, ref, pcm.length).set(pcm);
      refs.push(ref);
    }
    return refs;
  }
  const spinners = [];
  for (let i = 0; i < 16; i++) {
    const ref = ref0 + structSize;
    const struct = buf.slice(ref, ref + 32);
    const structarr = new Uint32Array(struct);
    const uiInput = buf.slice(structarr[2], structarr[2] + 128 * 4 * 2);
    const output = buf.slice(structarr[1], structarr[1] + 128 * 4);

    spinners.push({
      ref,
      struct,
      uiInput,
      output,
      spin: () => {
        module._spin(ref);
      },
    });
  }
  return {
    spinners,
    loadPCMs,
    renderNotify: new Int32Array(buf, module._mallocTable(4), 4),
  };
}
const pcmTable = {};
init().then(({ loadPCM, spinners, renderNotify, buf }) => {
  Atomics.store(renderNotify, 0, 0);
  Atomics.store(renderNotify, 1, 3);
  onmessage = ({ pcm, id }) => {
    pcmTable[id] = loadPCM(pcm);
  };
  postMessage({
    spinners: spinners.map((sp) => {
      const { output, struct, uiInput } = sp;
      return { output, struct, uiInput };
    }),
    renderNotify,
  });
  while (Atomics.wait(renderNotify, 0, 0) === "ok") {
    spinners.forEach((sp) => sp.spin());
    Atomics.store(renderNotify, 0, 0);
  }
});
