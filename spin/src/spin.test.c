
#include "spin.h"

#include <assert.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>

#include "sf2.c"

#define printvoleg(x)                                               \
  {                                                                 \
    printf("=>increment %f, egval:%f\t nsteps: %d\t stag: %d %d\n", \
           x->voleg.egIncrement, x->voleg.egval, x->voleg.nsteps,   \
           x->voleg.stage, x->position);                            \
  }

int main() {
  FILE *f = fopen("assets/file.sf2", "rb");
  char c;
  while ((c = fgetc(f)) != EOF) {
    putchar(c);
  }
}