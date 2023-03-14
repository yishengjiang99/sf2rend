all: spin.wasm.js

spin.wasm.js: build
	cat build/spin.wasm | npx encode-wasm-uint8 > spin.wasm.js

clean: src/spin.c
	rm -f build/*

build: clean
	clang --target=wasm32 -nostdlib --export-all -o build/spin.wasm src/spin.c