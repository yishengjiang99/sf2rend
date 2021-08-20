#include "p1200.c"
#define log_2_10 3.321928094887362
#define bit23_normalize 1.000f / 0x7fffff
#ifndef SAMPLE_RATE
#define SAMPLE_RATE 44100.0f
#endif
#define SAMPLE_BLOCK 128
#define BLOCKS_PER_SECOND SAMPLE_RATE / SAMPLE_BLOCK

double timecent2second(short tc) {
  if (tc < 0) return 1 / timecent2second(-1 * tc);
  if (tc > 1200) return 2.0f * timecent2second(tc - 1200);
  return p2over1200[tc];
}
unsigned int timecent2sample(short tc) {
  return (unsigned int)(timecent2second(tc) * SAMPLE_RATE);
}
double attack_db_inc(short attackRate) {
  return 960.0f / timecent2second(attackRate) / SAMPLE_RATE;
}
int FloatTo23Bits(float x) {
  float y = x + 1.f;
  return (*(unsigned long*)&y) & 0x7FFFFF;  // last 23 bits
}

float applyCentible(float signal, short centdb) {
  int sigl = FloatTo23Bits(signal);
  double nff = log_2_10 * centdb / 200.0f;
  while (nff < -1.0) {
    sigl = sigl >> 1;
    nff += 1.0;
  }
  return sigl / bit23_normalize;
}

float hermite4(float frac_offset, float xm1, float x0, float x1, float x2) {
  const float c = (x1 - xm1) * 0.5f;
  const float v = x0 - x1;
  const float w = c + v;
  const float a = w + v + (x2 - x0) * 0.5f;
  const float b_neg = w + a;

  return ((((a * frac_offset) - b_neg) * frac_offset + c) * frac_offset + x0);
}