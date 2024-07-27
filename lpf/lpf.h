extern float tanf(float input);

/* this holds the data required to update samples thru a filter */
typedef struct {
  double QInv, a0, a1, b1, b2, z1, z2;
} Biquad;

/**
 * @param fc: hz/sample rate (radiances)
 */
void lfp_set_frequency(Biquad *lpf, float fc) {
  double K = tanf(3.1415f * fc);
  double KK = K * K;
  double norm = 1.0 / (1 + K * lpf->QInv + KK);
  lpf->a0 = KK * norm;
  lpf->a1 = 2 * lpf->a0;
  lpf->b1 = 2 * (KK - 1) * norm;
  lpf->b2 = (1 - K * lpf->QInv + KK) * norm;
}

float calc_lpf(Biquad *b, double In) {
  double Out = In * b->a0 + b->z1;
  b->z1 = In * b->a1 + b->z2 - b->b1 * Out;
  b->z2 = In * b->a0 - b->b2 * Out;
  return (float)Out;
}