was1: 
	emcc pdta.c -o pdta.js \
	-s EXTRA_EXPORTED_RUNTIME_METHODS=['ccall'] \
    -s EXPORTED_FUNCTIONS=['_filterForZone','_malloc','_free','_loadpdta','_findByPid','_shdrref','_presetRef'] \
    -s INITIAL_MEMORY=164mb              \
    -s USE_ES6_IMPORT_META=0 \
    -s ENVIRONMENT=web \
    -s MODULARIZE=1 \
    -s EXIT_RUNTIME=0 \
    -s EXPORT_ES6=1 \
    -O3 \
    -s EXIT_RUNTIME=0 \

clean:
	rm *wasm pdta.js pdta.wasm

check:
	npx serve -l 1234 . && chrome-cli open 'http://localhost1234/test.html'
