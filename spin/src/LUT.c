#ifndef LUT_C
#define LUT_C

#endif
#include <math.h>
#include <stdio.h>
#include <stdlib.h>

void initLUTs(FILE* fd) {
  fprintf(fd,
          "#ifndef lut1200 \n "
          " #define lut1200 1\n\n");

  fprintf(fd, "double p2over1200[1201]={ \n");
  for (int i = 0; i < 1200; i++) {
    if (i % 7 == 6) fprintf(fd, "\n");
    fprintf(fd, " %f,", pow(2.0f, i / 1200.0f));
  }
  fprintf(fd, "2.0};\n");

  fprintf(fd, "double p10over200[962]={ \n");

  for (int i = -961; i < 0; i++) {
    fprintf(fd, "%f, ", pow(10.0f, i / 200.0));
  }
  fprintf(fd, "1.0};\n\n");
  fprintf(fd, "#endif");
}
void init_m_fals(FILE* fd) {
  fprintf(fd, "double midi_log_10[129]={ -960.f,");
  for (int i = 1; i < 128; i++) {
    fprintf(fd, "%f, ", -200 * log10((127 * 127) / (i * i)));
  }
  fprintf(fd, "0.0f }; \n");

  fprintf(fd, "double panleftLUT[128]={\n 0.f,");
  for (float i = 2; i < 127; i++) {
    fprintf(fd, "%f, ", log10(cos(M_PI / 2.0 * (i - 1) / 126.0f)) * 200.0f);
  }
  fprintf(fd, "-960}; \n");
  fprintf(fd, "double panrightLUT[128]={-960.0,\n");
  for (float i = 2; i < 127; i++) {
    fprintf(fd, "%f,", log10(sin(M_PI / 2.0 * (i - 1) / 126.0f)) * 200.0f);
  }
  fprintf(fd, "0}; \n");
}

int main() {
  initLUTs(fopen("src/p1200.h", "w"));
  init_m_fals(fopen("src/midi_normalized.h", "w"));
  return 1;
}