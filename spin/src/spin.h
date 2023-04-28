#ifndef SPIN_H
#define SPIN_H
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
#include "LFO.h"
#include "calc.h"
#include "eg.h"
typedef struct {
  uint32_t loopstart, loopend, length, sampleRate, originalPitch;
  float* data;
} pcm_t;

typedef struct {
  float mod2volume, mod2pitch, mod2filter;
} LFOEffects;

typedef struct {
  uint8_t lo, hi;
} rangesType;  //  Four-character code
typedef struct {
  unsigned short StartAddrOfs, EndAddrOfs, StartLoopAddrOfs, EndLoopAddrOfs,
      StartAddrCoarseOfs;
  short ModLFO2Pitch, VibLFO2Pitch, ModEnv2Pitch, FilterFc, FilterQ,
      ModLFO2FilterFc, ModEnv2FilterFc, EndAddrCoarseOfs, ModLFO2Vol, Unused1,
      ChorusSend, ReverbSend, Pan, Unused2, Unused3, Unused4, ModLFODelay,
      ModLFOFreq, VibLFODelay, VibLFOFreq, ModEnvDelay, ModEnvAttack,
      ModEnvHold, ModEnvDecay, ModEnvSustain, ModEnvRelease, Key2ModEnvHold,
      Key2ModEnvDecay, VolEnvDelay, VolEnvAttack, VolEnvHold, VolEnvDecay,
      VolEnvSustain, VolEnvRelease, Key2VolEnvHold, Key2VolEnvDecay, Instrument,
      Reserved1;
  rangesType KeyRange, VelRange;
  unsigned short StartLoopAddrCoarseOfs;
  short Keynum, Velocity, Attenuation, Reserved2;
  unsigned short EndLoopAddrCoarseOfs, CoarseTune;
  short FineTune, SampleId, SampleModes, Reserved3, ScaleTune, ExclusiveClass,
      OverrideRootKey, Dummy;
} zone_t;

enum grntypes {
  StartAddrOfs,
  EndAddrOfs,
  StartLoopAddrOfs,
  EndLoopAddrOfs,
  StartAddrCoarseOfs,
  ModLFO2Pitch,
  VibLFO2Pitch,
  ModEnv2Pitch,
  FilterFc,
  FilterQ,
  ModLFO2FilterFc,
  ModEnv2FilterFc,
  EndAddrCoarseOfs,
  ModLFO2Vol,
  Unused1,
  ChorusSend,
  ReverbSend,
  Pan,
  Unused2,
  Unused3,
  Unused4,
  ModLFODelay,
  ModLFOFreq,
  VibLFODelay,
  VibLFOFreq,
  ModEnvDelay,
  ModEnvAttack,
  ModEnvHold,
  ModEnvDecay,
  ModEnvSustain,
  ModEnvRelease,
  Key2ModEnvHold,
  Key2ModEnvDecay,
  VolEnvDelay,
  VolEnvAttack,
  VolEnvHold,
  VolEnvDecay,
  VolEnvSustain,
  VolEnvRelease,
  Key2VolEnvHold,
  Key2VolEnvDecay,
  Instrument,
  Reserved1,
  KeyRange,
  VelRange,
  StartLoopAddrCoarseOfs,
  Keynum,
  Velocity,
  Attenuation,
  Reserved2,
  EndLoopAddrCoarseOfs,
  CoarseTune,
  FineTune,
  SampleId,
  SampleModes,
  Reserved3,
  ScaleTune,
  ExclusiveClass,
  OverrideRootKey,
  Dummy
};

typedef struct {
  float *inputf, *outputf;
  unsigned char channelId, key, velocity, p1, p2, p3, p4, p5;
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

void scaleTc(EG* eg, unsigned int pcmSampleRate) {
  float scaleFactor = SAMPLE_RATE / (float)pcmSampleRate;
  eg->attack *= scaleFactor;
  eg->delay *= scaleFactor;
  eg->decay *= scaleFactor;
  eg->release *= scaleFactor;
  eg->hold *= scaleFactor;
}
void init_vol_eg(EG* eg, zone_t* z, unsigned int pcmSampleRate) {
  float scaleFactor = SAMPLE_RATE / (float)pcmSampleRate;
  eg->attack = z->VolEnvAttack * scaleFactor;
  eg->delay = z->VolEnvDelay * scaleFactor;
  eg->decay = z->VolEnvDecay * scaleFactor;
  eg->release = z->VolEnvRelease * scaleFactor;
  eg->hold = z->VolEnvHold * scaleFactor;
  eg->sustain = z->VolEnvSustain * scaleFactor;
  eg->stage = init;
  eg->nsteps = 0;
}
void init_mod_eg(EG* eg, zone_t* z, unsigned int pcmSampleRate) {
  eg->attack = z->ModEnvAttack;
  eg->delay = z->ModEnvDelay;
  eg->decay = z->ModEnvDecay;
  eg->release = z->ModEnvRelease;
  eg->hold = z->ModEnvHold;
  eg->sustain = z->ModEnvSustain;
}
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
  VCF_RESONANCE,  // Voltage Controlled Filter (VCF).
  VCA_RELEASE_TIME,
  VCA_ATTACK_TIME = 73,
  VCF_CUTOFF_FREQUENCY,
  VCA_SUSTAIN_LEVEL,
  TML_SOUND_CTRL6,
  TML_SOUND_CTRL7,
  TML_SOUND_CTRL8,
  TML_SOUND_CTRL9,
  TML_SOUND_CTRL10,
  VCA_DECAY_TIME = 80,
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
