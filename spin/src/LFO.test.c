#include "LFO.h"

#include <assert.h>
#include <stdio.h>
#include <stdlib.h>

#define rollprint(n, block)                                    \
  {                                                            \
    for (int i = 0; i < n; i += block)                         \
    {                                                          \
      printf("\n %f  %hu ", LFO_roll(lfo, block), lfo->delay); \
    }                                                          \
  }

int main()
{
  LFO lfo[2];
  lfo->delay = 0;
  LFO_set_frequency(lfo, 1.0f);

  for (int ia = 0; ia < 4154; ia++)
  {
    LFO_roll_out(lfo, 16, dummy);
    for (int i = 0; i < 16; i++)
    {
      printf("\n%f", dummy[i]);
    }
  }
}