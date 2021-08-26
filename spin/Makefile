all: spin.wasm

clean: src/spin.c
	rm -f build/*

build/spin.ll: clean 
	clang -O3 src/spin.c -o build/spin.ll --target=wasm32 -emit-llvm -c -S 

build/spin.o: build/spin.ll
	llc -march=wasm32 -filetype=obj build/spin.ll -o build/spin.o

spin.wasm: build/spin.o
	wasm-ld -O 4 --features=atomics,mutable-global,bulk-memory --no-check-features --allow-undefined -max-memory=4294967296 --shared-memory --import-memory --no-entry --export-all -o spin.wasm build/spin.o
