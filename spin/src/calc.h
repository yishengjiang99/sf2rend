#ifndef CALC_H
#define CALC_H
#include "midi_normalized.h"
#include "p1200.h"
#include "spin.h"
#define SAMPLE_BLOCK 128

#define clamp(val, min, max) val > max ? max : val < min ? min : val
const double ln2 = 0.693147180559945;
float lerp(float f1, float f2, float frac) { return f1 + (f2 - f1) * frac; }
float lerpd(double f1, double f2, double frac) { return f1 + (f2 - f1) * frac; }

float calcp2over1200(float tc) {
  float m = 1.0f;
  while (tc >= 1200.f) {
    tc -= 1200;
    m *= 2;
  }
  while (tc < 0) {
    tc += 1200;
    m /= 2;
  }
  double f = p2over1200[(short)tc] * m;

  return f;
}

double timecent2second(short tc) {
  if (tc < 0) return 1.0f / timecent2second(-1 * tc);
  if (tc > 1200) return 2.0f * timecent2second(tc - 1200.0f);
  return p2over1200[tc];
}

double timecent2hertz(short tc) { return 8.176f * timecent2second(tc); }

int timecent2sample(short tc) {
  return (int)(timecent2second(tc) * SAMPLE_RATE);
}
float applyCentible(float signal, short centdb) {
  if (centdb > 0) return signal;
  if (centdb <= -1441) return 0.0f;
  return clamp(signal * p10over200[centdb + 1440], -1, 1);
}

float hermite4(float frac_offset, float xm1, float x0, float x1, float x2) {
  const float c = (x1 - xm1) * 0.5f;
  const float v = x0 - x1;
  const float w = c + v;
  const float a = w + v + (x2 - x0) * 0.5f;
  const float b_neg = w + a;

  return ((((a * frac_offset) - b_neg) * frac_offset + c) * frac_offset + x0);
}

static inline short sf2midiPan(short sf2pan) {
  if (sf2pan > 500) return 128;
  if (sf2pan < -500) return 1;
  return (short)64 + sf2pan / 500 * 64;
}
double midi_volume_log10(int val) {
  val = clamp(val, 1, 127);
  if (val < 0) return -1440;
  return midi_log_10[val | 0];
}
#endif