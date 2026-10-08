// lpf.test.c: native smoke test for biquad.c, the source of lpf.wasm.
//
// Rewritten 2026-10-08: the old test called get_omega(), which no longer
// exists in biquad.c. This exercises the setLPF/BiQuad API that the wasm
// module exports (see lpf/lpf-proc.js).
#include <assert.h>
#include <math.h>
#include <stdio.h>

#include "biquad.c"

int main() {
  // omega is radians/sample, as the worklet passes it (see lpf-proc.js).
  const float omega1k = 2.0f * (float)M_PI * 1000.0f / 48000.0f;
  biquad *f = setLPF(omega1k, 1.0f);
  assert(f != NULL);
  assert(isfinite(f->a0) && f->a0 != 0.0f);

  // Impulse response of a low-pass must be finite and decay.
  float first = BiQuad(1.0f);
  assert(isfinite(first));
  float last = first;
  for (int i = 0; i < 480; i++) last = BiQuad(0.0f);
  assert(isfinite(last));
  assert(fabsf(last) < fabsf(first));

  // Reconfiguring with the same coefficients reproduces the same output.
  setLPF(omega1k, 1.0f);
  assert(fabsf(BiQuad(1.0f) - first) < 1e-6f);

  // DC passes (low-pass): step response converges to unity gain.
  setLPF(2.0f * (float)M_PI * 100.0f / 48000.0f, 1.0f);
  float dc = 0.0f;
  for (int i = 0; i < 6000; i++) dc = BiQuad(1.0f);
  assert(isfinite(dc) && fabsf(dc - 1.0f) < 0.05f);

  printf("lpf ok\n");
  return 0;
}
