#include "../spin.h"
#include "../spin.c"

spinner* gen_test_zone() {
  spinner* x = newSpinner(0);
  for (int i = 0; i < 40; i++) {
    x->inputf[i] = sinf(2 * 3.14 * i / 32);
  }
	return x;
}