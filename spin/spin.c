#define maxPCMLength 3600000

typedef struct {
  float* inputf;
  unsigned int loopStart, loopEnd;
  float *outputf, *stride;
  unsigned int position;
  float fract;
  unsigned int strideHead;
} spinner;

float pcms[maxPCMLength];
float output[16 * 128];
float stride[16 * 256];
spinner spinners[16];
static unsigned int pcmOffset = 0;

float* mallocTable(unsigned int length) {
  float* ret = pcms + pcmOffset;
  pcmOffset += length;
  if (pcmOffset > maxPCMLength) {
    return 0;
  }
  return ret;
}

spinner* initSpinners() {
  for (int i = 0; i < 16; i++) {
    spinner* x = &(spinners[i]);
    x->outputf = output + i * 128;
    x->stride = stride + i * 256;
    for (int j = 0; j < 256; j++) {
      x->stride[j] = 1.001f;
    }
    x->inputf = pcms;
    x->fract = 0.0f;
    x->position = 0;
    x->strideHead = 0x00;
  }
  return spinners;
}

void reset(spinner* x) {
  x->position = 0;
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

void spin(spinner* x) {
  int position = x->position;
  float fract = x->fract;
  float* stride = x->stride + (x->strideHead & 0x00ff);
  for (int i = 0; i < 128; i++) {
    fract += 1.1f;
    while (fract >= 1.0f) {
      position++;
      fract -= 1.0f;
    }
    *(x->outputf + i) = *(x->inputf + position);
    if (position >= x->loopEnd) position -= (x->loopEnd - x->loopStart) + 1;
  }
  x->position = position;
  x->fract = fract;
}