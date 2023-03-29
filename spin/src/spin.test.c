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

int main() {
  // spinner* x = &sps[3];
  printf("%p", sps[3].voleg);
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
  z->VolEnvRelease = -3333;
  newSpinner(0);
  printvoleg(x);
  set_spinner_zone(x, z);
  printvoleg(x);

  trigger_attack(x, 88, 20);
  printvoleg(x);

  spinner* y = newSpinner(3);
  printvoleg(x);

  assert(y->channelId == 3);
  assert(y != x);
  set_spinner_zone(x, z);
  printvoleg(x);

  trigger_attack(x, 1.01, 123);

  printvoleg(x);
  spin(x, 128);
  printvoleg(x);
  spin(x, 128);
  printvoleg(x);
  spin(x, 128);
  printvoleg(x);
  for (int i = 0; x->voleg->stage < 5; i++) {
    spin(x, 128);
    printvoleg(x);
    break;
  }
  trigger_release(x);
  for (int i = 0; x->voleg->stage < done; i++) {
    printvoleg(x);

    spin(x, 128);
    if (x->voleg->stage < init) break;
    printvoleg(x);
  }
  return 1;
}