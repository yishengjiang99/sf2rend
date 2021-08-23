#ifndef EG_H
#define EG_H

#include "calc.h"
#include "sf2.h"

enum eg_stages { init = 0, delay, attack, hold, decay, release, done };
typedef struct {
  int stage, nsamples_till_next_stage;

  short delay, attack, hold, decay, sustain, release;
  double egval, egIncrement;
} EG;

/**
 * advances envelope generator by n steps..
 * shift to next stage and advance the remaining n steps
 * if necessary
 *
 */
double update_eg(EG* eg, int n) {
  if (eg->stage == done) return 0.0f;  // should not occur

  eg->nsamples_till_next_stage -= n;
  eg->egval += eg->egIncrement * n;

  if (eg->nsamples_till_next_stage > 0) return eg->egval;

  int leftover = -1 * eg->nsamples_till_next_stage;

  switch (eg->stage) {
    case init:
      eg->stage++;
      eg->nsamples_till_next_stage = timecent2sample(eg->delay);
      eg->egval = -960.0;
      eg->egIncrement = 0.0f;
      break;
    case delay:
      eg->stage++;
      eg->nsamples_till_next_stage = timecent2sample(eg->attack);
      eg->egval = -960.0f;
      eg->egIncrement = 960.0f / (float)eg->nsamples_till_next_stage;
      break;

    case attack:
      eg->stage++;
      eg->nsamples_till_next_stage = timecent2sample(eg->hold);
      eg->egval = 0.0f;
      eg->egIncrement = 0.0f;
      break;
    case hold:
      eg->stage++;
      eg->nsamples_till_next_stage = timecent2sample(eg->decay);
      eg->egval = 0.0f;
      eg->egIncrement =
          (float)(960.0f - eg->sustain) / (float)eg->nsamples_till_next_stage;
      break;
    case decay:
      eg->stage++;
      eg->egIncrement = -960.0f / timecent2sample(release);
      eg->nsamples_till_next_stage = (-960.0f - eg->egval) / eg->egIncrement;
      break;
    case release:
      eg->stage++;
      eg->nsamples_till_next_stage = 0xffff;
      break;
    case done:
      break;
  }
  if (leftover > 0) return update_eg(eg, leftover);
  return eg->egval;
}

void* gmemcpy(char* dest, const char* src, unsigned long n) {
  for (int i = 0; i < n; i++) *(dest + i) = src[i];
  return (void*)dest;
}
void init_vol_eg(EG* eg, zone_t* z) {
  char* sz = (char*)&z->VolEnvDelay;
  gmemcpy((char*)eg, sz, 12);
  eg->stage = init;
  eg->nsamples_till_next_stage = 1;
  update_eg(eg, 2);
}
void init_mod_eg(EG* eg, zone_t* z) {
  char* sz = (char*)&z->ModEnvDelay;
  gmemcpy((char*)eg, sz, 12);
  eg->stage = init;
  eg->nsamples_till_next_stage = 1;
  update_eg(eg, 2);
}

void _eg_release(EG* e) {
  e->stage = decay;
  e->nsamples_till_next_stage = 11;
}
void _eg_set_stage(EG* e, int n) {
  e->stage = n - 1;
  e->nsamples_till_next_stage = 0;
  update_eg(e, 1);
}
#endif