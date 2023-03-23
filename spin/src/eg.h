#ifndef EG_H
#define EG_H

#include "calc.h"
#include "sf2.h"
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

void advanceStage(EG* eg);
float update_eg(EG* eg, int n);

/**
 * advances envelope generator by n steps..
 * shift to next stage and advance the remaining n steps
 * if necessary
 *
 */
float update_eg(EG* eg, int n) {
  int n1 = n > eg->nsteps ? eg->nsteps : n;
  eg->nsteps -= n1;

  if (eg->stage == release || eg->stage == decay) {
    while (n1--) {
      eg->egval *= eg->egIncrement;
    }
  } else {
    eg->egval += eg->egIncrement * n1;
  }
  if (n1 == n) return eg->egval;

  int leftover = n - n1;
  advanceStage(eg);
  return update_eg(eg, leftover);
}
void advanceStage(EG* eg) {
  switch (eg->stage) {
    case init:
      eg->stage++;
      if (eg->delay <= -12000) {
        eg->stage++;
      } else {
        eg->nsteps = timecent2sample(eg->delay);
        eg->egIncrement = 0.0f;
        break;
      }
    case delay:
      if (eg->attack <= -12000) {
        eg->stage++;
      } else {
        eg->nsteps = timecent2sample(eg->attack);
        eg->egval = -960.f;
        eg->egIncrement = 960.f / (float)eg->nsteps;
        break;
      }
    case attack:
      eg->stage++;
      eg->egval = 0.0;
      eg->nsteps = timecent2sample(eg->hold);
      eg->egIncrement = 0.0f;
      break;
    case hold:
      /* decay go from
        PEAK*r*r*r*...*r=sustain
        PEAK*r^n=sustain
        r^n = sustain/PEAK
        n * ln(r) =   ln(sus/1000)

        n = timecent2sampe(eg->decay)
        log(r)
       in */
      eg->nsteps = timecent2sample(eg->decay);
      float log_r = p10over200[(int)(eg->sustain / 5)] / eg->nsteps;
      eg->egIncrement = p10over200[(int)(log_r * 200)];
      break;
    case decay:  // headsing to released;
      eg->stage++;
      eg->nsteps = timecent2sample(eg->release);
      eg->egIncrement = 0.0f;
      break;
    case sustain:
      eg->nsteps = eg->release <= -12000 ? .01f * SAMPLE_RATE
                                         : timecent2sample(eg->release);

      log_r = p10over200[(int)(eg->egval / 1000.0f)] / eg->nsteps;
      eg->egIncrement = p10over200[(int)(log_r * 200)];
      eg->stage++;
      break;
    case release:
      eg->stage++;
      eg->nsteps = 0xffff;
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
void _eg_release(EG* eg) { _eg_set_stage(eg, release - 1); }
#endif