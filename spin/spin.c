
#include <stdint.h>
#include <stdlib.h>
typedef struct {
  float *inputf, *outputf;
  float fract;
  uint32_t position, loopStart, loopEnd;
  float stride, strideInc;
  float amp, ampInc;
} spinner;
float fls[1024 * 1024 * 4];

spinner sps[32];
#define RENDQ 120
#define sps_index() (spsIndx++) & 0x1f
float outputs[16 * RENDQ];
float silence[1024 + 32];
unsigned long brk = 0;
char spsIndx = 0;
float* alloc_ftb(unsigned long flsize) {
  float* ret = &fls[brk];
  brk += flsize;
  return ret;
}
spinner* newSpinner() {
  int idx = sps_index();
  spinner* x = &sps[idx];
  x->outputf = &outputs[idx * RENDQ];
  x->inputf = silence;
  x->fract = 0.0f;
  x->position = 0;

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
}
void reset(spinner* x) {
  x->position = 0;
  x->fract = 0.0f;
  x->strideInc = 0.0f;
  x->stride = 1.0f;
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
  for (int i = 0; i < n; i++) {
    x->outputf[i] = x->inputf[position++];
    fract = fract + stride;

    while (fract >= 1.0f) {
      position++;
      fract -= 1.0f;
    }

    if (position >= x->loopEnd) position = x->loopStart;
    //   x->outputf[i] = x->inputf[position];  // lerp(x->inputf[position],
    // x->inputf[position + 1], fract);
    // stride += strideInc;
  }
  x->position = position;
  x->fract = fract;
  x->stride = stride;

  return x->fract;
}