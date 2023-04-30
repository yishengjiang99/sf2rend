// bastardized from RBJ's cookbook
#include "biquad.h"

#include "p1200.h"
extern float sinhf(float x);
extern float cosf(float x);
extern float sinf(float x);

static float exp1(float x) { return (6 + x * (6 + x * (3 + x))) * 0.16666666f; }
static float pow2(float x) { return exp1(x) / exp1(10); };
#define sample_rate 44100

biquad lpfs[1];  // singleton
biquad *this_lpf = lpfs;
float Q = 10.f;
int centFc = 13500;

float ct2hz(short tc) {
  if (tc < 0) return 1.0f / ct2hz(-1 * tc);
  if (tc > 1200) return 2.0f * ct2hz(tc - 1200);
  return p2over1200[tc] * 8.176f;
}
float get_omega(int ct) { return 2 * M_PI * ct2hz(ct) / (float)sample_rate; }
/* Computes a BiQuad filter on a sample */
float BiQuad(const float sample) {
  biquad *b = lpfs;
  float result;

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

biquad *setLPF(short cent, short band) {
  float omega = get_omega(cent);
  biquad *b = lpfs;

  float a0, a1, a2, b0, b1, b2;
  float A, sn, cs, alpha, beta;
  sn = sinf(omega);
  cs = cosf(omega);
  alpha = sn * sinhf(M_LN2 / 2 * bandwidth * omega / sn);
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
  b->x1 = b->x2 = 0;
  b->y1 = b->y2 = 0;
  return b;
}
void initialize(short cent, float q) {
  centFc = cent;
  Q = q;
}
void set_fc(short cent) {
  centFc = cent;
  setLPF(centFc, Q);
}

// /* sets up a BiQuad Filter */
// /* Note that dbGain is only used when the type is LSH or HSH */
// biquad *BiQuad_new(const int type, const float dbGain, const float freq,
//                    const float srate, const float bandwidth) {
//   biquad *b = lpfs;
//   float A, omega, sn, cs, alpha, beta;
//   float a0, a1, a2, b0, b1, b2;
//   /* setup variables */
//   // A = pow(10, dbGain / 40);
//   omega = 2 * M_PI * freq / srate;
//   sn = sinf(omega);
//   cs = cosf(omega);
//   alpha = sn * sinhf(M_LN2 / 2 * bandwidth * omega / sn);
//   // beta = sqrt(A + A);

//   switch (type) {
//     case LPF:
//       b0 = (1 - cs) / 2;
//       b1 = 1 - cs;
//       b2 = (1 - cs) / 2;
//       a0 = 1 + alpha;
//       a1 = -2 * cs;
//       a2 = 1 - alpha;
//       break;
//     // case HPF:
//     //   b0 = (1 + cs) / 2;
//     //   b1 = -(1 + cs);
//     //   b2 = (1 + cs) / 2;
//     //   a0 = 1 + alpha;
//     //   a1 = -2 * cs;
//     //   a2 = 1 - alpha;
//     //   break;
//     // case BPF:
//     //   b0 = alpha;
//     //   b1 = 0;
//     //   b2 = -alpha;
//     //   a0 = 1 + alpha;
//     //   a1 = -2 * cs;
//     //   a2 = 1 - alpha;
//     //   break;
//     // case NOTCH:
//     //   b0 = 1;
//     //   b1 = -2 * cs;
//     //   b2 = 1;
//     //   a0 = 1 + alpha;
//     //   a1 = -2 * cs;
//     //   a2 = 1 - alpha;
//     //   break;
//     // case PEQ:
//     //   b0 = 1 + (alpha * A);
//     //   b1 = -2 * cs;
//     //   b2 = 1 - (alpha * A);
//     //   a0 = 1 + (alpha / A);
//     //   a1 = -2 * cs;
//     //   a2 = 1 - (alpha / A);
//     //   break;
//     // case LSH:
//     //   b0 = A * ((A + 1) - (A - 1) * cs + beta * sn);
//     //   b1 = 2 * A * ((A - 1) - (A + 1) * cs);
//     //   b2 = A * ((A + 1) - (A - 1) * cs - beta * sn);
//     //   a0 = (A + 1) + (A - 1) * cs + beta * sn;
//     //   a1 = -2 * ((A - 1) + (A + 1) * cs);
//     //   a2 = (A + 1) + (A - 1) * cs - beta * sn;
//     //   break;
//     // case HSH:
//     //   b0 = A * ((A + 1) + (A - 1) * cs + beta * sn);
//     //   b1 = -2 * A * ((A - 1) + (A + 1) * cs);
//     //   b2 = A * ((A + 1) + (A - 1) * cs - beta * sn);
//     //   a0 = (A + 1) - (A - 1) * cs + beta * sn;
//     //   a1 = 2 * ((A - 1) - (A + 1) * cs);
//     //   a2 = (A + 1) - (A - 1) * cs - beta * sn;
//     //   break;
//     default:
//       break;
//   }

//   /* precompute the coefficients */
//   b->a0 = b0 / a0;
//   b->a1 = b1 / a0;
//   b->a2 = b2 / a0;
//   b->a3 = a1 / a0;
//   b->a4 = a2 / a0;

//   /* zero initial samples */
//   b->x1 = b->x2 = 0;
//   b->y1 = b->y2 = 0;

//   return b;
// }
