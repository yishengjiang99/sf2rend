was1:
	emcc pdta.c -Oz -o pdta.js \
	-s EXTRA_EXPORTED_RUNTIME_METHODS=['ccall','AsciiToString'] \
    -s EXPORTED_FUNCTIONS=['_filterForZone','_malloc','_free','_loadpdta','_findByPid','_shdrref','_presetRef'] \
    -s INITIAL_MEMORY=64mb              \
    -s USE_ES6_IMPORT_META=0 \
    -s ENVIRONMENT=web \
    --js-library=lib.js \
    -s MODULARIZE=1 \
    -s SINGLE_FILE=1 \
    -s EXIT_RUNTIME=1 \
    -s EXPORT_ES6=1 


clean:
	rm *wasm pdta.js pdta.wasm

check:
	npx serve . -l 1234 > /dev/null 2>&1 && chrome-cli open 'http://localhost:1234'
