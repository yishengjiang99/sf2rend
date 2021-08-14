spin: spin.c
	emcc spin.c -o spin.wasm --no-entry -s STANDALONE_WASM \
		-s EXPORTED_FUNCTIONS="['_alloc_ftb', '_newSpinner','_reset', '_spin']"  \
		-s INITIAL_MEMORY=192kb -s TOTAL_STACK=32kb