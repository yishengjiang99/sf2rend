#!/usr/bin/env node
// Encode a .wasm binary as an ES module exporting `wasmbin`.
//
// Replaces `npx encode-wasm-uint8` (which fetched from the npm registry;
// the vendored encode-wasm-uint8/ package's bin was named `encode`, so npx
// never even used it) and the ad-hoc `node -e` encoders. Output is
// byte-identical for identical input across all modules:
//
//   // @ts-ignore␣\n
//   // @prettier-ignore␣\n
//   export const wasmbin=new Uint8Array([...]);\n
//
// Usage: node tools/wasm2js.mjs <in.wasm> <out.js>
import { readFileSync, writeFileSync } from "node:fs";

const [inPath, outPath] = process.argv.slice(2);
if (!inPath || !outPath) {
  console.error("usage: wasm2js.mjs <in.wasm> <out.js>");
  process.exit(1);
}

const bytes = readFileSync(inPath);
const body =
  "// @ts-ignore \n" +
  "// @prettier-ignore \n" +
  `export const wasmbin=new Uint8Array([${Array.from(bytes).join(",")}]);\n`;
writeFileSync(outPath, body);
