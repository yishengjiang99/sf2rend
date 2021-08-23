
#include "spin.h"
#ifdef debug
#include <stdio.h>
#endif

#define RENDQ 128
#define sps_index() (spsIndx++) & 0x0f

spinner sps[16];
lpf_t lpf[16];
EG eg[32];
float outputs[16 * RENDQ];
float silence[40];
char spsIndx = 0;
void reset(spinner* x);

spinner* newSpinner() {
  int idx = sps_index();
  spinner* x = &sps[idx];
  x->outputf = &outputs[idx * RENDQ];
  x->inputf = silence;
  x->loopEnd = 36;
  x->loopStart = 4;
  x->fract = 0.0f;
  x->position = 0;
  x->lpf = &lpf[idx];
  newLpf(x->lpf, 0.45f);
  x->voleg = &eg[idx * 2];
  x->modeg = &eg[idx * 2 + 1];
  reset(x);
  return x;
}
void eg_release(spinner* x) {
  _eg_release(x->voleg);
  _eg_release(x->modeg);
}
void reset(spinner* x) {
  x->position = 0;
  x->fract = 0.0f;
  x->lpf->m1 = 0;

  x->voleg->stage = init;
  x->voleg->nsamples_till_next_stage = 0;
  x->voleg->egval = -960.0f;
  x->voleg->egIncrement = 0.0f;
  x->modeg->stage = init;
  x->modeg->nsamples_till_next_stage = 0;
  x->modeg->egval = -960.0f;
  x->voleg->egIncrement = 0.0f;
}
float set_attrs(spinner* x, float* inp, uint32_t loopstart, uint32_t loopend,
                zone_t* z, float stride) {
  x->loopStart = loopstart;
  x->loopEnd = loopend;
  x->inputf = inp;
  x->zone = z;
  x->stride = stride;
  init_mod_eg(x->modeg, z);
  init_vol_eg(x->voleg, z);
  reset(x);
  return x->stride;
}

float lerp(float f1, float f2, float frac) { return f1 + (f2 - f1) * frac; }
#define subtractWithFloor(a, b, floor) a - b > floor ? a - b : 0;

float _spinblock(spinner* x, int n, int blockOffset) {
  update_eg(x->voleg, n);

  update_eg(x->modeg, n);  // x->zone, 0);
  if (x->voleg->stage == done) return .0f;

  int position = x->position;
  float fract = x->fract;
  float stride = x->stride;
  double db = x->voleg->egval + x->zone->Attenuation;
  double dbTarget = x->voleg->egval + x->voleg->egIncrement * n;

  int looplen = x->loopEnd - x->loopStart + 1;

  float mixIncrement = 1.0f / (float)n;
  float mix = 0.0f;
  double dbInc = x->voleg->egIncrement;
  for (int i = 0; i < n; i++) {
    mix += mixIncrement;
    fract = fract + stride;

    while (fract >= 1.0f) {
      position++;
      fract -= 1.0f;
    }

    if (position >= x->loopEnd && x->loopStart != -1) position -= looplen;
    float outputf = lerp(x->inputf[position], x->inputf[position + 1], fract);
    outputf = applyCentible(outputf, (short)db);
    x->outputf[i + blockOffset] = outputf;
    db += dbInc;
  }

  x->voleg->egval = db;
  x->position = position;
  x->fract = fract;
  x->stride = stride;
  x->voleg->nsamples_till_next_stage =
      subtractWithFloor(x->voleg->nsamples_till_next_stage, n, 0);
  x->modeg->nsamples_till_next_stage =
      subtractWithFloor(x->modeg->nsamples_till_next_stage, n, 0);
  return stride;
}

float spin(spinner* x, int n) {
  if (x->voleg->stage == done) return 0.f;
  for (int blockOffset = 0; blockOffset <= n - 32; blockOffset += 32) {
    _spinblock(x, 32, blockOffset);
  }
  return (float)x->voleg->egval;
}