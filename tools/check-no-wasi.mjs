#!/usr/bin/env node
// Fail if any built wasm module imports from wasi_snapshot_preview1.
// The worklets instantiate with only `env` (or no) imports; a WASI import
// means the build flags are wrong (e.g. emcc injecting WASI).
// Usage: node tools/check-no-wasi.mjs <file.wasm.js>...
import { readFileSync } from "node:fs";

function decodeWasmJs(path) {
  const src = readFileSync(path, "utf8");
  const m = src.match(/new Uint8Array\(\[([\d,]+)\]\)/);
  if (!m) throw new Error(`${path}: no wasmbin Uint8Array found`);
  return Uint8Array.from(m[1].split(",").map(Number));
}

let failed = false;
for (const path of process.argv.slice(2)) {
  const mod = new WebAssembly.Module(decodeWasmJs(path));
  const wasi = WebAssembly.Module.imports(mod).filter((i) => i.module === "wasi_snapshot_preview1");
  if (wasi.length > 0) {
    console.error(`${path}: unexpected WASI imports: ${wasi.map((i) => i.name).join(", ")}`);
    failed = true;
  } else {
    console.log(`${path}: no WASI imports`);
  }
}
process.exit(failed ? 1 : 0);
