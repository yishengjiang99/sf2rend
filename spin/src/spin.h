
#ifndef SPIN_H
#define SPIN_H
#include "sf2.h"
typedef unsigned char uint8_t;
typedef unsigned short uint16_t;
typedef int int32_t;
typedef short int16_t;
typedef unsigned int uint32_t;

#define RENDQ 128
#define nchannels 64
#define nmidiChannels 16
#define num_cc_list 128
#define MAX_EG -1440.f
#define SAMPLE_RATE 44100.0f

typedef struct {
  uint32_t loopstart, loopend, length, sampleRate, originalPitch;
  float *data;
} pcm_t;

typedef struct {
  float mod2volume, mod2pitch, mod2filter;
} LFOEffects;

typedef struct {
  unsigned short phase, delay;
  unsigned short phaseInc;
} LFO;

enum eg_stages {
  inactive = 0,  //
  init = 1,  // this is for key on message sent and will go next render cycle
  delay = 2,
  attack = 3,
  hold = 4,
  decay = 5,
  sustain = 6,
  release = 7,
  done = 99
};
typedef struct {
  float egval, egIncrement;
  int hasReleased, stage, nsteps;
  short delay, attack, hold, decay, sustain, release, pad1, pad2;
  int progress, progressInc;  // add prog scale to use LUT
} EG;
typedef struct {
  double QInv, a0, a1, b1, b2, z1, z2;
} Biquad;

typedef struct {
  float *inputf, *outputf;
  unsigned char channelId, key, velocity, p1, p2, p3, p4, p5;
  uint32_t position, loopStart, loopEnd;
  float fract, stride, pitch_dff_log;
  zone_t *zone;
  EG voleg, modeg;
  LFO modlfo, vibrlfo;
  Biquad lpf;
  pcm_t *pcm;
  uint32_t sampleLength;
  uint32_t active_dynamics_flag;
  int is_looping;
  float initialFc, initialQ;
  short lfo1_pitch, lfo1_volume, lfo2_pitch, modeg_pitch, modeg_fc, modeg_vol,
      lfo1_fc, pleft, pright;

} spinner;

#if !defined(fp12)
#define fp12
const int scale = 12;
const int fraction_mask = (1 << scale) - 1;
const int whole_mask = -1 ^ fraction_mask;
const double scalar_multiple = (double)(1 << scale);
#define double2fixed(x) (x * scalar_multiple)
inline static double fixed2double(int x) { return x / scalar_multiple; }
#define int2fixed(x) x << scale
#define fixed2int(x) x >> scale
inline static double get_fraction(int x) {
  return fixed2double(x & fraction_mask);
}
#define fixed_floor(x) x >> scale

#endif  // fp12

void set_spinner_zone(spinner *x, zone_t *z);
spinner *new_sp(int ch);
void reset(spinner *x);
int spin(spinner *x, int n);
float *spOutput(spinner *x);

void lpf_set_filter_q(Biquad *lpf, short filterQ);
void lpf_set_frequency(Biquad *lpf, float fc);

float lpf_calc(Biquad *b, double In);

// Midi controller numbers
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
  TML_EFFECTS1_MSB,
  TML_EFFECTS2_MSB,
  TML_GPC1_MSB = 16,
  TML_GPC2_MSB,
  TML_GPC3_MSB,
  TML_GPC4_MSB,
  TML_BANK_SELECT_LSB = 32,
  TML_MODULATIONWHEEL_LSB,
  TML_BREATH_LSB,
  TML_FOOT_LSB = 36,
  TML_PORTAMENTO_TIME_LSB,
  TML_DATA_ENTRY_LSB,
  TML_VOLUME_LSB,
  TML_BALANCE_LSB,
  TML_PAN_LSB = 42,
  TML_EXPRESSION_LSB,
  TML_EFFECTS1_LSB,
  TML_EFFECTS2_LSB,
  TML_GPC1_LSB = 48,
  TML_GPC2_LSB,
  TML_GPC3_LSB,
  TML_GPC4_LSB,
  TML_SUSTAIN_SWITCH = 64,
  TML_PORTAMENTO_SWITCH,
  TML_SOSTENUTO_SWITCH,
  TML_SOFT_PEDAL_SWITCH,
  TML_LEGATO_SWITCH,
  TML_HOLD2_SWITCH,
  TML_SOUND_CTRL1 = 70,
  VCA_ATTACK_TIME = 71,
  VCA_DECAY_TIME = 72,
  VCA_SUSTAIN_LEVEL = 73,
  VCA_RELEASE_TIME = 74,
  VCF_ATTACK_TIME = 75,
  VCF_DECAY_TIME = 76,
  VCF_SUSTAIN_LEVEL = 77,
  VCF_RELEASE_TIME = 78,
  VCF_MOD_PITCH = 79,
  VCF_MOD_FC = 80,
  TML_GPC6,
  TML_GPC7,
  TML_GPC8,
  TML_PORTAMENTO_CTRL,
  TML_FX_REVERB = 91,
  TML_FX_TREMOLO,
  TML_FX_CHORUS,
  TML_FX_CELESTE_DETUNE,
  TML_FX_PHASER,
  TML_DATA_ENTRY_INCR,
  TML_DATA_ENTRY_DECR,
  TML_NRPN_LSB,
  TML_NRPN_MSB,
  TML_RPN_LSB,
  TML_RPN_MSB,
  TML_ALL_SOUND_OFF = 120,
  TML_ALL_CTRL_OFF,
  TML_LOCAL_CONTROL,
  TML_ALL_NOTES_OFF,
  TML_OMNI_OFF,
  TML_OMNI_ON,
  TML_POLY_OFF,
  TML_POLY_ON
};

#endif
