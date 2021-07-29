#!/usr/bin/env node

const buff = [];
process.stdin.on("data", (d) => {
  buff.push(d);
});

process.stdin.on("end", () => {
  const bytes = new Uint8Array(Buffer.concat(buff));
  process.stdout.write(`// @ts-ignore \n`);
  process.stdout.write(`// @prettier-ignore \n`);
  process.stdout.end(
    `export const wasmbin=new Uint8Array([${bytes.join(",")}]);\n`
  );
});
