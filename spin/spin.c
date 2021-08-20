
#include <stdint.h>

#include "calc.c"
#include "lpf.h"
#include "sf2.h"

#define RENDQ 128
#define sps_index() (spsIndx++) & 0x0f
#ifndef M_PI
#define M_PI 3.1415926
#endif

enum eg_stages { init = 0, delay, attack, hold, decay, release };
typedef struct {
  uint32_t stage, nsamples_till_next_stage;
  double egval, egIncrement;
} EG;

void update_eg(EG* eg, zone_t* z, int isVolEG) {
  switch (eg->stage) {
    case init:
      eg->stage = delay;
      eg->nsamples_till_next_stage =
          timecent2sample(isVolEG ? z->VolEnvDelay : z->ModEnvDelay);
      eg->egval = -960.0;
      eg->egIncrement = 0.0f;
      if (eg->nsamples_till_next_stage > 10) return;
      break;
    case delay:
      eg->stage++;
      eg->nsamples_till_next_stage =
          timecent2sample(isVolEG ? z->VolEnvAttack : z->ModEnvAttack);
      eg->egval = -960.0f;
      eg->egIncrement = 960.0f / (float)eg->nsamples_till_next_stage;
      if (eg->nsamples_till_next_stage > 10) return;
      break;

    case attack:
      eg->stage++;
      eg->nsamples_till_next_stage =
          timecent2sample(isVolEG ? z->VolEnvHold : z->ModEnvHold);

      eg->egval = 0.0f;
      eg->egIncrement = 0.0f;
      if (eg->nsamples_till_next_stage > 10) return;
      // fallthrough
    case hold:
      eg->stage++;
      eg->nsamples_till_next_stage =
          timecent2sample(isVolEG ? z->VolEnvDecay : z->ModEnvDecay);

      eg->egval = 0.0f;
      eg->egIncrement =
          (-960.0f + z->VolEnvSustain) / eg->nsamples_till_next_stage;
      break;
      // fallthrough
    case decay:
      eg->stage++;
      eg->nsamples_till_next_stage =
          timecent2sample(isVolEG ? z->VolEnvRelease : z->ModEnvRelease);

      // eg->egval = 0.0f;
      eg->egIncrement = -553.0f / (float)eg->nsamples_till_next_stage;
      break;
      // fallthrough
    case release:
      eg->stage++;
      break;
  }
}

typedef struct {
  float *inputf, *outputf;
  float fract;
  uint32_t position, loopStart, loopEnd;
  float stride, strideInc;
  lpf_t* lpf;
  zone_t* zone;
  EG *voleg, *modeg;
} spinner;

spinner sps[16];
lpf_t lpf[16];
EG eg[32];
float outputs[16 * RENDQ];
float silence[40];
char spsIndx = 0;

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

  return x;
}

void reset(spinner* x) {
  x->position = 0;
  x->fract = 0.0f;
  x->lpf->m1 = 0;
  x->position = 0;
  x->fract = 0.0f;
  x->voleg->stage = init;
  x->voleg->nsamples_till_next_stage = 2;
  x->voleg->egval = -960;
  x->modeg->stage = init;
  x->modeg->nsamples_till_next_stage = 2;
  x->modeg->egval = -960;
}
void set_attrs(spinner* x, float* inp, uint32_t loopstart, uint32_t loopend) {
  x->loopStart = loopstart;
  x->loopEnd = loopend;
  x->inputf = inp;
}
void setZone(spinner* x, zone_t* z) { x->zone = z; }
void setStride(spinner* x, float stride) { x->stride = stride; }
float lerp(float f1, float f2, float frac) { return f1 + (f2 - f1) * frac; }
#define subtractWithFloor(a, b, floor) a - b > floor ? a - b : 0;

float _spinblock(spinner* x, int n, int blockOffset) {
  if (x->voleg->nsamples_till_next_stage <= n / 2)
    update_eg(x->voleg, x->zone, 1);
  if (x->modeg->nsamples_till_next_stage <= n / 2)
    update_eg(x->modeg, x->zone, 0);

  int position = x->position;
  float fract = x->fract;
  float stride = x->stride;
  double db = x->voleg->egval;
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
    outputf = applyCentible(outputf, db);

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
  for (int blockOffset = 0; blockOffset < n; blockOffset += 32) {
    _spinblock(x, 32, blockOffset);
  }
}