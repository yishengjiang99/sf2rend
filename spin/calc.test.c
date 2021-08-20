#include "calc.c"

#include <assert.h>
#include <math.h>
#include <stdio.h>
int main() {
  // printf("%f", timecent2second(1200));
  assert(timecent2second(1200) == 2.0f);
  assert(timecent2second(0) == 1.0f);

  assert(timecent2second(-12000) == pow(2.0, -12000 / 1200));
  assert(attack_db_inc(0.0f) - 960.0f / SAMPLE_RATE < 0.001);

  //  printf("\n%.8lx,%.8lx", FloatTo23Bits(.99999f), 2.f);
  printf("\n%f\n", applyCentible(.99990f, -1000));
}