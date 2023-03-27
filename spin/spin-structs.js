import { newSFZoneMap } from "./zoneProxy.js";

/*
typedef struct {
  float *inputf, *outputf;
  uint32_t position, loopStart, loopEnd, channelId, key, velocity;
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
    position,
    loopStart,
    loopEnd,
    channelId,
    key,
    velocity,
  ] = new Uint32Array(heap, ref, 8); // 8*4
  const [fract, stride] = new Float32Array(heap, ref + 32, 3); // 8*3

  const [zoneRef, volEGRef, modEGRef, modflo, vibrlfo] = new Uint32Array(
    heap,
    ref + 44,
    5
  );
  if (!outputRef) throw "bad spinner no crit refs";
  return {
    fract,
    stride,
    inputRef,
    outputRef,
    outputf: new Float32Array(heap, outputRef, 128 * 2),
    position,
    loopStart,
    loopEnd,
    zoneRef,
    zone: zoneRef
      ? newSFZoneMap(zoneRef, new Int16Array(heap, zoneRef, 60))
      : null,
    volEG: volEGRef ? egStruct(heap, volEGRef) : null,
    modEG: modEGRef ? egStruct(heap, modEGRef) : null,
    modflo,
    vibrlfo,
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
  const [hasRelease, stage, nsamples] = new Int32Array(heap, ref, 3);
  const [delay, attack, hold, decay, sustain, release] = new Int16Array(
    heap,
    ref + 8,
    6
  );
  return {
    ref,
    egval,
    egIncrement,
    hasRelease,
    stage,
    nsamples,
    delay,
    attack,
    hold,
    decay,
    sustain,
    release,
  };
}
