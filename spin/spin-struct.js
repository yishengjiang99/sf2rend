export function spRef2json(heap, ref) {
  const [inputRef, outputRef] = new Uint32Array(heap, ref, 2);
  const [fract] = new Float32Array(heap, ref + 8, 1);
  const [position, loopStart, loopEnd] = new Uint32Array(heap, ref + 8 + 4, 3);
  const [stride, strideInc] = new Float32Array(heap, ref + 8 + 4 + 12, 2);
  const [lpfref, zoneref, egVolRef, egModRef] = new Uint32Array(
    heap,
    ref + 8 + 4 + 12 + 8,
    4
  );

  return {
    inputRef,
    outputRef,
    fract,
    position,
    loopStart,
    loopEnd,
    stride,
    strideInc,
    lpfref,
    zoneref,
    zone: new Int16Array(heap, zoneref, 60),
    egVolRef: egStruct(heap, egVolRef),
    egModRef,
  };
}

export function egStruct(heap, ref) {
  const [stage, nsamples] = new Int32Array(heap, ref, 2);
  const [delay, attack, hold, decay, sustain, release] = new Int16Array(
    heap,
    ref + 8,
    6
  );
  const [eg, eginc] = new Float64Array(heap, ref + 8 + 8 * 2, 2);
  return {
    ref,
    stage,
    nsamples,
    delay,
    attack,
    hold,
    decay,
    sustain,
    release,
    eg,
    eginc,
  };
}
