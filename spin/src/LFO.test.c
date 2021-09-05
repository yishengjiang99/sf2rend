#include "LFO.h"

#include <assert.h>
#include <stdio.h>
#include <stdlib.h>

#include "calc.h"
/*
   VIBLFOTOPITCH: 40.00
      FILTERQ: -110.00
      MODLFOTOVOL: 20.00
      CHORUSSEND: 300.00
      REVERBSEND: 40.00
      MODLFOFREQ: -884.00
      VIBLFOFREQ: -1200.00
      VOLENVDELAY: -3986.00
      VOLENVATTACK: -3986.00
      VOLENVHOLD: -7973.00
      VOLENVDECAY: 3600.00
      VOLENVSUSTAIN: 960.00
      VOLENVRELEASE: 1200.00
      */
#define rollprint(n, block)              \
  {                                      \
    for (int i = 0; i < n; i += block) { \
      printf("\n%f", roll(lfo, block));  \
    }                                    \
  }

int main() {
  LFO lfo[2];
  lfo->delay = 1200;
  set_frequency(lfo, 1200);
  roll(lfo, 1);

  // printf("\n %f\n", timecent2hertz(-1200) * (1 << 16) / SAMPLE_RATE);

  set_frequency(lfo, -1200);
  rollprint(48000, 1);
}