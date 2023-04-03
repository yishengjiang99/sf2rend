import { wasmbin } from "./saturate.wasm.js";
const module = new WebAssembly.Module(wasmbin);
const instance = new WebAssembly.Instance(module, {
  env: {
    memory: new WebAssembly.Memory({ initial: 4, maximum: 11 }),
  },
});

export default instance.exports.saturate;
