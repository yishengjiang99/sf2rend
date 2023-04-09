#ifndef SPIN_H
#define SPIN_H
#include "LFO.h"
#include "calc.h"
#include "eg.h"
#include "sf2.h"

typedef enum { SP_AVAIL, sp_NOT_AVAIL } sp_availability;

typedef struct {
  uint32_t loopstart, loopend, length, sampleRate, originalPitch;
  float* data;
} pcm_t;

typedef struct {
  float mod2volume, mod2pitch, mod2filter;
} LFOEffects;
typedef struct {
  float *inputf, *outputf;
  uint32_t channelId, key, velocity;
  uint32_t position, loopStart, loopEnd;
  float fract, stride, calc_pitch_diff_log;
  zone_t* zone;
  EG *voleg, *modeg;
  LFO *modlfo, *vibrlfo;
  pcm_t* pcm;
  sp_availability sp_avail;
  uint32_t sampleLength;
} spinner;

void set_spinner_zone(spinner* x, zone_t* z);
spinner* newSpinner(int idx);
void reset(spinner* x);
int spin(spinner* x, int n);
float* spOutput(spinner* x);

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
