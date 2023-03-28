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

/**
 * advances envelope generator by n steps..
 * shift to next stage and advance the remaining n steps
 * if necessary
 *
 */
float update_eg(EG* eg, int n) {
  if (eg->egval < -1360.0f) {
    eg->stage = done;
    return eg->egval;
  }
  int n1 = n > eg->nsteps ? eg->nsteps : n;
  if (eg->nsteps != 0xffff) {
    eg->nsteps -= n1;

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
    case inactive:  // cannot advance
      eg->stage++;
      return;
    case init:
      eg->egval = -960.0f;
      eg->stage++;
      if (eg->delay > -11500) {
        eg->nsteps = timecent2sample(eg->delay);
        eg->egval = -960.0f;
        eg->egIncrement = 0.0f;
        break;
      }
    case delay:
      eg->egval = -960.0f;
      eg->stage++;
      if (eg->attack > -11500) {
        eg->egval = -960.0f;
        eg->nsteps = timecent2sample(eg->attack);
        eg->egIncrement = 960.0f / eg->nsteps;
        break;
      }
    case attack:
      eg->egval = 0.0f;
      eg->stage++;
      if (eg->hold > -11500) {
        eg->egval = 0.0f;
        eg->nsteps = timecent2sample(eg->hold);
        eg->egIncrement = 0.0f;
        break;
      }
    case hold: /** TO DECAY */
      eg->stage++;
      /*
       * This is the time, in absolute timecents, for a 100% change in the
  Volume Envelope value during decay phase. */
      // velopcity required to travel full 960db
      eg->egIncrement = -960.f / timecent2sample(eg->decay);

      // but it's timeslice by sustain percentage?
      eg->nsteps = eg->sustain / 1000.0f * timecent2sample(eg->decay);

      /*For the Volume
      Envelope, the decay phase linearly ramps toward the sustain level,
      causing a constant dB change for each time unit. If the sustain level
      were -100dB, the Volume Envelope Decay Time would be the time
      spent in decay phase. A value of 0 indicates a 1-second decay time for
      a zero-sustain level. A negative value indicates a time less than one
      second; a positive value a time longer than one second. For example, a
      decay time of 10 msec would be 1200log2(.01) = -7973.*/
      break;
    case decay:  // headsing to released;
      // sustain pedal .. for not going to ignore..
      eg->stage++;

      // sustain = % decreased during decay

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

    case sustain:
      eg->stage++;
      int stepsFull = timecent2sample(eg->release); /*8 nsteps for full 960*/

      eg->egIncrement = -960.f / stepsFull;
      eg->nsteps = stepsFull / 4;
      break;

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
    case release:
      eg->stage++;
      eg->egval = -100.0f;
      eg->egIncrement = -20.f;
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
  eg->egIncrement = 0.0f;
  eg->egval = -960.0f;
  eg->hasReleased = 0;

  if (eg->attack >= 0) eg->attack = 0;
}
void init_mod_eg(EG* eg, zone_t* z, unsigned int pcmSampleRate) {
  char* sz = (char*)&z->ModEnvDelay;
  gmemcpy((char*)&eg->delay, sz, 12);
  scaleTc(eg, pcmSampleRate);
  eg->stage = init;
  eg->egval = -960.0f;
  eg->hasReleased = 0;
}

void _eg_set_stage(EG* e, int n) {
  e->stage = n - 1;
  e->nsteps = 0;
  advanceStage(e);
}
void _eg_release(EG* e) {
  e->nsteps = 0;
  e->hasReleased = 1;
  e->stage = sustain;
}
#endif