'use strict';
const fs = require('fs');
const execSync = require('child_process')
  .execSync;

execSync('npx wa compile -03 -s 120 src/wavetable_oscillator.c -o build/wavetable_oscillator.wasm');
fs.writeFileSync(`build/wavetable_oscillator.js`, `// prettier-ignore
  export const wasmBinary = new Uint8Array([
    ${fs.readFileSync('build/wavetable_oscillator.wasm').join(',')}
  ]);
  `);
