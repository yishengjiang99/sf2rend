#include <stdio.h>

#include "fix_point_12.h"
#include "spin.h"

int main() {
  int att = -9000;
  int nsmpl = timecent2sample(att);
  int position = double2fixed(0.0);
  int pinc = double2fixed((255) / (double)nsmpl);
  while (nsmpl--) {
    position += pinc;
    printf("%f \t %d\n", get_fraction(position), floor(position));
  }
  return 0;
}