# sf2rend hermetic build.
#
# Run inside the pinned toolchain container:
#     scripts/in-toolchain.sh make <target>
# In CI the build job already runs inside the container, so plain `make`
# works there. Only `test-c` (native C unit tests) is meant for the host.
#
#   wasm                 all five WebAssembly JS modules
#   bundle               webpack production bundle -> dist/
#   site                 assemble the deployable site -> _site/
#   test                 test-c + test-js + smoke
#   test-c               C unit tests, compiled natively with the host gcc
#   test-js              karma (sf2-service) + mocha (fft-64bit, saturation)
#   smoke                serve _site/ under /sf2rend/ and drive it with headless Chromium
#   check-artifacts      fail if any build output is tracked in git
#   check-spin-abi       fail if the rebuilt spin.wasm changed its import/export ABI
#   verify-reproducible  build wasm twice; fail if outputs are not byte-identical
#   clean

ROOT := $(CURDIR)
BUILD := $(ROOT)/build
WASM2JS := node $(ROOT)/tools/wasm2js.mjs
CTEST := $(BUILD)/ctest

# Reproducibility: emcc honors SOURCE_DATE_EPOCH; -ffile-prefix-map below
# keeps absolute paths out of the objects.
export SOURCE_DATE_EPOCH ?= $(shell git log -1 --format=%ct 2>/dev/null || date +%s)
BUILD_ID := $(shell git rev-parse --short HEAD 2>/dev/null || echo $(SOURCE_DATE_EPOCH))

.DELETE_ON_ERROR:

# --- toolchain guard -------------------------------------------------------
# wasm targets need emcc/clang/llc/wasm-ld from the pinned image on PATH.
# A sentinel file records the check so up-to-date outputs are not rebuilt
# just to re-run it; the check re-runs when toolchain.env changes.
TOOLCHAIN_OK := $(BUILD)/.toolchain-ok

$(TOOLCHAIN_OK): toolchain.env
	@command -v emcc >/dev/null 2>&1 || { \
	  echo "error: emcc not on PATH; run via scripts/in-toolchain.sh" >&2; exit 1; }
	@mkdir -p $(BUILD) && touch $@

# --- spin ------------------------------------------------------------------
SPIN_SRCS := spin/src/spin.c
SPIN_HDRS := spin/src/spin.h spin/src/calc.h spin/src/p1200.h spin/src/midi_normalized.h
SPIN_WASM := $(BUILD)/spin/spin.wasm

$(BUILD)/spin $(BUILD)/lpf $(BUILD)/saturation $(BUILD)/fft-64bit $(CTEST):
	mkdir -p $@

# All wasm targets use emcc from the pinned image (the standalone LLVM
# binaries are not shipped in the Docker image).

$(SPIN_WASM): $(SPIN_SRCS) $(SPIN_HDRS) | $(BUILD)/spin $(TOOLCHAIN_OK)
	# NOTE: emcc bundles the LLVM tools; the standalone clang/llc/wasm-ld
	# binaries are not shipped in the Docker image.
	emcc -O2 $(SPIN_SRCS) -o $@ \
	  -s STANDALONE_WASM=1 -s IMPORTED_MEMORY=1 \
	  -s ERROR_ON_UNDEFINED_SYMBOLS=0 \
	  -Wl,--export-all -Wl,--no-entry \
	  -matomics -mmutable-globals \
	  -ffile-prefix-map=$(ROOT)=.

spin/spin.wasm.js: $(SPIN_WASM)
	$(WASM2JS) $< $@

# --- lpf -------------------------------------------------------------------
LPF_SRCS := lpf/biquad.c
LPF_HDRS := lpf/biquad.h

$(BUILD)/lpf/lpf.wasm: $(LPF_SRCS) $(LPF_HDRS) | $(BUILD)/lpf $(TOOLCHAIN_OK)
	emcc -O2 $(LPF_SRCS) -o $@ \
	  -s STANDALONE_WASM=1 -s ERROR_ON_UNDEFINED_SYMBOLS=0 \
	  -Wl,--export-all -Wl,--no-entry \
	  -ffile-prefix-map=$(ROOT)=.

lpf/lpf.wasm.js: $(BUILD)/lpf/lpf.wasm
	$(WASM2JS) $< $@

# --- saturation ------------------------------------------------------------
$(BUILD)/saturation/saturate.wasm: saturation/saturate.c | $(BUILD)/saturation $(TOOLCHAIN_OK)
	emcc -O3 $< -o $@ \
	  -nostartfiles \
	  -s STANDALONE_WASM=1 -s IMPORTED_MEMORY=1 \
	  -Wl,--export-all -Wl,--no-entry \
	  -ffile-prefix-map=$(ROOT)=.

saturation/saturate.wasm.js: $(BUILD)/saturation/saturate.wasm
	$(WASM2JS) $< $@

# --- fft-64bit (emcc) ------------------------------------------------------
FFT_EXPORTS := '["_FFT","_iFFT","_bit_reverse","_malloc"]'

$(BUILD)/fft-64bit/fft.wasm: fft-64bit/src/fft.c | $(BUILD)/fft-64bit $(TOOLCHAIN_OK)
	emcc $< -O3 -nostartfiles -o $@ --no-entry -s EXPORTED_FUNCTIONS=$(FFT_EXPORTS) -ffile-prefix-map=$(ROOT)=.

fft-64bit/build/fft.wasm.js: $(BUILD)/fft-64bit/fft.wasm | fft-64bit/build
	$(WASM2JS) $< $@

fft-64bit/build:
	mkdir -p $@

# --- sf2-service pdta (emcc) -----------------------------------------------
PDTA_SRCS := sf2-service/sf2.c sf2-service/sf2.h sf2-service/lib.js

sf2-service/build/pdta.js: $(PDTA_SRCS) | sf2-service/build $(TOOLCHAIN_OK)
	emcc sf2-service/sf2.c -O3 -o $@ \
	  -s EXPORTED_RUNTIME_METHODS=['ccall','AsciiToString','HEAPU8','HEAPU32'] \
	  -s EXPORTED_FUNCTIONS=['_malloc','_free','_loadpdta','_shdrref','_instRef','_presetRef','_findPreset','_sf2_zones_for'] \
	  -s INITIAL_MEMORY=67108864 \
	  -s ENVIRONMENT=web \
	  --js-library=sf2-service/lib.js \
	  -s MODULARIZE=1 \
	  -s SINGLE_FILE=1 \
	  -s EXIT_RUNTIME=1 \
	  -s EXPORT_ES6=1 \
	  -ffile-prefix-map=$(ROOT)=.

sf2-service/build:
	mkdir -p $@

# --- aggregates ------------------------------------------------------------
WASM_JS := spin/spin.wasm.js \
           lpf/lpf.wasm.js \
           saturation/saturate.wasm.js \
           fft-64bit/build/fft.wasm.js \
           sf2-service/build/pdta.js

.PHONY: wasm
wasm: $(WASM_JS)

node_modules/.package-lock.json: package-lock.json
	npm ci --no-audit --no-fund

.PHONY: bundle
bundle: node_modules/.package-lock.json
	npx --no-install webpack --mode production

.PHONY: site
site: bundle $(WASM_JS)
	node tools/assemble-site.mjs --root $(ROOT) --out $(ROOT)/_site --build-id $(BUILD_ID)
	node tools/check-site-imports.mjs --site $(ROOT)/_site

.PHONY: all
all: wasm bundle

# --- tests -----------------------------------------------------------------
# test-c runs on the host (needs gcc). -Wall -Werror where the suite
# currently passes; see the TODOs for the exceptions.
.PHONY: test test-c test-js smoke

test: test-c test-js smoke

test-c: | $(CTEST)
	@echo "== spin C tests =="
	gcc -Wall -Werror -o $(CTEST)/calc.test spin/src/calc.test.c -lm && $(CTEST)/calc.test
	gcc -Wall -Werror -o $(CTEST)/lfo.test spin/src/LFO.test.c -lm && $(CTEST)/lfo.test
# TODO: -Werror for eg/fp blocked by pre-existing unused-variable warnings in spin.c
	gcc -Wall -o $(CTEST)/eg.test spin/src/eg.test.c -lm && $(CTEST)/eg.test
	gcc -Wall -o $(CTEST)/fp.test spin/src/fp.test.c -lm && $(CTEST)/fp.test
	@echo "== lpf C test =="
	gcc -Wall -Werror -o $(CTEST)/lpf.test lpf/lpf.test.c -lm && $(CTEST)/lpf.test
	@echo "== sf2-service C test =="
	cd sf2-service && gcc -std=c11 -Wall -Wextra -Werror -Dskipthis \
	  -o $(CTEST)/pdta.spec sf2.c pdta.spec.c && $(CTEST)/pdta.spec
# NOTE: spin/src/sf2.test.c and spin/src/spin.test.c tested the duplicate SF2
# parser (spin/src/sf2.c etc.) that was deleted as committed junk; the
# maintained parser lives in sf2-service and is covered by pdta.spec.c and
# the karma suite above.

test-js: $(WASM_JS) node_modules/.package-lock.json
	node tools/test-js.mjs --root $(ROOT)

smoke: site node_modules/.package-lock.json
	node tools/smoke-test.mjs --site $(ROOT)/_site

# --- policy checks ---------------------------------------------------------
# Build outputs are NOT committed (see readme). CI fails if any are tracked.
ARTIFACT_PATHS := dist \
  spin/spin.wasm spin/spin.wasm.js \
  lpf/lpf.wasm.js \
  saturation/saturate.wasm saturation/saturate.wasm.js \
  fft-64bit/build sf2-service/build \
  sflist.js mfilelist.js

.PHONY: check-artifacts
check-artifacts:
	@tracked="$$(git ls-files -- $(ARTIFACT_PATHS))"; \
	if [ -n "$$tracked" ]; then \
	  echo "error: build outputs must not be committed (see readme: artifact policy):"; \
	  echo "$$tracked"; exit 1; \
	fi
	@echo "ok: no build outputs tracked in git"

.PHONY: check-spin-abi
check-spin-abi: spin/spin.wasm.js
	node tools/check-abi.mjs spin/spin.wasm.js tools/spin-abi.json

.PHONY: verify-reproducible
verify-reproducible: $(TOOLCHAIN_OK)
	rm -rf $(BUILD) $(WASM_JS)
	$(MAKE) wasm
	find $(WASM_JS) -type f | sort | xargs sha256sum > /tmp/sf2rend-hashes-1.txt
	rm -rf $(BUILD) $(WASM_JS)
	$(MAKE) wasm
	find $(WASM_JS) -type f | sort | xargs sha256sum > /tmp/sf2rend-hashes-2.txt
	diff /tmp/sf2rend-hashes-1.txt /tmp/sf2rend-hashes-2.txt \
	  && echo "reproducible: wasm outputs byte-identical across rebuilds"

.PHONY: clean
clean:
	rm -rf $(BUILD) _site dist $(WASM_JS) sflist.js mfilelist.js sf2-service/build fft-64bit/build
