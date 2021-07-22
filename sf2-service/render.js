import { wasmbin } from "./render.wasm.js";
export function loadre() {
  const mem = new WebAssembly.Memory({ initial: 245, maximum: 245 });
  const mod = new WebAssembly.Module(wasmbin);
  const inst = new WebAssembly.Instance(mod, { env: { memory: mem } });
  const {
    exports: { newVoice, render, loadPCM },
  } = inst;
  return { mem, newVoice, render, loadPCM };
}
export function initVoice(v, mem) {
  const refArr = new Uint32Array(mem.buffer, v, 10);
  const [shref, zref, inputRef, out1, out2] = refArr;
  const rendheap = new Uint8Array(mem.buffer);

  const input = new Float32Array(mem.buffer, inputRef, 0x7fff);
  const output1 = new Float32Array(mem.buffer, out1, 128);
  const output2 = new Float32Array(mem.buffer, out2, 128);
  function setAttr(shdr, zone, pcmRef, midi, vel) {
    rendheap.set(shdr, shref, 48);
    rendheap.set(zone, zref, 120);
    refArr[3] = pcmRef;
    refArr[8] = midi;
    refArr[9] = vel;
  }
  return { setAttr, output1, output2 };
}
