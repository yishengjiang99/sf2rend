all: spin.wasm

clean:
	rm -f spin.ll spin.o spin.wasm spin

spin.ll: spin.c clean
	clang spin.c --target=wasm32 -emit-llvm -c -S

spin.o: spin.ll
	llc -march=wasm32 -filetype=obj spin.ll 

spin.wasm: spin.o
	wasm-ld --import-memory --no-entry --export-all -o spin.wasm spin.o

  # --target=wasm32 \ # Target WebAssembly
  # -emit-llvm \ # Emit LLVM IR (instead of host machine code)
  # -c \ # Only compile, no linking just yet
  # -S \ # Emit human-readable assembly rather than binary
  # add.c
