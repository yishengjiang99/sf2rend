build:
	clang \
  	--target=wasm32 \
  	-nostdlib \
  	-Wl,--no-entry \
  	-Wl,--export-all lpf.c -o - |npx encode-wasm-uint8 > lpf.wasm.js
