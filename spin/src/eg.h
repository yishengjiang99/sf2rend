#ifndef EG_H
#define EG_H

#include "calc.h"
#include "sf2.h"

enum eg_stages { init = 0, delay, attack, hold, decay, release, done = 99 };
typedef struct {
  int stage, nsamples_till_next_stage;
  short delay, attack, hold, decay, sustain, release, pad1, pad2;
  float egval, egIncrement;
} EG;

void advanceStage(EG* eg);
float update_eg(EG* eg, int n);
/**
 * advances envelope generator by n steps..
 * shift to next stage and advance the remaining n steps
 * if necessary
 *
 */
float update_eg(EG* eg, int n) {
  if (eg->stage == done) return 0.0f;  // should not occur
  if (eg->egval < -1000.0) {
    eg->stage = done;
    return 0.0f;
  }
  int n1 = n > eg->nsamples_till_next_stage ? eg->nsamples_till_next_stage : n;
  if (eg->nsamples_till_next_stage != 0xffff) {
    eg->nsamples_till_next_stage -= n1;

    eg->egval += eg->egIncrement * n1;
  }

  if (n1 == n) return eg->egval;

  int leftover = n - n1 - 1;
  advanceStage(eg);
  if (leftover > 0) return update_eg(eg, leftover);
  return eg->egval;
}
void advanceStage(EG* eg) {
  switch (eg->stage) {
    case init:
      eg->stage++;
      eg->nsamples_till_next_stage = timecent2sample(eg->delay);
      eg->egval = -960.0f;
      eg->egIncrement = 0.0f;
      break;
    case delay:
      eg->stage++;
      eg->egval = -960.0f;
      eg->nsamples_till_next_stage = timecent2sample(eg->attack);
      eg->egIncrement = 960.0f / (float)eg->nsamples_till_next_stage;
      break;

    case attack:
      eg->stage++;
      eg->egval = 0.0f;

      eg->nsamples_till_next_stage = timecent2sample(eg->hold);
      eg->egIncrement = 0.0f;
      break;
    case hold:
      eg->egval = 0.0f;

      eg->stage++;
      if (eg->decay > -12000 && eg->sustain > 10) {
        eg->egIncrement =
            (0.0f - eg->sustain) / (float)timecent2sample(eg->decay);
        eg->nsamples_till_next_stage =
            (int)((eg->egval - eg->sustain) / eg->egIncrement);
      } else {
        eg->egIncrement = .0f;
        eg->nsamples_till_next_stage = 0xffff;
      }
      break;
    case decay:
      eg->stage++;
      eg->egIncrement = -960.0f / (float)timecent2sample(eg->release);
      eg->nsamples_till_next_stage = timecent2sample(eg->release);
      break;
    case release:
      eg->stage++;
      eg->nsamples_till_next_stage = 0xffff;
      break;
    case done:
      break;
  }
}

void* gmemcpy(char* dest, const char* src, unsigned long n) {
  for (int i = 0; i < n; i++) *(dest + i) = src[i];
  return (void*)dest;
}
void scaleTc(EG* eg, unsigned int pcmSampleRate) {
  float scaleFactor = SAMPLE_RATE / (float)pcmSampleRate;
  eg->attack *= scaleFactor;
  eg->delay *= scaleFactor;
  eg->decay *= scaleFactor;
  eg->release *= scaleFactor;
  eg->hold *= scaleFactor;
}
void init_vol_eg(EG* eg, zone_t* z, unsigned int pcmSampleRate) {
  char* sz = (char*)&z->VolEnvDelay;
  gmemcpy((char*)&eg->delay, sz, 12);
  scaleTc(eg, pcmSampleRate);

  eg->stage = init;
  if (eg->attack >= 0) eg->attack = 0;
  advanceStage(eg);
}
void init_mod_eg(EG* eg, zone_t* z, unsigned int pcmSampleRate) {
  char* sz = (char*)&z->ModEnvDelay;
  gmemcpy((char*)&eg->delay, sz, 12);
  scaleTc(eg, pcmSampleRate);

  eg->stage = init;
  advanceStage(eg);
}

void _eg_set_stage(EG* e, int n) {
  e->stage = n - 1;
  e->nsamples_till_next_stage = 0;
  advanceStage(e);
}
void _eg_release(EG* e) {
  if (e->stage == decay || e->stage == hold || e->stage == attack) {
    _eg_set_stage(e, release);
  }
}
#endif