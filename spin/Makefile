spin: spin.c
	emcc spin.c -o spin.wasm --no-entry -Os -s STANDALONE_WASM \
		-s EXPORTED_FUNCTIONS="['_malloc','_set_float_attrs','_set_attrs','_newSpinner','_reset', '_spin']"  \
		-s INITIAL_MEMORY=20316160 -s TOTAL_STACK=2031616