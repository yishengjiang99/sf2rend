fft:
	emcc fft.c -o fft.wasm --no-entry -s EXPORTED_FUNCTIONS='["_FFT","_iFFT","_bit_reverse","_malloc"]'

b64:
	cat fft.wasm |base64 > fftwasm_64.txt