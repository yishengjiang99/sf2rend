#ifndef LUT_C
#define LUT_C

#endif
#include <math.h>
#include <stdio.h>
#include <stdlib.h>

void initLUTs(FILE* fd) {
  fprintf(fd,
          "#ifndef lut1200 \n "
          "\t #define lut1200 1\n\n");

  fprintf(fd, "float p2over1200[1201]={ \n");
  for (int i = 0; i < 1200; i++) {
    fprintf(fd, "%f,", powf(2.0f, i / 1200.0f));
  }
  fprintf(fd, "2.0};\n");

  fprintf(fd, "float p10over200[961]={ \n");

  for (int i = -960; i < 0; i++) {
    fprintf(fd, "%f, ", powf(10.0f, i / 200.0));
  }
  fprintf(fd, " 1.0f};\n");

  fprintf(fd, "double midi_log_10[128]={ 1440, \n");
  for (int i = 1; i < 127; i++) {
    fprintf(fd, "%f, ", log10(127.0f * 127.0f / i / i) * 400.0f);
  }
  fprintf(fd, "0.0f };\n");

  fprintf(fd, "double panleftLUT[128]={0.0f,\n");
  for (float i = 2; i < 127; i++) {
    fprintf(fd, "%f, ", log10(cos(M_PI / 2.0 * (i - 1) / 126.0f)) * 200.0f);
  }
  fprintf(fd, "-960}; \n");
  fprintf(fd, "double panrightLUT[128]={-960.0,\n");
  for (float i = 2; i < 127; i++) {
    fprintf(fd, "%f,", log10(sin(M_PI / 2.0 * (i - 1) / 126.0f)) * 200.0f);
  }
  fprintf(fd, "0}; \n");

  fprintf(fd, "#endif");
}
int main() { initLUTs(fopen("src/p1200.h", "w")); }