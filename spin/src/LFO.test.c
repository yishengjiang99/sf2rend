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
#define rollprint(n, block)                                \
  {                                                        \
    for (int i = 0; i < n; i += block) {                   \
      printf("\n %f  %hu ", roll(lfo, block), lfo->delay); \
    }                                                      \
  }

int main() {
  LFO lfo[2];
  lfo->delay = (unsigned int)timecent2sample(-12000);
  lfo->delay = 0;
  set_frequency(lfo, 0);
  printf("%f %hu,%f", timecent2hertz(1200), lfo->delay,
         lfo->phaseInc * SAMPLE_RATE / modulo_s16f_inverse);

  for (int ia = 0; ia < 4154; ia++) {
    // rollprint(48000, 480);
    LFO_roll_out(lfo, 16, dummy);
    for (int i = 0; i < 16; i++) {
      // printf("\n%f", dummy[i]);
    }
  }
}