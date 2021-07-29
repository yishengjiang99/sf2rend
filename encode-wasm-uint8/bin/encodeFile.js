#!/usr/bin/env node

const ab = new Uint8Array(require("fs").readFileSync(process.argv[2]));
require("fs").writeFileSync(
  require("path").basename(process.argv[2]) + ".js",
  `export const wasmbin=new Uint8Array([${ab.join(",")}])`
);
