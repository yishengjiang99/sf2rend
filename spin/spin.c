
#include <stdint.h>
#include <stdlib.h>
#ifndef M_PI
#define M_PI 3.1415926
#endif
#define emcc_no __attribute__((used))
typedef struct {
  float fc;
  float b1, m1;
} lpf_t;
typedef struct {
  float *inputf, *outputf;
  float fract;
  uint32_t position, loopStart, loopEnd;
  float stride, strideInc;
  float amp, ampInc;
  lpf_t* lpf;
} spinner;

spinner sps[16];
lpf_t lpf[16];
#define RENDQ 128
#define sps_index() (spsIndx++) & 0x0f
float outputs[16 * RENDQ];
float silence[1024 + 32];
char spsIndx = 0;

static float exp1(float x) { return (6 + x * (6 + x * (3 + x))) * 0.16666666f; }

emcc_no void newLpf(lpf_t* l, float fc) {
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
spinner* newSpinner() {
  int idx = sps_index();
  spinner* x = &sps[idx];
  x->outputf = &outputs[idx * RENDQ];
  x->inputf = silence;
  x->fract = 0.0f;
  x->position = 0;
  x->lpf = &lpf[idx];
  newLpf(&lpf[idx], 0.45f);
  return x;
}
void set_float_attrs(spinner* x, float stride, float strideInc, float amp,
                     float ampInc) {
  x->stride = stride;
  x->strideInc = strideInc;
  x->amp = amp;
  x->ampInc = ampInc;
}
void set_attrs(spinner* x, float* inp, uint32_t loopstart, uint32_t loopend) {
  x->loopStart = loopstart;
  x->loopEnd = loopend;
  x->inputf = inp;
  x->position = 0;
  x->fract = 0.0f;
}

void reset(spinner* x) {
  x->position = 0;
  x->fract = 0.0f;
  x->lpf->m1 = 0;
  // x->strideInc = 0.0f;
  // x->stride = 1.0f;
}
float hermite4(float frac_offset, float xm1, float x0, float x1, float x2) {
  const float c = (x1 - xm1) * 0.5f;
  const float v = x0 - x1;
  const float w = c + v;
  const float a = w + v + (x2 - x0) * 0.5f;
  const float b_neg = w + a;

  return ((((a * frac_offset) - b_neg) * frac_offset + c) * frac_offset + x0);
}
float lerp(float f1, float f2, float frac) { return f1 + (f2 - f1) * frac; }
float spin(spinner* x, int n) {
  int position = x->position;
  float fract = x->fract;
  float stride = x->stride;
  float strideInc = x->strideInc;
  int looplen = x->loopEnd - x->loopStart + 1;
  for (int i = 0; i < n; i++) {
    // x->outputf[i] = x->inputf[position++];
    fract = fract + stride;

    while (fract >= 1.0f) {
      position++;
      fract -= 1.0f;
    }

    if (position >= x->loopEnd && x->loopStart != -1) position -= looplen;
    x->outputf[i] = lerp(x->inputf[position], x->inputf[position + 1], fract);
    x->outputf[i] = process_input(x->lpf, x->outputf[i], 0);
    stride += strideInc;
  }
  x->position = position;
  x->fract = fract;
  x->stride = stride;

  return stride;
}
