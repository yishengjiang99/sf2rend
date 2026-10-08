# Vendored third-party code

These directories were previously git submodules. They are now plain
directories so a fresh `git clone` (no `--recurse-submodules`) contains
everything needed to build. Import paths are unchanged (`sf2-service/...`,
`fft-64bit/...`).

To update one to a newer upstream commit:

```sh
scripts/update-vendored.sh <path> <sha>
# e.g. scripts/update-vendored.sh sf2-service abc1234
```

then update the table below.

## sf2-service

- **Path:** `sf2-service/`
- **Upstream:** https://github.com/yishengjiang99/sf2-service
- **Commit:** `e30c1d0b9f54abd3378b9f6d66ec4eead1eb3516`
- **Date:** 2026-09-25
- **License:** no LICENSE file upstream; `package.json` declares `"license": "do not use"`
- **Pruned on vendor:** `testing/fixtures/*.sf2` (duplicates of
  `static/VintageDreamsWaves-v2.sf2`; `pdta.spec.c` now points at
  `../static/VintageDreamsWaves-v2.sf2`), `type-check-example.ts`,
  `_codeql_detected_source_root`, `.github/`, nested `.gitignore`,
  `package-lock.json` (deps folded into the root `package.json`).

## fft-64bit

- **Path:** `fft-64bit/`
- **Upstream:** https://github.com/yishengjiang99/fft-64bit/
- **Commit:** `e7d4e3ae71a811bfb4deeb53299ac53626e471bf`
- **Date:** 2026-05-10
- **License:** no LICENSE file upstream; `package.json` declares `"license": "ISC"`
- **Pruned on vendor:** `song.mp3` (demo asset), `index.html` / `test.html`
  (demos), `.gitattributes`, nested `.gitignore`, (no lockfile upstream;
  deps folded into the root `package.json`).
