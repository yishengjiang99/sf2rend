#ifndef spin2h
#define spin2h

typedef unsigned short WORD;
typedef unsigned int uint32_t;
typedef unsigned char uint8_t;
typedef unsigned int DWORD;
typedef unsigned char BYTE;
typedef unsigned short uint16_t;

#define RENDQ 128
#define nchannels 64
#define nmidiChannels 16
#include "eg2.h"
typedef struct {
  uint32_t loopstart, loopend, length, sampleRate, originalPitch;
  float *data;
} pcm_t;

typedef struct {
  uint8_t lo, hi;
} rangesType;

typedef struct {
  short StartAddrOfs, EndAddrOfs, StartLoopAddrOfs, EndLoopAddrOfs,
      StartAddrCoarseOfs, ModLFO2Pitch, VibLFO2Pitch, ModEnv2Pitch, FilterFc,
      FilterQ, ModLFO2FilterFc, ModEnv2FilterFc, EndAddrCoarseOfs, ModLFO2Vol,
      Unused1, ChorusSend, ReverbSend, Pan, Unused2, Unused3, Unused4,
      ModLFODelay, ModLFOFreq, VibLFODelay, VibLFOFreq, ModEnvDelay,
      ModEnvAttack, ModEnvHold, ModEnvDecay, ModEnvSustain, ModEnvRelease,
      Key2ModEnvHold, Key2ModEnvDecay, VolEnvDelay, VolEnvAttack, VolEnvHold,
      VolEnvDecay, VolEnvSustain, VolEnvRelease, Key2VolEnvHold,
      Key2VolEnvDecay, Instrument, Reserved1;
  rangesType KeyRange, VelRange;
  short StartLoopAddrCoarseOfs, Keynum, Velocity, Attenuation, Reserved2,
      EndLoopAddrCoarseOfs, CoarseTune, FineTune;
  unsigned short SampleId, SampleModes, Reserved3;
  short ScaleTune, ExclusiveClass, OverrideRootKey, Dummy;
} zone_t;

typedef struct _sp {
  uint32_t channel, key, vel, pad1, pad2;
  float fract, stride;

  float *outputf, *inputf;
  pcm_t *pcm;
  unsigned int position;
  EG voleg, modeg;
  zone_t *zone;
} spinner;

#define defattrs                                                               \
  {                                                                            \
    /*StartAddrOfs:*/ 0, /*EndAddrOfs:*/ 0, /*StartLoopAddrOfs:*/ 0,           \
        /*EndLoopAddrOfs:*/ 0, /*StartAddrCoarseOfs:*/ 0, /*ModLFO2Pitch:*/ 0, \
        /*VibLFO2Pitch:*/ 0, /*ModEnv2Pitch:*/ 0, /*FilterFc:*/ 13500,         \
        /*FilterQ:*/ 0, /*ModLFO2FilterFc:*/ 0, /*ModEnv2FilterFc:*/ 0,        \
        /*EndAddrCoarseOfs:*/ 0, /*ModLFO2Vol:*/ 0, /*Unused1:*/ 0,            \
        /*ChorusSend:*/ 0, /*ReverbSend:*/ 0, /*Pan:*/ 0, /*Unused2:*/ 0,      \
        /*Unused3:*/ 0, /*Unused4:*/ 0, /*ModLFODelay:*/ 0, /*ModLFOFreq:*/ 0, \
        /*VibLFODelay:*/ 0, /*VibLFOFreq:*/ -1133, /*ModEnvDelay:*/ -12000,    \
        /*ModEnvAttack:*/ -12000, /*ModEnvHold:*/ -12000,                      \
        /*ModEnvDecay:*/ -12000, /*ModEnvSustain:*/ 0,                         \
        /*ModEnvRelease:*/ -12000, /*Key2ModEnvHold:*/ 0,                      \
        /*Key2ModEnvDecay:*/ 0, /*VolEnvDelay:*/ -12000,                       \
        /*VolEnvAttack:*/ -12000, /*VolEnvHold:*/ -12000,                      \
        /*VolEnvDecay:*/ -9000, /*VolEnvSustain:*/ 266,                        \
        /*VolEnvRelease:*/ -9000, /*Key2VolEnvHold:*/ 0,                       \
        /*Key2VolEnvDecay:*/ 0, /*Instrument:*/ -1, /*Reserved1:*/ 0,          \
        /*KeyRange:*/ 127 << 8, /*VelRange:*/ 127 << 8,                        \
        /*StartLoopAddrCoarseOfs:*/ 0, /*Keynum:*/ -1, /*Velocity:*/ -1,       \
        /*Attenuation:*/ 0, /*Reserved2:*/ 0, /*EndLoopAddrCoarseOfs:*/ 0,     \
        /*CoarseTune:*/ 0, /*FineTune:*/ 0, /*SampleId:*/ -1,                  \
        /*SampleModes:*/ 1, /*Reserved3:*/ 0, /*ScaleTune:*/ 100,              \
        /*ExclusiveClass:*/ 0, /*OverrideRootKey:*/ -1, /*Dummy:*/ 0           \
  }

#endif  // spin2h
