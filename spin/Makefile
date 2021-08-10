spin: spin.c
	emcc spin.c -o spin.wasm --no-entry -s STANDALONE_WASM \
		-s EXPORTED_FUNCTIONS="['_newSpinner','_reset', '_spin']"  