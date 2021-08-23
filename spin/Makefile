all: spin.wasm

clean: src/spin.c
	rm -f spin.ll spin.o spin.wasm spin

spin.ll: clean 
	clang -O3 src/spin.c --target=wasm32 -emit-llvm -c -S

spin.o: spin.ll
	llc -march=wasm32 -filetype=obj spin.ll 

spin.wasm: spin.o
	wasm-ld -O 4 --allow-undefined --import-memory --no-entry --export-all -o spin.wasm spin.o
