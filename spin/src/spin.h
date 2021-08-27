#ifndef SPIN_H
#define SPIN_H
#include "LFO.h"
#include "calc.h"
#include "eg.h"
#include "lpf.h"
#include "saturate.c"
#include "sf2.h"
typedef struct {
  float *inputf, *outputf;
  float fract;
  uint32_t position, loopStart, loopEnd;
  float stride, fpad1;
  lpf_t* lpf;
  zone_t* zone;
  EG *voleg, *modeg;
  LFO *modlfo, *vibrlfo;
  unsigned char channelId, key, velocity, padc3;
} spinner;

typedef struct {
  uint32_t loopstart, loopend, length;
  float* data;
  uint32_t sampleRate;
  char originalPitch, pitchCorrection, pad1, pad2;
} pcm_t;

typedef struct {
  float mod2volume, mod2pitch, mod2filter;
} LFOEffects;

void set_zone(spinner* x, zone_t* z);
spinner* newSpinner(int idx);
void eg_release(spinner* x);
void reset(spinner* x);
int spin(spinner* x, int n);

// borrowed from tml.h
enum TMLController {
  TML_BANK_SELECT_MSB,
  TML_MODULATIONWHEEL_MSB,
  TML_BREATH_MSB,
  TML_FOOT_MSB = 4,
  TML_PORTAMENTO_TIME_MSB,
  TML_DATA_ENTRY_MSB,
  TML_VOLUME_MSB,
  TML_BALANCE_MSB,
  TML_PAN_MSB = 10,
  TML_EXPRESSION_MSB,
};
#endif