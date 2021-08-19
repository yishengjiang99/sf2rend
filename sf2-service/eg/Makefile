all: eg.wasm

clean:
	rm -f eg.ll eg.o eg.wasm

eg.ll: eg.c clean
	clang eg.c --target=wasm32 -emit-llvm -c -S

eg.wasm: eg.o
	wasm-ld --import-memory --no-entry --export-all -o eg.wasm eg.ll

  # --target=wasm32 \ # Target WebAssembly
  # -emit-llvm \ # Emit LLVM IR (instead of host machine code)
  # -c \ # Only compile, no linking just yet
  # -S \ # Emit human-readable assembly rather than binary
  # add.c
