import {writeFileSync,readFileSync} from 'fs';
import {execSync} from 'child_process';
execSync(`emcc upsample.c -Os -o upsample.wasm \
-s EXPORTED_FUNCTIONS='["_init","_upsample_wave_table","_setRatio"]' --no-entry`);
writeFileSync(
  "wasbin.js",
  /* javascript */ `
	// @prettier-ignore
export const wasmbin=new Uint8Array([${readFileSync("upsample.wasm").join(
    ","
  )}]);

`
);