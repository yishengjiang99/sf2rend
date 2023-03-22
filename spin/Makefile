all: spin.wasm.js

clean: src/spin.c
	rm -f build/*

build/spin.ll: clean 
	clang -O3 src/spin.c -o build/spin.ll --target=wasm32 -emit-llvm -c -S 

build/spin.o: build/spin.ll
	llc -march=wasm32 -filetype=obj build/spin.ll -o build/spin.o

spin.wasm: build/spin.o
	wasm-ld -O 4 --features=atomics,mutable-global,bulk-memory --no-check-features --allow-undefined --import-memory --no-entry --export-all -o spin.wasm build/spin.o

spin.wasm.js: spin.wasm
	cat spin.wasm | npx encode-wasm-uint8 > spin.wasm.js
