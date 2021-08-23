#include "calc.h"
#define modulo_s16f_inverse 1.0f / 32767.5f
#define modulo_u16f (float)(((1 << 16) + .1f) / SAMPLE_RATE)
typedef struct {
  unsigned short phase, phaseInc, delay;
} LFO;

float roll(LFO* lfo, unsigned int n) {
  if (lfo->delay > n) {
    lfo->delay -= n;
    return 0;
  } else {
    n -= lfo->delay;
    lfo->delay = 0;
  }
  while (n--) lfo->phase += lfo->phaseInc;
  return (float)(((short)lfo->phase) * modulo_s16f_inverse);
}
void set_frequency(LFO* lfo, short frequency) {
  lfo->phaseInc = (short)(timecent2hertz(-1200) * modulo_u16f);
}
