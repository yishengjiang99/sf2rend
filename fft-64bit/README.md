# fft-64bit

64-bit FFT for Web Audio backed by WebAssembly.

The C FFT source is in `src/fft.c` (originally by rbj@audioimagination.com), compiled to wasm, and consumed by `fft-node.js`.

## Requirements

- Node.js (for tests and wasm-to-js conversion)
- Docker (used to run `emcc` via `emscripten/emsdk`)

## Install

```bash
npm install
```

## Build

Build wasm + JS wrapper into `/Users/yishengj/fft-64bit/build`:

```bash
npm run build
```

Or run granular targets:

```bash
npm run build:wasm   # build/fft.wasm
npm run build:b64    # build/fftwasm_64.all
```

Generated outputs:

- `build/fft.wasm`
- `build/fft.wasm.js`
- `build/fftwasm_64.all` (optional b64 target)

## Test

```bash
npm test
```

## Clean

```bash
npm run clean
```
