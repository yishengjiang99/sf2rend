rm spin2.wasm;
docker run --rm -v $(pwd):/src -u $(id -u):$(id -g) emscripten/emsdk \
emcc src/spin2.c -Oz -o spin2.wasm \
-s EXPORTED_FUNCTIONS=['_malloc','_free','_trigger_attack','_trigger_release','_new_zone','_pcmRef','_new_pcm','_sp_run_all','_outputs','_queue_count'] \
-s EXPORTED_RUNTIME_METHODS='["cwrap", "getValue", "setValue"]' \
-s INITIAL_MEMORY=1024mb              \
--no-entry;

cat spin2.wasm |npx encode-wasm-uint8 > spin2.wasm.js