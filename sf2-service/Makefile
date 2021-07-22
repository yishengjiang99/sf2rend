all: render was1

render:
	emcc render.c -o render.wasm -Os  --no-entry \
    -s EXPORTED_FUNCTIONS=['_newVoice','_render','_loadPCM'] \
    && node encode.js render.wasm         

was1:
	emcc pdta.c -o pdta.js \
	-s EXTRA_EXPORTED_RUNTIME_METHODS=['ccall','AsciiToString'] \
    -s EXPORTED_FUNCTIONS=['_filterForZone','_malloc','_free','_loadpdta','_findByPid','_shdrref','_presetRef'] \
    -s INITIAL_MEMORY=164mb              \
    -s USE_ES6_IMPORT_META=0 \
    -s ENVIRONMENT=web \
    --js-library=lib.js \
    -s MODULARIZE=1 \
    -s SINGLE_FILE=1 \
    -s EXIT_RUNTIME=0 \
    -s EXPORT_ES6=1 \
    -s EXIT_RUNTIME=0

clean:
	rm *wasm pdta.js pdta.wasm

check:
	npx serve -l 1234 . && chrome-cli open 'http://localhost1234/test.html'
