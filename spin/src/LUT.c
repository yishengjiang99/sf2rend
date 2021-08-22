#ifndef LUT_C
#define LUT_C

#endif
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
static float p2over1200LUT[1200];
static inline float p2over1200(float x) {
  if (x < -12000) return 0;
  if (x < 0)
    return 1.f / p2over1200(-x);
  else if (x > 1200.0f) {
    return 2 * p2over1200(x - 1200.0f);
  } else {
    return p2over1200LUT[(unsigned short)(x)];
  }
}
static float centdbLUT[960];
static float centdblut(int x) {
  if (x < 0) x = 0;
  if (x > 960) x = 960;

  return centdbLUT[x];
}
void initLUTs(FILE* fd) {
  fprintf(fd, "#ifndef lut1200 \n #define lut1200 1\n\n");
  fprintf(fd, "double p2over1200[1201]={ \n");
  for (int i = 0; i < 1200; i++) {
    fprintf(fd, "%f,", pow(2.0f, i / 1200.0f));
  }
  fprintf(fd, "2.0};\n");

  fprintf(fd, "double p10over200[961]={ \n");

  for (int i = 0; i < 960; i++) {
    fprintf(fd, "%f,\n", powf(10.0f, i / -200.0));
  }
  fprintf(fd, "0.0f};\n");
  fprintf(fd, "#endif");
}
int main() { initLUTs(fopen("src/p1200.h", "w")); }