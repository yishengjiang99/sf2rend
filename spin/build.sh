docker run \
--rm \
-v $(pwd):/src \
-u $(id -u):$(id -g) \
emscripten/emsdk \
emcc src/sf2r/pdta.spec.c --pre-js pmod.js -o spin.test.html \
-sFORCE_FILESYSTEM \
-s EXPORTED_RUNTIME_METHODS="['FS', 'ccall', 'UTF8ToString', 'lengthBytesUTF8', 'stringToUTF8', 'getValue']" \
-s ALLOW_MEMORY_GROWTH=1 \
-s STACK_SIZE=1048576 \
--preload-file assets
