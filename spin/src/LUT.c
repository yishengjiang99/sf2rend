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
}
int main() { initLUTs(fopen("./p1200.h", "w")); }