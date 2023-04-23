#ifndef SPIN_H
#define SPIN_H
#define RENDQ 128
#define nchannels 64
#define nmidiChannels 16
#define MAX_EG -1440.f
#include "LFO.h"
#include "calc.h"
#include "eg.h"
#include "sf2.h"

extern void debugFL(float fl);
float eps = .00001;

typedef struct {
  uint32_t loopstart, loopend, length, sampleRate, originalPitch;
  float* data;
} pcm_t;

typedef struct {
  float mod2volume, mod2pitch, mod2filter;
} LFOEffects;

enum {
  filter_active = 0x01,
  filter_shift_active = 0x11,
  pitch_shift_active = 0x02,
  sustain_active = 0x04,
};
typedef struct {
  float *inputf, *outputf;
  uint32_t channelId, key, velocity;
  uint32_t position, loopStart, loopEnd;
  float fract, stride, pitch_dff_log;
  zone_t* zone;
  EG voleg, modeg;
  LFO modlfo, vibrlfo;
  pcm_t* pcm;
  uint32_t sampleLength;
  uint32_t active_dynamics_flag;
  int is_looping;
} spinner;

void set_spinner_zone(spinner* x, zone_t* z);
spinner* newSpinner(int ch);
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
