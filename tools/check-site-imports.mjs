#!/usr/bin/env node
// Verify that every relative import inside the copied unbundled .js files
// resolves to a file that exists in _site/. dist/** is skipped (webpack
// resolved those at bundle time).
//
// Usage: node tools/check-site-imports.mjs --site <_site dir>
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

function arg(name) {
  const i = process.argv.indexOf(name);
  if (i < 0 || !process.argv[i + 1]) {
    console.error(`missing ${name} <value>`);
    process.exit(1);
  }
  return resolve(process.argv[i + 1]);
}
const site = arg("--site");

function* jsFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "dist") continue;
      yield* jsFiles(p);
    } else if (entry.name.endsWith(".js")) {
      yield p;
    }
  }
}

const importRe = /(?:from\s*["']|import\s*["'])(\.[^"']+?)["']/g;
let failures = 0;
for (const file of jsFiles(site)) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(importRe)) {
    const spec = m[1].split("?")[0].split("#")[0];
    if (spec.includes("://")) continue;
    const target = resolve(dirname(file), spec);
    if (!existsSync(target) || !statSync(target).isFile()) {
      console.error(`missing import: ${file} -> ${m[1]}`);
      failures++;
    }
  }
}
if (failures > 0) {
  console.error(`${failures} import(s) point at missing files`);
  process.exit(1);
}
console.log("all unbundled imports resolve");
