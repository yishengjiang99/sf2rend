#!/usr/bin/env node
// Fail if a rebuilt spin.wasm.js changed its import/export ABI.
// Usage: node tools/check-abi.mjs <built.wasm.js> <tools/spin-abi.json>
import { readFileSync } from "node:fs";

const [builtPath, abiPath] = process.argv.slice(2);
if (!builtPath || !abiPath) {
  console.error("usage: check-abi.mjs <built.wasm.js> <abi.json>");
  process.exit(1);
}

function decodeWasmJs(path) {
  const src = readFileSync(path, "utf8");
  const m = src.match(/new Uint8Array\(\[([\d,]+)\]\)/);
  if (!m) throw new Error(`${path}: no wasmbin Uint8Array found`);
  return Uint8Array.from(m[1].split(",").map(Number));
}

const expected = JSON.parse(readFileSync(abiPath, "utf8"));
const mod = new WebAssembly.Module(decodeWasmJs(builtPath));
const actual = {
  imports: WebAssembly.Module.imports(mod).map((i) => ({
    module: i.module,
    name: i.name,
    kind: i.kind,
  })),
  exports: WebAssembly.Module.exports(mod).map((e) => ({
    name: e.name,
    kind: e.kind,
  })),
};

const want = JSON.stringify({ imports: expected.imports, exports: expected.exports });
const got = JSON.stringify(actual);
if (want !== got) {
  console.error("spin.wasm ABI changed!");
  const wantSet = new Set(
    expected.imports.map((i) => `import ${i.module}.${i.name}`),
  );
  const gotSet = new Set(
    actual.imports.map((i) => `import ${i.module}.${i.name}`),
  );
  for (const x of wantSet) if (!gotSet.has(x)) console.error(`  - missing ${x}`);
  for (const x of gotSet) if (!wantSet.has(x)) console.error(`  + new ${x}`);
  const wantExp = new Set(expected.exports.map((e) => `export ${e.name}:${e.kind}`));
  const gotExp = new Set(actual.exports.map((e) => `export ${e.name}:${e.kind}`));
  for (const x of wantExp) if (!gotExp.has(x)) console.error(`  - missing ${x}`);
  for (const x of gotExp) if (!wantExp.has(x)) console.error(`  + new ${x}`);
  process.exit(1);
}
console.log(
  `spin.wasm ABI unchanged (${actual.imports.length} imports, ${actual.exports.length} exports)`,
);
