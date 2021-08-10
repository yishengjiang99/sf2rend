typedef struct {
  float fc;
  float b1, m1;
} lpf_t;
#ifndef M_PI
#define M_PI 3.1415926
#endif

#define emcc_fck_off __attribute__((used))

static float exp1(float x) { return (6 + x * (6 + x * (3 + x))) * 0.16666666f; }

emcc_fck_off void newLpf(lpf_t *l, float fc) {
  l->fc = fc;
  l->m1 = 0.0001;
  l->b1 = (1 - 2.0f * fc) * (1 - 2.0f * fc);
}

emcc_fck_off float process_input(lpf_t *l, float input, float detune) {
  float output = (1 - l->b1) * input + l->b1 * l->m1;
  if (output < -1.0) output = -1.0;
  if (output > 1.0) output = 1.0;
  l->m1 = output;

  return output;
}
