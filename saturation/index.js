import { wasmbin } from "./saturate.wasm.js";
const module = new WebAssembly.Module(wasmbin);
console.log(wasmbin);
const instance = new WebAssembly.Instance(module);

export default instance.exports.saturate;
