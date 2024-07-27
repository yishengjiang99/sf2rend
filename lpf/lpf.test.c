#define TEST_ENV 1
#ifdef TEST_ENV
#include "lpf.h"

#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#define BIT32_NORMALIZATION 4294967296.0f
#define SAMPLE_RATE 480000
float lerp(float f1, float f2, float frac) { return f1 + (f2 - f1) * frac; }
--int main() {
#define ts2hz(ts) 8.176f * powf(2.0f, (float)ts / 1200.0)

  float sample[4096] = {0.f};
  for (int i = 0; i < 4096; i++) {
    sample[i] = .5 * sinf((float)i * M_2_PI / 4096);
    sample[i] = 2 * sinf(.5 * (float)i * M_2_PI / 4096);
  }
  Biquad lpf = {0};

  short FilterFc = 8000;
  short Q = 410;
  float lowpassFc = ts2hz(FilterFc) / SAMPLE_RATE;
  lpf.QInv = 1.0 / powf(10.f, Q / 200.0);
  new_lpf(&lpf, lowpassFc);
  FILE *adc;

  adc = popen("ffplay -loglevel debug -i pipe:0 -f f32le -ac 1 -ar 48000", "w");
  uint32_t pinc = ts2hz(6900) * BIT32_NORMALIZATION / SAMPLE_RATE;
  uint32_t wavetableBits = 12;
  uint32_t nfract = 32 - wavetableBits;
  uint32_t mask_fraction = (1L << nfract) - 1;
  uint32_t mask_index = wavetableBits - 1;
  float scalar_fractional = 4096.f / BIT32_NORMALIZATION;
  uint32_t p = 0;
  float o;

  for (uint32_t i = 0; i < 48900 * 5; i++) {
    uint32_t index = (uint32_t)(p >> nfract) & 0x0fff;
    uint32_t index2 = (index + 1) & 0x0fff;
    float g1 = scalar_fractional * (float)(p & mask_fraction);
    float v = lerp(sample[index], sample[index2], g1);
    o = calc_lpf(&x->lpf, v);
    p += pinc;
    // fwrite(&v, 4, 1, adc);
    fwrite(&o, 4, 1, adc);
    if (i % 10000 == 5000) {
      lowpassFc += 100;
      new_lpf(&x->lpf, lowpassFc);
    }
    if (i % 10000 == 0) {
      lowpassFc -= 100;
      new_lpf(&x->lpf, lowpassFc);
    }
  }
  if (adc) fclose(adc);
  // while (!feof(fd)) {
  //   fread(f, sizeof(float), 1, fd);
  //   *o = calc_lpf(&x->lpf, *f);
  //   fwrite(o, sizeof(float), 1, fo);
  // }
  return 0;
}
#endif