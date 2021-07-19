export async function initlerpcheck() {
  const mem = new WebAssembly.Memory({ initial: 2 });
  return WebAssembly.instantiateStreaming(fetch("lerpcheck.wasm"), {
    env: {
      memory: mem,
    },
  }).then(({ instance }) => {
    const { reset, inputbars } = instance.exports;
    const flmem = new Float64Array(mem.buffer, 0x8000, 0x1000 / 2);
    function inputBarFl(flar) {
      flmem.set(flar);
      console.log(new Float64Array(mem.buffer).filter((v) => v != 0));
      return new Float64Array(mem.buffer, inputbars(flar), 11).join(",");
    }
    return {
      inputBarFl,
      reset,
      mem,
    };
  });
}
