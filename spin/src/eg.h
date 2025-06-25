#ifndef EG_H
#define EG_H
#include "calc.h"
#include "fix_point_12.h"
#if !defined(maxeg)
#define maxeg
#define MAX_EG -1440.f

#endif  // maxeg

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
  int hasReleased, stage, nsteps;
  short delay, attack, hold, decay, sustain, release, pad1, pad2;
  int progress, progressInc;  // add prog scale to use LUT
} EG;

void advanceStage(EG* eg);
float update_eg(EG* eg, int n);

void eg_roll(EG* eg, int n, float* output) {
  while (n-- && eg->nsteps--) {
    if (eg->stage == attack) {
      int lut_index = fixed_floor(eg->progress);
      double frag = get_fraction(eg->progress);
      double f1 = att_db_levels[lut_index], f2 = att_db_levels[lut_index + 1];
      eg->egval = lerpd(f1, f2, frag);
    } else {
      eg->egval += eg->egIncrement;
    }
    *output++ = eg->egval;
  }
  if (eg->egval > 0) eg->egval = 0.0f;
  if (eg->nsteps <= 7) advanceStage(eg);
}
/**
 * advances envelope generator by n steps..
 * shift to next stage and advance the remaining n steps
 * if necessary
 *
 */
float update_eg(EG* eg, int n) {
  while (n--) {
    eg->egval += eg->egIncrement;
    eg->nsteps--;
  }
  if (eg->nsteps <= 7) advanceStage(eg);
  if (eg->egval > 0) eg->egval = 0.0f;
  return eg->egval;
}

void advanceStage(EG* eg) {
  switch (eg->stage) {
    case inactive:
      eg->stage++;
      return;
    case init:
      eg->stage = delay;
      if (eg->delay > -12000) {
        eg->egval = MAX_EG;
        eg->nsteps = timecent2sample(eg->delay);
        eg->egIncrement = 0.0f;
        break;
      }
    case delay:
      eg->stage = attack;
      if (eg->attack > -12000) {
        eg->egval = MAX_EG;
        eg->nsteps = timecent2sample(eg->attack);
        eg->progress = double2fixed(0);
        eg->progressInc = double2fixed(255.0 / (double)eg->nsteps);
        break;
      }
    case attack:
      eg->stage = hold;
      eg->egval = 0.0f;
      eg->nsteps = timecent2sample(eg->hold);
      eg->egIncrement = 0.0f;

      break;
    case hold: /** TO DECAY */
      eg->stage = decay;
      eg->nsteps = timecent2sample(eg->decay) + timecent2sample(eg->release);
      eg->egIncrement = MAX_EG / eg->nsteps;
      eg->nsteps = timecent2sample(eg->decay);
      break;

    case decay:  // headsing to released;

      /*
      37 sustainVolEnv This is the decrease in level, expressed in centibels,
      to which the Volume Envelope value ramps during the decay phase. For the
      Volume Envelope, the sustain level is best expressed in centibels of
      attenuation from full scale. A value of 0 indicates the sustain level is
      full level; this implies a zero duration of decay phase regardless of
      decay time. A positive value indicates a decay to the corresponding
      level. Values less than zero are to be interpreted as zero;
      conventionally 1000 indicates full attenuation. For example, a sustain
      level which corresponds to an absolute value 12dB below of peak would be
      120.*/
      eg->stage = sustain;
      eg->egIncrement = 0.0f;
      eg->nsteps = 48000;
      break;

      // sustain = % decreased during decay

    case sustain:{
      int stepsFull = timecent2sample(eg->release + eg->decay);
      eg->egIncrement = MAX_EG / stepsFull;
      eg->nsteps = stepsFull * (eg->egval / MAX_EG);
    }
      break;
    case release:
      eg->stage = done;
      break;
    case done:
      break;
  }
}

void _eg_release(EG* e) {
  e->nsteps = 0;
  e->hasReleased = 1;
  e->stage = sustain;
  advanceStage(e);
}

void eg_init(EG* e) { e->attack = -12000; }
#endif