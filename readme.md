"Wake up in the AM and compose a beat" -- Dr. Dre

# sf2rend

A React-based SoundFont workstation for MIDI playback, editing, and live analysis.

## Quick start

You need [Docker](https://docs.docker.com/get-docker/) and [Node.js](https://nodejs.org/)
(v24.19.0, see `.nvmrc`). No `--recurse-submodules`: everything is vendored.

```sh
git clone https://github.com/yishengjiang99/sf2rend
cd sf2rend
scripts/in-toolchain.sh make wasm   # build all five WebAssembly modules in the pinned container
npm ci                              # one lockfile, one install
npm run build                       # make wasm (cached) + webpack bundle -> dist/
npm start                           # assemble _site/ and serve it at http://localhost:8080
```

`npm test` runs the full suite: native C unit tests, the karma + mocha JS
suites, and a headless-Chromium smoke test of the assembled site.

## Artifact policy

**Build outputs are not committed.** `dist/`, the `*.wasm.js` modules,
`fft-64bit/build/`, `sf2-service/build/`, and the generated `sflist.js` /
`mfilelist.js` are gitignored. CI builds them on every push/PR (`make wasm
bundle`), and `make check-artifacts` fails if any of them ever get tracked.
Local dev runs `make` once after cloning.

## Build

One pinned toolchain builds every WebAssembly module: see `toolchain.env`
(`emscripten/emsdk:6.0.10` pinned by digest; ships emcc, clang/llc/wasm-ld
and node). `scripts/in-toolchain.sh make <target>` runs a target in that
container; in CI the job already runs inside the container, so plain `make`
works there.

| Target | What it does |
|---|---|
| `make wasm` | all five `.wasm.js` / `pdta.js` modules |
| `make bundle` | webpack production bundle -> `dist/` |
| `make site` | assemble the deployable site -> `_site/` (verifies every unbundled import resolves) |
| `make test` | C tests + JS tests + smoke test |
| `make check-spin-abi` | fail if the rebuilt `spin.wasm` changed its import/export ABI |
| `make verify-reproducible` | build wasm twice; fail if not byte-identical |
| `make clean` | remove everything `make` generated |

Runtime module graph (what the browser loads):

- `index.html` -> `dist/main.js` (webpack bundle of `src/index.js`) and
  `dist/timer.js` (web worker)
- `spin/spin-proc.js`, loaded unbundled via `audioWorklet.addModule`, imports
  `./spin.wasm.js`, `./spin-structs.js`, `../src/midilist.js`,
  `../saturation/index.js`
- `lpf/lpf-proc.js`, loaded unbundled; its `wasmbin` arrives via
  `processorOptions` from the bundle
- `fft-64bit/fft-node.js` (bundled) builds its worklet from a Blob URL;
  wasm comes from `fft-64bit/build/fft.wasm.js`
- `sf2-service/index.js` (bundled) wraps `sf2-service/build/pdta.js`
  (emscripten `SINGLE_FILE=1`)
- `static/*.sf2`, `static/midi/*.mid` fetched with Range requests

## Deploy

Pushes to `main` build, test, and deploy to GitHub Pages via
`.github/workflows/build-deploy.yml`. PRs build + test and upload the
assembled site as a preview artifact, but never deploy.

One manual repo setting is required: Settings -> Pages -> Source =
**GitHub Actions**.

## Vendored code

`sf2-service/` and `fft-64bit/` were git submodules; they are now vendored
plain directories. See `third_party/VENDORED.md` for upstream URLs, pinned
commits, and the update procedure.
