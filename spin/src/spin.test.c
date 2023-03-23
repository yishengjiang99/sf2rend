#include "spin.c"

#include <assert.h>
#include <math.h>
#include <stdio.h>

#define printvoleg(x)                                                    \
  {                                                                      \
    printf("=>increment %f, egval:%f\t %d\t%d\n", x->voleg->egIncrement, \
           x->voleg->egval, x->voleg->nsteps, x->voleg->stage);          \
  }

int main() {
  spinner* x = newSpinner(0);
  for (int i = 0; i < 40; i++) {
    x->inputf[i] = sinf(2 * 3.14 * i / 32);
  }
  zone_t z[1];
  z->VolEnvDelay = -12000;

  z->VolEnvAttack = 0;
  set_zone(x, z, 1);

  printf("%hd, %u\n", z->VolEnvAttack, timecent2sample((z->VolEnvAttack)));
  printvoleg(x);
  for (int i = 0; i < 10; i++) {
    spin(x, 4800);
    printvoleg(x);
  }

  return 1;
}