#include "calc.h"
#define modulo_s16f_inverse 1.0f / 32767.5f
#define modulo_u16f (float)(((1 << 16) + .1f))
typedef struct {
  unsigned short phase, phaseInc, delay;
} LFO;

float roll(LFO* lfo, unsigned int n) {
  if (lfo->delay > n) {
    lfo->delay -= n;
    return 0.0f;
  } else {
    n -= lfo->delay;
    lfo->delay = 0;
  }
  while (n--) lfo->phase += lfo->phaseInc;
  float lfoval = (float)(((short)lfo->phase) * modulo_s16f_inverse);
  return lfoval;
}

void set_frequency(LFO* lfo, short frequency) {
  lfo->phaseInc =
      (unsigned short)(modulo_u16f / (float)timecent2sample(frequency));
}
float centdb_val(LFO* lfo) { return (1 - lfo->phase) * 0.5; }