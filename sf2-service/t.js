import { wasmbin } from "./t.wasm.js";
const fetchWait = fetch("file.sf2").then((res) => res.arrayBuffer());
async function go() {
  const mod = await WebAssembly.compile(wasmbin);
  const inst = await WebAssembly.instantiate(mod, { env: {} });
  const sff = await fetchWait;
  inst.exports._initialize();
  const sffref = inst.exports.maloloc(sff.byteLength);
  const heap = inst.exports.memory.buffer;
  const activeZones = new Uint32Array(heap, inst.exports.activeZones.value, 60);
  new Uint8Array(heap, sffref, sff.byteLength).set(new Uint8Array(sff));
  inst.exports.loadsf2(sffref, sff.byteLength);
  console.log(new Uint32Array(heap, inst.exports.tunes.value, 128 * 3));
  inst.exports.getZone(0, 0, 66, 88);

  console.log(new Int16Array(heap, activeZones[0], 60));
}

go();
