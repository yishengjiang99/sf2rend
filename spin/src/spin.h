#include <stdint.h>

#include "calc.h"
#include "lpf.h"
#include "sf2.h"
enum eg_stages { init = 0, delay, attack, hold, decay, release, done };
typedef struct {
  uint32_t stage, nsamples_till_next_stage;
  double egval, egIncrement;
} EG;

typedef struct {
  float *inputf, *outputf;
  float fract;
  uint32_t position, loopStart, loopEnd;
  float stride, strideInc;
  lpf_t* lpf;
  zone_t* zone;
  EG *voleg, *modeg;
} spinner;
