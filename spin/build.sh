docker run \
--rm \
-v $(pwd):/src \
-u $(id -u):$(id -g) \
emscripten/emsdk \
emcc src/spin.c -Oz -o spin.wasm \
-s EXPORTED_FUNCTIONS=['_spin','_midi_cc_vals','_pcms','_get_available_spinner','_set_available','_gm_reset','_newSpinner','_spRef','_pcmRef','_spOutput','_trigger_attack'] \
--no-entry \
-s INITIAL_MEMORY=1024mb              \
-s ENVIRONMENT=web \
-s EXPORT_ES6=1 \
-s MODULARIZE=1 \
-s SINGLE_FILE=1 \
-s EXPORT_ES6=1;

cat spin.wasm |npx encode-wasm-uint8 > spin.wasm.js