#include "src/spin.c"

#include <assert.h>
#include <math.h>
#include <stdio.h>

#define printvoleg(x)                                                    \
  {                                                                      \
    printf("=>increment %f, egval:%f\t %d\t%d\n", x->voleg->egIncrement, \
           x->voleg->egval, x->voleg->nsteps, x->voleg->stage);          \
  }
int main() {
  short defvals[60] = defattrs;
  zone_t* z = (zone_t*)defvals;
  spinner* x = newSpinner(0);

  for (int i = 0; i < 40; i++) {
    x->inputf[i] = sinf(2 * 3.14 * i / 32);
  }
  z->VolEnvDelay = -21000;
  z->VolEnvDecay = -12000;
  z->VolEnvAttack = -12100;
  set_zone(x, z, SAMPLE_RATE);

  printvoleg(x);
  update_eg(x->voleg, 128);
  printf("\t-------%f %f,\n", 48000 * timecent2second(-12000.0f),

         timecent2sample(-12000.0f));

  printvoleg(x);
  update_eg(x->voleg, 128);
  printvoleg(x);
  update_eg(x->voleg, 128);
  printvoleg(x);
  update_eg(x->voleg, 128);
  printvoleg(x);
  update_eg(x->voleg, 128);
  printvoleg(x);
  update_eg(x->voleg, 128);

  eg->nsteps = timecent2sample(eg->attack);
  eg->egIncrement = 960.0f / (float)eg->nsteps;
  printvoleg(x);
  z->VolEnvSustain = 450.0f;
  set_zone(x, z, 4);
  x->stride = 1.0f;
  x->voleg->stage = init;
  update_eg(x->voleg, 1);
  int n = 12;
  while (n-- > 0 && x->voleg->stage <= release) {
    printf("%f,%f", x->voleg->egIncrement, x->voleg->egval);
    printf("\t%d %d,\n", x->voleg->stage, x->voleg->nsteps);

    spin(x, 32);
    for (int i = 0; i < 32; i++) {
      printf("%f,%f\t", x->voleg->egIncrement, x->voleg->egval);

      printf("%f\n", x->outputf[i]);
    }
    printf("%f,%f", x->voleg->egIncrement, x->voleg->egval);
    printf("\t%d %d,\n", x->voleg->stage, x->voleg->nsteps);
  }
  return 1;
}