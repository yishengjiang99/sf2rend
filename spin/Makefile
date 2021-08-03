spin:
	emcc spin.c -o spin.emcc.js \
		-s EXPORTED_FUNCTIONS="['_mallocTable', '_initSpinners','_reset', '_spin']"  \
		-s INITIAL_MEMORY=15073280 -s TOTAL_STACK=516kb \
		-pthread \
    -s EXIT_RUNTIME=0 \
    -s EXPORT_ES6=1 \
		-s ENVIRONMENT=worker
