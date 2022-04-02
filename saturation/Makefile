all: saturate.wasm.js

saturate.wasm: clean
	clangwa --target=wasm32 -O3 -flto -nostdlib -Wl,--no-entry \
	-Wl,--export-all -Wl,--import-memory \
	-o saturate.wasm \
	saturate.c

saturate.wasm.js: saturate.wasm
	cat saturate.wasm|npx encode-wasm-uint8 > saturate.wasm.js

clean:
	rm -f saturate.wasm