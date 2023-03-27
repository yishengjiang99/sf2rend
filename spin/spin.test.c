#include "spin.c"

#include <assert.h>
#include <math.h>
#include <stdio.h>

#define printvoleg(x)                                                \
  {                                                                  \
    printf("=>increment %f, egval:%f\t nsteps: %d\t stag: %d %d\n",  \
           x->voleg->egIncrement, x->voleg->egval, x->voleg->nsteps, \
           x->voleg->stage, x->position);                            \
  }
z->VolEnvDelay = -21000;
z->VolEnvDecay = -12000;
z->VolEnvAttack = -12100;
set_zone(x, z, SAMPLE_RATE);

int main() {
  spinner* x = newSpinner(0);
  pcms->length = 126815;
  pcms->loopend = 63406;
  pcms->loopstart = 32850;
  pcms->sampleRate = SAMPLE_RATE;
  float data[126815];
  pcms->originalPitch = 56;
  pcms->data = data;

  for (int i = 0; i < 126815; i++) {
    pcms->data[i] = sinf(2 * 3.14 * i * 220);
  }

  zone_t z[1];
  z->VolEnvDelay = -12000;
  z->SampleModes = 0;
  z->VolEnvDecay = 4506;
  z->VolEnvAttack = -8359;
  z->VolEnvHold = -12000;
  z->VolEnvSustain = 1000;
  z->SampleId = 0;
  z->SampleModes = 1;
  z->VolEnvRelease = 814;
  printvoleg(x);
  trigger_attack(x, z, 1.0, 123);

  printvoleg(x);

  for (int i = 0; x->voleg->stage < 5; i++) {
    update_eg(x->voleg, 64);
    _spinblock(x, 64, 0);
    printvoleg(x);
  }
  printf("....");
  eg_release(x);
  for (int i = 0; x->voleg->stage < 6 || i < 1000; i++) {
    update_eg(x->voleg, 4);
    spi(x, 4, 0);
    printvoleg(x);
  }
  return 1;
}