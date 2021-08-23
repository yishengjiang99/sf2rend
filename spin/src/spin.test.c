#include "spin.c"

#include <assert.h>
#include <math.h>
#include <stdio.h>

#define printvoleg(x)                                           \
  {                                                             \
    printf("=>%f, egval:%f\t %d\t%d\n", x->voleg->egIncrement,  \
           x->voleg->egval, x->voleg->nsamples_till_next_stage, \
           x->voleg->stage);                                    \
  }

int main() {
  zone_t* z = (zone_t*)aZone;
  spinner* x = newSpinner(z, 0);

  for (int i = 0; i < 40; i++) {
    x->inputf[i] = sinf(2 * 3.14 * i / 32);
  }

  printf("%hd, %u\n", z->VolEnvDelay, timecent2sample((z->VolEnvDelay)));
  z->VolEnvDecay = -1200;
  z->VolEnvSustain = 450.0f;
  set_attrs(x, x->inputf, 9, 32, z, 1.0);
  int n = 123;
  reset(x);
  update_eg(eg, 4390);
  update_eg(eg, 69);

  spin(x, 2);
  printvoleg(x);
  _eg_set_stage(eg, decay);
  printvoleg(x);
  printf("%d", timecent2sample(x->voleg->decay));
  for (int i = 0; i < 100; i++) {
    update_eg(x->voleg, 342);
    printvoleg(x);
  }
  return 1;
  while (n-- > 0 && x->voleg->stage <= hold) {
    printf("%f,%f", x->voleg->egIncrement, x->voleg->egval);
    printf("\t%d %d,\n", x->voleg->stage, x->voleg->nsamples_till_next_stage);

    spin(x, 128);
    for (int i = 0; i < 32; i++) {
      printf("=>%d %f, egval:%f\t", n, x->voleg->egIncrement, x->voleg->egval);

      printf("%f %d\n", x->outputf[i], x->voleg->stage);
    }
    printf("%f,%f", x->voleg->egIncrement, x->voleg->egval);
    printf("%d %d,\n", x->voleg->stage, x->voleg->nsamples_till_next_stage);
  }
  return 1;
}