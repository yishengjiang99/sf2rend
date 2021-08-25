#include "src/spin.c"

#include <assert.h>
#include <math.h>
#include <stdio.h>
int main() {
  short defvals[60] = defattrs;
  zone_t* z = (zone_t*)defvals;
  spinner* x = newSpinner(z, 1);

  for (int i = 0; i < 40; i++) {
    x->inputf[i] = sinf(2 * 3.14 * i / 32);
  }

  printf("%hd, %u\n", z->VolEnvDelay, timecent2sample((z->VolEnvDelay)));
  z->VolEnvDecay = -1200;
  z->VolEnvSustain = 450.0f;
  set_zone(x, z);
  x->stride = 1.0f;
  x->voleg->stage = init;
  update_eg(x->voleg, 1);
  int n = 12;
  while (n-- > 0 && x->voleg->stage <= release) {
    printf("%f,%f", x->voleg->egIncrement, x->voleg->egval);
    printf("\t%d %d,\n", x->voleg->stage, x->voleg->nsamples_till_next_stage);

    spin(x, 32);
    for (int i = 0; i < 32; i++) {
      printf("%f,%f\t", x->voleg->egIncrement, x->voleg->egval);

      printf("%f\n", x->outputf[i]);
    }
    printf("%f,%f", x->voleg->egIncrement, x->voleg->egval);
    printf("\t%d %d,\n", x->voleg->stage, x->voleg->nsamples_till_next_stage);
  }
  return 1;
}