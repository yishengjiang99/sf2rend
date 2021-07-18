
all:
	npx wa compile -03 -s 120 src/wavetable_oscillator.c -o build/wavetable_oscillator.wasm

check:
	chrome-cli open https://dsp.grepawk.com/aum/test.html
	
clean:
	@rm -f build/*
