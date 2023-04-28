#include "eg.h"

#include <assert.h>
#include <math.h>
#include <stdio.h>

#include "test_utils.h"
int main() {
  EG eg[1];
  eg_init(eg);
  assert(eg->attack == -12000);
  return 0;
}
