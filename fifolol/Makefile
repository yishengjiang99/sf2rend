all: yofi.wasm.js

clean: src/yofi.c
	rm -f build/*

build/yofi.ll: clean 
	clang src/yofi.c -o build/yofi.ll --target=wasm32 -emit-llvm -c -S 

build/yofi.o: build/yofi.ll
	llc -march=wasm32 -filetype=obj build/yofi.ll -o build/yofi.o

yofi.wasm: build/yofi.o
	wasm-ld --features=atomics,mutable-global --no-check-features --allow-undefined --import-memory --no-entry --export-all -o yofi.wasm build/yofi.o

yofi.wasm.js: yofi.wasm
	cat yofi.wasm | npx encode-wasm-uint8 > yofi.wasm.js
