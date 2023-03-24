
typedef struct {
  /*
X = exp(-2.0 * pi * Fc)
*     A = 1 - X
*     B = X
*     Fc = cutoff freq / sample rate*/
  float input;
  float output;
  float m1;
  float X;
} lpf_t;
#ifndef M_PI
#define M_PI 3.1415926f
#endif
lpf_t filters[1];
float inputArray[128];
float dynamicFC[128];
float sr;
static float exp1(float x) { return (6 + x * (6 + x * (3 + x))) * 0.16666666f; }

lpf_t *newLpf(int idx, float cutoff_freq, int sample_rate) {
  lpf_t *l = &filters[idx & 0xff];
  l->m1 = 0;
  l->X = exp1(-2.0f * M_PI * (float)cutoff_freq / sample_rate);
  sr = -2.f * M_PI / sample_rate;
  return l;
}

void process_input(lpf_t *l) {
  l->output = l->input * (1 - l->X) + l->m1 * l->X;
  l->m1 = l->output;
}

void process_LIST(lpf_t *l, int n, float *input, float *fcs) {
  while (n-- > 0) {
    l->X = exp1(*fcs * sr);
    l->input = *input;
    l->m1 = (1 - l->X) * *input + l->X * l->m1;
    *input = l->m1;
    input++;
  }
}
unsigned int struct_size = sizeof(lpf_t);
