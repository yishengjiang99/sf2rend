build:
	clang \
  	--target=wasm32 \
  	-nostdlib \
		-g \
  	-Wl,--no-entry \
		-Wl,--allow-undefined \
  	-Wl,--export-all biquad.c -o - |npx encode-wasm-uint8 > lpf.wasm.js
