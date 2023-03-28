#include <assert.h>
#include <math.h>
#include <stdio.h>

#include "spin.c"
#include "stbl.c"
short zero_att_hold[60] = {
    0,      0,   0,    0,     0,      0,      0,      0,      10216,  0,
    0,      0,   0,    0,     2501,   0,      0,      0,      2060,   0,
    0,      0,   -536, 0,     -1133,  -12000, -12000, -12000, -12000, 0,
    -12000, 0,   0,    1480,  -12000, -12000, 3216,   470,    -8784,  0,
    0,      291, 0,    14080, 15360,  0,      -1,     -1,     -7740,  0,
    0,      -12, 0,    176,   1,      0,      100,    0,      68,     0};

#define printvoleg(x)                                                \
  {                                                                  \
    printf("=>increment %f, egval:%f\t nsteps: %d\t stag: %d %d\n",  \
           x->voleg->egIncrement, x->voleg->egval, x->voleg->nsteps, \
           x->voleg->stage, x->position);                            \
  }

zone_t* z = (zone_t*)zero_att_hold;

int main() {
  reset(0);
  spinner* x = newSpinner(0);
  pcms->length = 220;
  pcms->loopend = 4620;
  pcms->loopstart = 4;
  pcms->sampleRate = SAMPLE_RATE;
  float data[46200];
  pcms->originalPitch = 600;
  pcms->data = data;
  printvoleg(x);

  for (int i = 0; i < 4600; i++) {
    printvoleg(x);
    pcms->data[i] = (float)stbl[i % 1024];
  };

  printvoleg(x);
  trigger_attack(x, z, 1.0, w);

  printvoleg(x);

  for (int i = 0; x->voleg->stage < 2; i++) {
    printvoleg(x);
  }
  printf("a");
  for (int i = 0; x->voleg->nsteps > 0 && x->voleg->stage < done; i++) {
    spin(x, 128);
    if (x->voleg->stage < init) break;
    printvoleg(x);
  }
  return 1;
  return 0;
}