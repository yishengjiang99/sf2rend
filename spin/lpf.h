typedef struct {
  float fc;
  float b1, m1;
} lpf_t;
void newLpf(lpf_t* l, float fc) {
  l->fc = fc;
  l->m1 = 0.0000f;
  l->b1 = (1.0f - 2.0f * fc) * (1.0f - 2.0f * fc);
}
float process_input(lpf_t* l, float input, float detune) {
  float output = (1 - l->b1) * input + l->b1 * l->m1;
  if (output < -1.0) output = -1.0;
  if (output > 1.0) output = 1.0;
  l->m1 = output;

  return output;
}