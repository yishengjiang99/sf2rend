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
  int hasReleased, stage, nsteps;
  short delay, attack, hold, decay, sustain, release, pad1, pad2;
} EG;

void advanceStage(EG* eg);
float update_eg(EG* eg, int n);

void eg_roll(EG* eg, int n, float* output) {
  while (n--) {
    eg->egval += eg->egIncrement;
    eg->nsteps--;
    *output++ = eg->egval;
  }
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
  return eg->egval;
}

void advanceStage(EG* eg) {
  // if (eg->hasReleased > 0 && eg->stage < release) {
  //   goto EG_RELEASE;
  // }
  switch (eg->stage) {
    case inactive:  // cannot advance
      eg->stage++;
      return;
    case init:
      eg->stage = delay;
      if (eg->delay > -12000) {
        eg->egval = -960.0f;
        eg->nsteps = timecent2sample(eg->delay);
        eg->egIncrement = 0.0f;
        break;
      }
    case delay:
      eg->stage = attack;
      if (eg->attack > -12000) {
        eg->egval = -960.0f;
        eg->nsteps = timecent2sample(eg->attack);
        eg->egIncrement = 960.0f / (float)eg->nsteps;
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
        /*
         * This is the time, in absolute timecents, for a 100% change in the
    Volume Envelope value during decay phase. */
        // velopcity required to travel full 960db
        eg->nsteps = timecent2sample(eg->decay);
        eg->egIncrement = -960.f / eg->nsteps;

        // but it's timeslice by sustain percentage?
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

    case sustain:
    EG_RELEASE:
      /*This is the time, in absolute timecents, for a 100% change in
the Volume Envelope value during release phase. For the Volume Envelope,
the release phase linearly ramps toward zero from the current level,
causing a constant dB change for each time unit. If the current level were
full scale, the Volume Envelope Release Time would be the time spent in
release phase until 100dB attenuation were reached. A value of 0 indicates
a 1-second decay time for a release from full level. SoundFont 2.01
Technical Specification - Page 45 - 08/05/98 12:43 PM A negative value
indicates a time less than one second; a positive value a time longer than
one second. For example, a release time of 10 msec would be 1200log2(.01) =
-7973. 39 keynumToVolEnvHold This is the degree, in timecents per K**/
      eg->stage = release;
      float stepsFull =
          (float)timecent2sample(eg->release); /*8 nsteps for full 960*/

      eg->egIncrement = -960.0f / stepsFull;
      eg->nsteps = eg->egval / eg->egIncrement;
      break;
    case release:
      eg->stage = done;
      break;
    case done:
      break;
  }
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
  float scaleFactor = SAMPLE_RATE / (float)pcmSampleRate;
  eg->attack = z->VolEnvAttack * scaleFactor;
  eg->delay = z->VolEnvDelay * scaleFactor;
  eg->decay = z->VolEnvDecay * scaleFactor;
  eg->release = z->VolEnvRelease * scaleFactor;
  eg->hold = z->VolEnvHold * scaleFactor;
  // eg->sustain = z->VolEnvSustain * scaleFactor;
  eg->stage = init;
  eg->nsteps = 0;
}
void init_mod_eg(EG* eg, zone_t* z, unsigned int pcmSampleRate) {
  eg->attack = z->ModEnvAttack;
  eg->delay = z->ModEnvDelay;
  eg->decay = z->ModEnvDecay;
  eg->release = z->ModEnvRelease;
  eg->hold = z->ModEnvHold;
  eg->sustain = z->ModEnvSustain;
}

void _eg_release(EG* e) {
  e->nsteps = 0;
  e->hasReleased = 1;
  e->stage = sustain;
  advanceStage(e);
}
#endif