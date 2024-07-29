#include <assert.h>
#include <math.h>
#include <stdio.h>

#include "spin.c"
#include "test_utils.h"
int main()
{
  EG eg[1];
  eg_init(eg);
  assert(eg->attack == -12000);
  return 0;
}
