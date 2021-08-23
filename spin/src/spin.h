#ifndef SPIN_H
#define SPIN_H
#include "calc.h"
#include "eg.h"
#include "lpf.h"
#include "sf2.h"

typedef struct {
  float *inputf, *outputf;
  float fract;
  uint32_t position, loopStart, loopEnd;
  float stride, strideInc;
  lpf_t* lpf;
  zone_t* zone;
  EG *voleg, *modeg;
} spinner;

#endif