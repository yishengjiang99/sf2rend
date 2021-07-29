typedef struct {
  float fc;
  float b1, m1;
} lpf_t;
#ifndef M_PI
#define M_PI 3.14159f
#endif

#define emcc_fck_off __attribute__((used))

static float exp1(float x) { return (6 + x * (6 + x * (3 + x))) * 0.16666666f; }

emcc_fck_off void newLpf(lpf_t *l, float fc) {
  l->fc = fc;
  l->m1 = 0.000000;

  l->b1 = exp1(-2.0f * M_PI * l->fc);
}

emcc_fck_off float process_input(lpf_t *l, float input, float detune) {
  float detunedb1 = l->b1 * exp1(-2.0f * M_PI * detune);
  float output = input * (1.0f - detunedb1) + l->m1 * detunedb1;
  l->m1 = output;
  return output;
}
