#ifndef SPIN_H
#define SPIN_H
#include "LFO.h"
#include "calc.h"
#include "eg.h"
#include "sf2.h"

typedef enum { SP_AVAIL, sp_NOT_AVAIL } sp_availability;

typedef struct {
  float *inputf, *outputf;
  float fract;
  uint32_t position, loopStart, loopEnd;
  float stride, fpad1;
  uint32_t leftSamp;
  zone_t* zone;
  EG *voleg, *modeg;
  LFO *modlfo, *vibrlfo;
  int channelId, key, velocity;
  sp_availability sp_avail;
} spinner;

typedef struct {
  uint32_t loopstart, loopend, length, sampleRate, originalPitch;
  float* data;
} pcm_t;

typedef struct {
  float mod2volume, mod2pitch, mod2filter;
} LFOEffects;

void set_zone(spinner* x, zone_t* z, unsigned int pcm_sampleRate);
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