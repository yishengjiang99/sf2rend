#ifndef EG_H
#define EG_H
#include "sf2.h"
#include "spin.h"
enum eg_stages {
  init = 0,
  delay,
  attack = 2,
  hold = 3,
  decay = 4,
  sustain = 5,
  release = 6,
  done = 99
};
typedef struct {
  float egval, egIncrement;
  int stage, nsteps;
  short delay, attack, hold, decay, sustain, release, pad1, pad2;
} EG;

#define invert_lg2_of_e 0.6931471805599453f
void advanceStage(EG* eg);
float update_eg(EG* eg, int n);
extern void ccclog(char* s);
extern void debugFL(float fl);

/**
 * advances envelope generator by n steps..
 * shift to next stage and advance the remaining n steps
 * if necessary
 *
 */
float update_eg(EG* eg, int n) {
  if (n < eg->nsteps) {
    eg->nsteps -= n;
    eg->egval += eg->egIncrement * n;
  } else {
    int leftOver = n - eg->nsteps;
    eg->egval += eg->egIncrement * n;
    eg->nsteps = 0;
    advanceStage(eg);
  }
  return eg->egval;
}
void advanceStage(EG* eg) {
  switch (eg->stage) {
    case init:
      eg->stage++;
      eg->nsteps = timecent2sample(eg->delay);
      eg->egIncrement = 0.0f;
      break;
    case delay:
      if (eg->attack <= -12000) {
        eg->attack = -11000;
      }
      eg->stage++;

      eg->nsteps = timecent2sample(eg->attack);
      eg->egval = -960.f;
      eg->egIncrement = 960.f / (float)eg->nsteps;
      break;
    case attack:
      eg->stage++;
      eg->egval = 0.0;
      eg->nsteps = timecent2sample(eg->hold);
      eg->egIncrement = 0.0f;
      break;
    case hold:
      eg->stage++;
      eg->nsteps = timecent2sample(eg->decay);
      eg->egIncrement = (eg->sustain - 960.f) / eg->nsteps;
      break;
    case decay:  // headsing to sustain;
      eg->stage++;
      eg->egval = eg->sustain - 960.f;
      eg->nsteps = SAMPLE_RATE;
      eg->egIncrement = 0.0f;
      break;
    case sustain:  // heading to release
      eg->nsteps = timecent2sample(eg->release);

      eg->egIncrement = -960.0f / eg->nsteps;
      eg->stage++;
      break;
    case release:
      eg->stage++;
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
  if (eg->sustain > 960) eg->sustain = 960;
  eg->stage = init;
  advanceStage(eg);
}
void init_mod_eg(EG* eg, zone_t* z, unsigned int pcmSampleRate) {
  char* sz = (char*)&z->ModEnvDelay;
  gmemcpy((char*)&eg->delay, sz, 12);

  eg->stage = init;
  advanceStage(eg);
}

void _eg_set_stage(EG* e, int n) {
  e->stage = n - 1;
  e->nsteps = 0;
  advanceStage(e);
}
void _eg_release(EG* eg) { _eg_set_stage(eg, release); }
#endif