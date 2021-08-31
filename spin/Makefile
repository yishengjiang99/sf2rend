all: typescript

typescript: spin.wasm.js
	tsc -t esnext -m esnext spin-proc-2.ts

spin.wasm.js: spin.wasm
	cat build/spin.wasm | npx encode-wasm-uint8 > spin.wasm.js

clean: src/spin.c
	rm -f build/*

build/spin.ll: clean 
	clang -O3 src/spin.c -o build/spin.ll --target=wasm32 -emit-llvm -c -S 

build/spin.o: build/spin.ll
	llc -march=wasm32 -filetype=obj build/spin.ll -o build/spin.o

spin.wasm: build/spin.o
	wasm-ld -O 4 --allow-undefined -max-memory=4294967296 -import-memory --no-entry --export-all -o build/spin.wasm build/spin.o
