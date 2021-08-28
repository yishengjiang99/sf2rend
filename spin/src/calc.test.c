#include "calc.h"

#include <assert.h>
#include <math.h>
#include <stdio.h>
int main() {
  for (int i = -960; i < 0; i++) {
    printf("%f %i %f \n", powf(10.0f, i / 200.0f), i, .1f);
  }

  for (int i = 1; i < 128; i++) {
    printf("%f, \\%d \n", log10(127.0f * 127.0f / i / i) * 200.0f, i);
  }
}