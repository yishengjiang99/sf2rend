#ifndef LPF_H
#define LPF_H

#define pi 3.1415f
#include "p1200.h"

typedef struct {
  float fc;
  float b1, m1;
} lpf_t;

lpf_t *newLpf(lpf_t *l, float fc) {
  l->fc = fc;
  l->m1 = 0.0f;
  l->b1 = p2over1200[(int)(2 * l->fc * pi / 1200)];
  return l;
}

float process_input(lpf_t *l, float input) {
  l->m1 = input * (1.0f - l->b1) + l->m1 * l->b1;
  return l->m1;
}

#endif