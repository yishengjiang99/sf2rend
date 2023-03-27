#include <gtest/gtest.h>

#include "src/spin.c"

// Demonstrate some basic assertions.
TEST(HelloTest, BasicAssertions) {
  spinner* x = newSpinner(0);
  for (int i = 0; i < 40; i++) {
    x->inputf[i] = sinf(2 * 3.14 * i / 32);
  }
  spinner* x = newSpinner(0);
  zone_t* z = zone_t z[1];
  z->VolEnvDelay = -12000;
  set_zone(x, z, 3500);
  EXPECT_EQ(x->voleg->stage, 0);
}