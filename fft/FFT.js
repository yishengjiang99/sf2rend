const sizeof_double = Float64Array.BYTES_PER_ELEMENT;

export async function fftmod(n = 12) {
  const N = 1 << n;
  const { instance, module } = await WebAssembly.instantiate(
    await (
      await fetch(document.location.pathname + "/../fft.wasm")
    ).arrayBuffer()
  );
  const FFT = instance.exports.FFT;
  const iFFT = instance.exports.iFFT;
  const bit_reverse = instance.exports.bit_reverse;

  const heap = instance.exports.memory.buffer;

  const stblRef = instance.exports.malloc((N / 4) * sizeof_double);
  const stbl = new Float64Array(heap, stblRef, N / 4);
  for (let i = 0; i < N / 4; i++) {
    stbl[i] = Math.sin((2 * Math.PI * i) / N);
  }

  const complexRef = instance.exports.malloc(N * 10 * sizeof_double);
  const complex = new Float64Array(heap, complexRef, N * 10);

  const outputRef = complexRef + 8 * N * sizeof_double;
  const outputArray = new Float64Array(heap, outputRef, N * 2);

  let wptr = 0,
    rptr = 0;

  function bzeroArray(ref, k) {
    for (let i = 0; i < k; i++) {
      complex[ref + i] = 0;
    }
  }

  const inputPCM = (arr) => {
    wptr = 0;
    arr.forEach((v) => {
      complex[wptr] = v;
      complex[wptr + 1] = 0;
      wptr += 2;
      // if (wptr >= rptr + 2 * N) {
      //   // bzeroArray(rptr, 2 * N);
      //   rptr += 2 * N;
      //   if (rptr >= 10 * N) rptr = 0;
      // }
      // if (wptr >= 10 * N) {
      //   wptr = 0;
      // }
    });
  };
  function getFloatFrequencyData() {
    FFT(complexRef + rptr, n, stblRef);
    bit_reverse(complexRef + rptr, n);
    complex.copyWithin(8 * N, rptr, rptr + 2 * N); //,complexRef+8*N*sizeof_double)
    bit_reverse(complexRef + rptr, n);

    return [
      outputArray.filter((v, idx) => idx % 2 == 0),
      outputArray.filter((v, idx) => idx % 2 == 1),
    ];
  }
  function getWaveForm() {
    iFFT(complexRef + rptr, n, stblRef);
    complex.copyWithin(8 * N, rptr, rptr + 2 * N);
    return [
      outputArray.filter((v, idx) => idx % 2 == 1),
      outputArray.filter((v, idx) => idx % 2 == 0),
    ];
  }
  function reset() {
    wptr = 0;
    rptr = 0;
    bzeroArray(complexRef, 10 * N);
  }
  return {
    stbl,
    reset,
    stblRef,
    complexRef,
    getFloatFrequencyData,
    inputPCM,
    FFT,
    iFFT,
    bit_reverse,
    getWaveForm,
    instance,
    module,
    complex,
    heap,
    wptr,
  };
}
