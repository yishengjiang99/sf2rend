/**
 * @file biquad.c
 *
 * Simple implementation of Biquad filters -- Tom St Denis
 *
 * Based on the work
 *
 *   Cookbook formulae for audio EQ biquad filter coefficients
 *   ---------------------------------------------------------
 *   by Robert Bristow-Johnson, pbjrbj@viconet.com  a.k.a. robert@audioheads.com
 *
 * Available on the web at
 *    http://www.musicdsp.org/files/biquad.c
 *
 * Enjoy.
 *
 * This work is hereby placed in the public domain for all purposes, whether
 * commercial, free [as in speech] or educational, etc.  Use the code and please
 * give me credit if you wish.
 *
 * Tom St Denis -- http://tomstdenis.home.dhs.org
 *
 * See also: http://musicweb.ucsd.edu/~tre/biquad.pdf
 *
 */
extern double pow(double base, double exp);
extern double sin(double x);
extern double cos(double x);
extern double sinh(double x);
extern double sqrt(double x);
typedef float smp_type;
#ifndef M_LN2
#define M_LN2 0.69314718055994530942
#endif

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

/* this holds the data required to update samples thru a filter */
typedef struct {
  smp_type a0, a1, a2, a3, a4;
  smp_type x1, x2, y1, y2;
} biquad;
static biquad k[1];
biquad *mkk() { return k; }
/* Computes a BiQuad filter on a sample */
smp_type BiQuad(const smp_type sample, biquad *const b) {
  smp_type result;

  /* compute result */
  result = b->a0 * sample + b->a1 * b->x1 + b->a2 * b->x2 - b->a3 * b->y1 -
           b->a4 * b->y2;

  /* shift x1 to x2, sample to x1 */
  b->x2 = b->x1;
  b->x1 = sample;

  /* shift y1 to y2, result to y1 */
  b->y2 = b->y1;
  b->y1 = result;

  return result;
}

/* sets up a BiQuad Filter */
/* Note that dbGain is only used when the type is LSH or HSH */
void BiQuad_new(biquad *b, const int type, const smp_type dbGain,
                const smp_type freq, const smp_type srate,
                const smp_type bandwidth) {
  smp_type A, omega, sn, cs, alpha, beta;
  smp_type a0, a1, a2, b0, b1, b2;
  /* setup variables */
  A = pow(10, dbGain / 40);
  omega = 2 * M_PI * freq / srate;
  sn = sin(omega);
  cs = cos(omega);
  alpha = sn * sinh(M_LN2 / 2 * bandwidth * omega / sn);
  // beta = sqrt(A + A);
  b0 = (1 - cs) / 2;
  b1 = 1 - cs;
  b2 = (1 - cs) / 2;
  a0 = 1 + alpha;
  a1 = -2 * cs;
  a2 = 1 - alpha;
  /* precompute the coefficients */
  b->a0 = b0 / a0;
  b->a1 = b1 / a0;
  b->a2 = b2 / a0;
  b->a3 = a1 / a0;
  b->a4 = a2 / a0;

  /* zero initial samples */
  b->x1 = b->x2 = 0;
  b->y1 = b->y2 = 0;
}
void setFilterFC(biquad *b, smp_type srate, smp_type freq) {
  smp_type A, omega, sn, cs, alpha, beta, b0, b1, b2, a0, a1, a2;
  omega = 2 * M_PI * freq / srate;
  sn = sin(omega);
  cs = cos(omega);
  alpha = sn * sinh(M_LN2 / 2 * 1 * omega / sn);
  // beta = sqrt(A + A);
  b0 = (1 - cs) / 2;
  b1 = 1 - cs;
  b2 = (1 - cs) / 2;
  a0 = 1 + alpha;
  a1 = -2 * cs;
  a2 = 1 - alpha;
  b->a0 = b0 / a0;
  b->a1 = b1 / a0;
  b->a2 = b2 / a0;
  b->a3 = a1 / a0;
  b->a4 = a2 / a0;
}
#ifdef debugg
#include <stdio.h>
int main() {
  static biquad b[1];

  BiQuad_new(b, 0, (double)0, (double)440, (double)48000.0, 1.0f);
  printf("%f %f", b->a0, b->a1);
  return 1;
}
#endif