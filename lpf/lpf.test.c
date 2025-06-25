

#include <assert.h>
#include <math.h>
#include <stdio.h>
int sample_rate_log2 = 15023;

#include "biquad.c"

#define ONE_SEMI 8.176f

int main() {
  float fcc = get_omega(15023);
  assert(fabs(fcc - 2 * M_PI) < .001);
  printf("%f\t%f\n", fcc, fcc - 2 * M_PI);

  setLPF(4500, 11);
  printf("%f", lpfs->a0);
  return 1;
}