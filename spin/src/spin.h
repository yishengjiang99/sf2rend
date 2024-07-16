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
#define SAMPLE_RATE 44100.0f
#include "calc.h"
#define def_drum_c 9

#define modulo_s16f_inverse 1.0f / 32767.1f
#define modulo_u16f (float)(((1 << 16) + .1f))
extern float tanf(float t);

typedef struct
{
  unsigned short phase, delay;
  unsigned short phaseInc;
} LFO;

float dummy[666]; // backward compact hack

float LFO_roll_out(LFO *lfo, unsigned int n, float *output)
{
  while (n--)
  {
    if (lfo->delay > 0)
    {
      lfo->delay--;
      *output++ = 0.f;
      continue;
    }
    else
    {
      lfo->phase += lfo->phaseInc;
      *output++ = (float)(((short)lfo->phase) * modulo_s16f_inverse);
    }
  }
  return *output;
}

void LFO_set_frequency(LFO *lfo, short ct)
{
  double freq = timecent2hertz(ct);
  lfo->phaseInc = (unsigned short)(modulo_u16f * freq / SAMPLE_RATE);
}

float LFO_roll(LFO *lfo, unsigned int n)
{
  if (lfo->delay > n)
  {
    lfo->delay -= n;
    return 0.0f;
  }
  else
  {
    n -= lfo->delay;
    lfo->delay = 0;
  }
  while (n--)
    lfo->phase += lfo->phaseInc;
  float lfoval = (float)(((short)lfo->phase) * modulo_s16f_inverse);
  return lfoval;
}

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
inline static double get_fraction(int x)
{
  return fixed2double(x & fraction_mask);
}
#define fixed_floor(x) x >> scale

#endif // fp12

enum eg_stages
{
  inactive = 0, //
  init = 1,     // this is for key on message sent and will go next render cycle
  delay = 2,
  attack = 3,
  hold = 4,
  decay = 5,
  sustain = 6,
  release = 7,
  done = 99
};
typedef struct
{
  float egval, egIncrement;
  int hasReleased, stage, nsteps;
  short delay, attack, hold, decay, sustain, release, pad1, pad2;
  int progress, progressInc; // add prog scale to use LUT
} EG;

void advanceStage(EG *eg);
float update_eg(EG *eg, int n);

void eg_roll(EG *eg, int n, float *output)
{
  while (n-- && eg->nsteps--)
  {
    if (eg->stage == attack)
    {
      int lut_index = fixed_floor(eg->progress);
      double frag = get_fraction(eg->progress);
      double f1 = att_db_levels[lut_index], f2 = att_db_levels[lut_index + 1];
      eg->egval = lerpd(f1, f2, frag);
    }
    else
    {
      eg->egval += eg->egIncrement;
    }
    *output++ = eg->egval;
  }
  if (eg->egval > 0)
    eg->egval = 0.0f;
  if (eg->nsteps <= 7)
    advanceStage(eg);
}
/**
 * advances envelope generator by n steps..
 * shift to next stage and advance the remaining n steps
 * if necessary
 *
 */
float update_eg(EG *eg, int n)
{
  while (n--)
  {
    eg->egval += eg->egIncrement;
    eg->nsteps--;
  }
  if (eg->nsteps <= 7)
    advanceStage(eg);
  if (eg->egval > 0)
    eg->egval = 0.0f;
  return eg->egval;
}

void advanceStage(EG *eg)
{
  switch (eg->stage)
  {
  case inactive:
    eg->stage++;
    return;
  case init:
    eg->stage = delay;
    eg->egval = MAX_EG;

    if (eg->delay > -12000)
    {
      eg->egval = MAX_EG;
      eg->nsteps = timecent2sample(eg->delay);
      eg->egIncrement = 0.0f;
      break;
    }
  case delay:
    eg->stage = attack;
    eg->egval = MAX_EG;
    eg->nsteps = timecent2sample(eg->attack);
    eg->progress = double2fixed(0);
    eg->progressInc = double2fixed(255.0 / (double)eg->nsteps);
    break;
  case attack:
    eg->stage = hold;
    eg->egval = 0.0f;
    eg->nsteps = timecent2sample(eg->hold);
    eg->egIncrement = 0.0f;

    break;
  case hold: /** TO DECAY */
    eg->stage = decay;

    if (eg->sustain > 0)
    {
      eg->nsteps = timecent2sample(eg->decay);
      eg->egIncrement = (MAX_EG + eg->sustain / 1000) / eg->nsteps;
    }
    else
    {
      eg->nsteps = 0;
    }
    break;

  case decay: // headsing to released;

    /*
    37 sustainVolEnv This is the decrease in level, expressed in centibels,
    to which the Volume Envelope value ramps during the decay phase. For the
    Volume Envelope, the sustain level is best expressed in centibels of
    attenuation from full scale. A value of 0 indicates the sustain level is
    full level; this implies a zero duration of decay phase regardless of
    decay time. A positive value indicates a decay to the corresponding
    level. Values less than zero are to be interpreted as zero;
    conventionally 1000 indicates full attenuation. For example, a sustain
    level which corresponds to an absolute value 12dB below of peak would be
    120.*/
    eg->stage = sustain;
    eg->egIncrement = 0.0f;
    eg->nsteps = 0xfffff;
    break;

    // sustain = % decreased during decay

  case sustain:
    eg->stage = release;
    int stepsFull =
        timecent2sample(eg->release); //+ timecent2sample(eg->decay);
    eg->egIncrement = MAX_EG / (float)stepsFull;
    eg->nsteps = stepsFull * (eg->egval / MAX_EG);
    break;
  case release:
    // eg->stage = done;
    break;
  case done:
    break;
  }
}

void _eg_release(EG *e)
{
  e->stage = sustain;
  advanceStage(e);
}

void eg_init(EG *e) { e->attack = -12000; }

typedef struct
{
  uint32_t loopstart, loopend, length, sampleRate, originalPitch;
  float *data;
} pcm_t;

typedef struct
{
  float mod2volume, mod2pitch, mod2filter;
} LFOEffects;

typedef struct
{
  uint8_t lo, hi;
} rangesType; //  Four-character code
typedef struct
{
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

enum grntypes
{
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
/* this holds the data required to update samples thru a filter */
typedef struct
{
  double QInv, a0, a1, b1, b2, z1, z2;
} Biquad;

typedef struct
{
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

void set_spinner_zone(spinner *x, zone_t *z);
spinner *newSpinner(int ch);
void reset(spinner *x);
int spin(spinner *x, int n);
float *spOutput(spinner *x);

void scaleTc(EG *eg, unsigned int pcmSampleRate)
{
  float scaleFactor = SAMPLE_RATE / (float)pcmSampleRate;
  eg->attack *= scaleFactor;
  eg->delay *= scaleFactor;
  eg->decay *= scaleFactor;
  eg->release *= scaleFactor;
  eg->hold *= scaleFactor;
}
void init_vol_eg(EG *eg, zone_t *z, unsigned int pcmSampleRate)
{
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
void init_mod_eg(EG *eg, zone_t *z, unsigned int pcmSampleRate)
{
  eg->attack = z->ModEnvAttack;
  eg->delay = z->ModEnvDelay;
  eg->decay = z->ModEnvDecay;
  eg->release = z->ModEnvRelease;
  eg->hold = z->ModEnvHold;
  eg->sustain = z->ModEnvSustain;
}
// Midi controller numbers
enum TMLController
{
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

void new_lpf(Biquad *biq, float fc, float Q)
{
  double K = tanf(3.1415f * fc);
  double KK = K * K;
  double norm = 1 / (1 + K / Q + KK);
  biq->QInv = 1.0 / Q;
  biq->a0 = KK * norm;
  //
  biq->a1 = 2 * biq->a0;
  biq->b1 = 2 * (KK - 1) * norm;
  biq->b2 = (1 - K * biq->QInv + KK) * norm;
}
float calc_lpf(Biquad *b, double In)
{
  double Out = In * b->a0 + b->z1;
  b->z1 = In * b->a1 + b->z2 - b->b1 * Out;
  b->z2 = In * b->a0 - b->b2 * Out;
  return (float)Out;
}

#endif
