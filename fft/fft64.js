const sizeof_double = Float64Array.BYTES_PER_ELEMENT;

export default function FFT64(n = 12, module, instance) {
  const N = 1 << n;
  const FFT = instance.exports.FFT;
  const iFFT = instance.exports.iFFT;
  const bit_reverse = instance.exports.bit_reverse;

  const heap = instance.exports.memory.buffer;

  const stblRef = instance.exports.malloc((N / 4) * sizeof_double);
  const stbl = new Float64Array(heap, stblRef, N / 4);
  for (let i = 0; i < N / 4; i++) {
    stbl[i] = Math.sin((2 * Math.PI * i) / N);
  }

  const complexRef = instance.exports.malloc(N * 2 * sizeof_double);
  const complex = new Float64Array(heap, complexRef, 2 * N);

  let wptr = 0,
    rptr = 0;

  function bzeroArray(ref, k) {
    for (let i = 0; i < k; i++) {
      complex[ref + i] = 0;
    }
  }

  const inputPCM = (arr) => {
    bzeroArray(complexRef, N);
    wptr = 0;
    arr.forEach((v) => {
      complex[wptr] = v;
      complex[wptr + 1] = 0;
      wptr += 2;
    });
  };
  function getFloatFrequencyData() {
    FFT(complexRef + rptr, n, stblRef);
    bit_reverse(complexRef + rptr, n);

    return [
      complex.filter((v, idx) => idx % 2 == 0),
      complex.filter((v, idx) => idx % 2 == 1),
    ];
  }
  function getWaveForm() {
    bit_reverse(complexRef, n);
    iFFT(complexRef, n, stblRef);
    return [
      complex.filter((v, idx) => idx % 2 == 1),
      complex.filter((v, idx) => idx % 2 == 0),
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
