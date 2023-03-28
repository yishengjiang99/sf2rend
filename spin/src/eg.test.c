#include <assert.h>
#include <math.h>
#include <stdio.h>

#include "spin.c"
#include "stbl.c"
#include "test_utils.h"
short zero_att_hold[60] = {
    0,      0,   0,    0,     0,      0,      0,      0,      10216,  0,
    0,      0,   0,    0,     2501,   0,      0,      0,      2060,   0,
    0,      0,   -536, 0,     -1133,  -12000, -12000, -12000, -12000, 0,
    -12000, 0,   0,    1480,  -12000, -12000, 3216,   470,    -2222,  0,
    0,      291, 0,    14080, 15360,  0,      -1,     -1,     -7740,  0,
    0,      -12, 0,    176,   1024,   0,      100,    0,      68,     0};

zone_t* z = (zone_t*)zero_att_hold;

int main() {
  gm_reset();
  spinner* x = newSpinner(0);
  pcms->length = 220;
  pcms->loopend = 4620;
  pcms->loopstart = 4;
  pcms->sampleRate = SAMPLE_RATE;
  float data[46200];
  pcms->originalPitch = 600;
  pcms->data = data;

  printvoleg(x);
  z->SampleModes = 1025;
  z->SampleId = 0;
  set_spinner_zone(x, z);
  print_sp(x);

  trigger_attack(x, .3, 122);
  print_sp(x);
  for (int i = 0; i < 4600; i++) {
    printvoleg(x);
    pcms->data[i] = (float)stbl[i % 1024];
  };

  printvoleg(x);

  for (int i = 0; x->voleg->stage < 2; i++) {
    printf("%d step ", i);
    printvoleg(x);

    spin(x, 128);
  }

  for (int i = 0; x->voleg->stage < sustain; i++) {
    spin(x, 128);

    printvoleg(x);
  }
  printf("releasing");
  spin(x, 128);
  eg_release(x);
  for (int i = 0; x->voleg->stage < done; i++) {
    spin(x, 128);
    printvoleg(x);
  }
  return 1;
  return 0;
}