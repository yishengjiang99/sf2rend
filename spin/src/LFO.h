#include "calc.h"
#define modulo_s16f_inverse 1.0f / 32767.1f
#define modulo_u16f (float)(((1 << 16) + .1f))
typedef struct {
  unsigned short phase, delay;
  unsigned short phaseInc;
} LFO;

float dummy[666];  // backward compact hack

float LFO_roll_out(LFO* lfo, unsigned int n, float* output) {
  while (n--) {
    if (lfo->delay > 0) {
      lfo->delay--;
      *output++ = 0.f;
      continue;
    } else {
      lfo->phase += lfo->phaseInc;
      *output++ = (float)(((short)lfo->phase) * modulo_s16f_inverse);
    }
  }
  return *output;
}

void set_frequency(LFO* lfo, short ct) {
  double freq = timecent2hertz(ct);
  lfo->phaseInc = (unsigned short)(modulo_u16f * freq / SAMPLE_RATE);
}
/*
  oscillator[channel].phaseIncrement =
      (int32_t)(frequency / SAMPLE_RATE * BIT32_NORMALIZATION + .5f);
      */
float centdb_val(LFO* lfo) { return (1 - lfo->phase) * 0.5; }

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