spin:
	emcc spin.c -Os -o spin.wasm.js \
		-s EXPORTED_FUNCTIONS="['_mallocTable', '_initSpinners','_reset', '_spin']"  \
		-s INITIAL_MEMORY=15073280 -s TOTAL_STACK=516kb -Os -pthread \
		-s SINGLE_FILE=1 \
    -s EXIT_RUNTIME=0 \
    -s EXPORT_ES6=1 \
		-s ENVIRONMENT=worker
