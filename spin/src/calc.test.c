#include <assert.h>
#include <math.h>
#include <stdio.h>

#include "spin.h"

#define assert_close(x, y) assert(fabs(x - y) < .01)
int main() {
  for (int i = -1245; i < 7776; i += 12) {
    printf("\n%f %f %d", calcp2over1200(i), powf(2, i / 1200.f), i);
  }
  // assert_close(calcp2over200(1200), powf(2, 1200));
  printf("%f %f ", calcp2over1200(1200), powf(2, 1200));
  assert_close(calcp2over1200(0), 1);
  assert_close(calcp2over1200(2400), 4.0f);
  assert_close(calcp2over1200(-1200), .5f);
  printf("\n%f", midi_volume_log10(12));
  printf("\n%f", midi_volume_log10(55));
  printf("\n%f", midi_volume_log10(34));
  printf("\n%f", midi_volume_log10(33));
  printf("\n%f", midi_volume_log10(11));
}