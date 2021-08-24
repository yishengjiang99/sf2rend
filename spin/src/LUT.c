#ifndef LUT_C
#define LUT_C

#endif
#include <math.h>
#include <stdio.h>
#include <stdlib.h>

void initLUTs(FILE* fd) {
  fprintf(fd, "#ifndef lut1200 \n #define lut1200 1\n\n");
  fprintf(fd, "double p2over1200[1201]={ \n");
  for (int i = 0; i < 1200; i++) {
    fprintf(fd, "%f,", pow(2.0f, i / 1200.0f));
  }
  fprintf(fd, "2.0};\n");

  fprintf(fd, "double p10over200[961]={ \n");

  for (int i = 0; i < 960; i++) {
    fprintf(fd, "%f,\n", pow(10.0f, i / -200.0));
  }
  fprintf(fd, "0.0f};\n");

  fprintf(fd, "double midi_log_10[130]={ \n");
  for (float i = 0.000001; i < 128.001; i++) {
    fprintf(fd, "%f,\n", log(i / 127.0f) * 40.0f * -10);
  }
  fprintf(fd, "0.0}; \n");

  fprintf(fd, "double panleftLUT[128]={\n");
  for (float i = 2; i < 127; i++) {
    fprintf(fd, "%f,\n", log(cos(M_PI / 2.0 * (i - 1) / 126)) * -200);
  }
  fprintf(fd, "1500}; \n");
  fprintf(fd, "double panrightLUT[128]={\n");
  for (float i = 2; i < 127; i++) {
    fprintf(fd, "%f,\n", log(sin(M_PI / 2.0 * (i - 1) / 126)) * -200);
  }
  fprintf(fd, "0}; \n");

  fprintf(fd, "#endif");
}
int main() { initLUTs(fopen("src/p1200.h", "w")); }