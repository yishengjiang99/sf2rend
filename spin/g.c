
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#define fractmask 0xffff0000

#define doubleNorm 4294967296.0
#define n16inv 1.0f / 255.f / 255.f
#define get_index(phase) (uint64_t)(phase >> 32)
#define get_fraction(phase) (float)(((phase & fractmask) >> 16) * n16inv)

#define phase_inc(ratio)        \
  (((uint64_t)(ratio)) << 32) | \
      (uint32_t)(((double)(ratio) - (int)(ratio)) * (double)doubleNorm)

#define spin(r, phase) phase += phase_inc(r)

#define print(phase, r, lab)                                                   \
  printf("%s %llu %llu %llu %f\n", lab, phase, phase_inc(r), get_index(phase), \
         get_fraction(phase))

#include <math.h>
int main() {
  float input[3220];
  for (int i = 0; i < 3220; i++)
    input[i] = (i - 1000.0f - i / 1000 * i / 1000) / 1000.f *
               sinf(2 * (i % 300) * M_PI_2 / 300.f);
  uint64_t phase = 0;
  float r = 300.0 / 4096.0;
  double val;
  double fv[10][128];
  int frame_time_stamps[10];
  int frameIndex = 0;
  char label[10];
  for (int i = 0; i < 128; i++) {
    spin(r, phase);
    print(phase, r, "index");
    int index = get_index(phase);
    float f1 = input[index];
    float f2 = input[index + 1];
    val = f1 + (f2 - f1) * get_fraction(phase);
    fv[frameIndex][i] = val;

    printf("%f\n", val);
  }
}
