rm spin2.wasm;
docker run --rm -v $(pwd):/src -u $(id -u):$(id -g) emscripten/emsdk \
emcc src/spin2.c -Oz -o spin2.wasm \
-s EXPORTED_FUNCTIONS=['_malloc','_free','_trigger_attack','_trigger_release','_new_zone','_pcmRef','_new_pcm','_sp_run','_outputs','_ob_clear','_calc_pitch_ratio','_set_midi_cc_val','_gm_reset'] \
-s INITIAL_MEMORY=1024mb              \
-Wl,--allow-undefined \
-sERROR_ON_UNDEFINED_SYMBOLS=0 \
--no-entry;

cat spin2.wasm |npx encode-wasm-uint8 > spin2.wasm.js