const fs = require("fs");
fs.writeFileSync(
	`./rendctx.js`,
	`// prettier-ignore
  export const wasmBinary = new Uint8Array([
    ${fs.readFileSync("./build/ctx.wasm").join(",")}
  ]);
  ${fs.readFileSync("init.js")}`
);
