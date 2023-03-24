#ifndef EG_H
#define EG_H

#include "calc.h"
#include "sf2.h"

enum eg_stages {
  inactive = 0,  //
  init = 1,  // this is for key on message sent and will go next render cycle
  delay = 2,
  attack = 3,
  hold = 4,
  decay = 5,
  sustain = 6,
  release = 7,
  done = 99
};
typedef struct {
  float egval, egIncrement;
  int hasReleased, stage, nsamples_till_next_stage;
  short delay, attack, hold, decay, sustain, release, pad1, pad2;
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
  if (eg->egval < -1360.0f) {
    eg->stage = done;
    return eg->egval;
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
    case inactive:
      return;
    case init:  // cannot advance
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
      eg->nsamples_till_next_stage = timecent2sample(eg->hold);
      eg->egIncrement = 0.0f;
      break;
    case hold:
      // log(1) - log(sustain %)
      eg->egIncrement = 1.0f / (float)timecent2sample(eg->decay);
      eg->nsamples_till_next_stage = 1 / eg->egIncrement;
      eg->stage++;
      break;
    case decay:  // headsing to released;
      eg->stage++;
      eg->egIncrement = -960.0f / (float)timecent2sample(eg->sustain);
      eg->nsamples_till_next_stage = timecent2sample(eg->sustain);
      break;
    case sustain:
      eg->egIncrement = 0.0f;
      eg->nsamples_till_next_stage = timecent2sample(eg->release);
      if (eg->hasReleased) {
        eg->stage++;
      }
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
  eg->hasReleased = 0;
  advanceStage(eg);
}

void _eg_set_stage(EG* e, int n) {
  e->stage = n - 1;
  e->nsamples_till_next_stage = 0;
  advanceStage(e);
}
void _eg_release(EG* e) {
  if (e->stage >= release || e->stage <= attack) return;
  e->nsamples_till_next_stage = 0;
  e->hasReleased = 1;
  e->stage = sustain;
}
#endif