/*
typedef struct {
  float *inputf, *outputf;
  uint32_t channelId, key, vel,
    position, loopStart, loopEnd, channelId, key, velocity;
  zone_t* zone;
  EG *voleg, *modeg;
  LFO *modlfo, *vibrlfo;
  float fract, stride, fpad1;
  sp_availability sp_avail;
} spinner;
*/
export function spRef2json(heap, ref) {
  const [
    inputRef,
    outputRef,
    channelId,
    key,
    velocity,
    position,
    loopStart,
    loopEnd,
  ] = new Uint32Array(heap, ref, 8); // 8*4
  const [fract, stride, pdiff] = new Float32Array(heap, ref + 32, 3); // 8*3

  const [zoneRef, volEGRef, modEGRef, modflo, vibrlfo, pcmRef] =
    new Uint32Array(heap, ref + 44, 6);
  return {
    fract,
    stride, 
    pdiff,
    inputRef,
    outputRef,
    position,
    loopStart,
    loopEnd,
    zoneRef,
    // volEGRef,
    // modflo,
    // vibrlfo,
    channelId,
    key,
    velocity,
  };
}
/**
 binding for:
typedef struct {
  float egval, egIncrement;
  int hasReleased, stage, nsteps;
  short delay, attack, hold, decay, sustain, release, pad1, pad2;
} EG;

 * @param {*} heap 
 * @param {*} ref 
 * @returns 
 */

export function egStruct(heap, ref) {
  const [egval, egIncrement] = new Float32Array(heap, ref, 2);
  const [hasRelease, stage, nsteps] = new Int32Array(heap, ref + 8, 3);
  const [delay, attack, hold, decay, sustain, release] = new Int16Array(
    heap,
    ref + 20,
    6
  );
  return {
    ref,
    egval,
    egIncrement,
    hasRelease,
    stage,
    nsteps,
    adsr: [delay,
      attack,
      hold,
      decay,
      sustain,
      release].join(",")
  };
}
