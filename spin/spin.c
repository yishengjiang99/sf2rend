
#include <stdint.h>
#include <stdlib.h>
typedef struct {
  float *inputf, *outputf;
  float fract;
  uint32_t position, loopStart, loopEnd;
} spinner;

spinner* newSpinner(uint32_t size, uint32_t loopstart, uint32_t loopend) {
  spinner* x = malloc(sizeof(spinner));
  x->inputf = malloc(size * sizeof(float));
  x->outputf = malloc(128 * sizeof(float));
  x->fract = 0.0f;
  x->position = 0;
  x->loopStart = loopstart;
  x->loopEnd = loopend;
  return x;
}
void reset(spinner* x) {
  x->position = 1;
  x->fract = 0.0f;
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
float spin(spinner* x, float stride) {
  int position = x->position;
  float fract = x->fract;
  for (int i = 0; i < 128; i++) {
    x->outputf[i] =
        position == 0
            ? lerp(x->inputf[position], x->inputf[position + 1], fract)
            : hermite4(fract, x->inputf[position - 1], x->inputf[position],
                       x->inputf[position + 1], x->inputf[position + 2]);
    fract += stride;

    while (fract >= 1.0f) {
      position++;
      fract--;
    }

    while (position >= x->loopEnd) position -= (x->loopEnd - x->loopStart) + 1;
  }
  x->position = position;
  x->fract = fract;

  return x->fract;
}