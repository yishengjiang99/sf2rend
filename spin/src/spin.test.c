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

short attrs[60] = {
    0,      0,   0,    0,     0,     0,      40,     0,      27000,  -10,
    0,      0,   0,    20,    598,   300,    40,     -1000,  527,    0,
    0,      -2,  -884, -2,    -1200, -10800, -10800, -10800, -10800, 0,
    -10800, 0,   0,    -3969, -3969, -7811,  2400,   960,    1200,   0,
    0,      237, 0,    17664, 32512, 0,      -2,     -2,     0,      0,
    0,      0,   -1,   123,   1,     0,      200,    0,      44,     0};
int main() {
  spinner* x = newSpinner();
  zone_t* z = (zone_t*)attrs;

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