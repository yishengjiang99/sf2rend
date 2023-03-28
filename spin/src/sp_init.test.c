#include <assert.h>
#include <stdio.h>
#include <stdlib.h>

#include "pdta.c"
#include "spin.c"
#include "test_utils.h"

int main() {
  short zero_att_hold[60] = {
      0,      0,   0,    0,     0,      0,      0,      0,      10216,  0,
      0,      0,   0,    0,     2501,   0,      0,      0,      2060,   0,
      0,      0,   -536, 0,     -1133,  -12000, -12000, -12000, -12000, 0,
      -12000, 0,   0,    1480,  -12000, -12000, 3216,   470,    -8784,  0,
      0,      291, 0,    14080, 15360,  0,      -1,     -1,     -7740,  0,
      0,      -12, 0,    176,   1,      0,      100,    0,      68,     0};
  gm_reset();
  zone_t* z = (zone_t*)zero_att_hold;
  z->VolEnvHold = -12000;

  printf("%d, %d", z->SampleId, z->SampleModes);
  z->SampleModes = 1024 + 1;
  z->SampleId = 0;
  spinner* x = newSpinner(0);
  set_spinner_zone(x, (zone_t*)zero_att_hold);
  assert(x->loopEnd == 1024);

#define print_fl_arr(fl, n)                \
  {                                        \
    int i = n;                             \
    while (i-- > 0) printf("%f\n", *fl++); \
  }
  spin(x, 128);

  trigger_attack(x, 0.231, 120);

  printvoleg(x);
  spin(x, 55);
  print_sp(x);

  assert(x->inputf != NULL);
}