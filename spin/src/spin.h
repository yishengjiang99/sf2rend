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
/* Runtime sample rate (set from the AudioContext via set_sample_rate);
 * defaults to 44100 until the worklet reports the real rate. */
extern float SAMPLE_RATE;
void set_sample_rate(float sr);
#include "calc.h"
#define def_drum_c 9

#define modulo_s16f_inverse 1.0f / 32767.1f
#define modulo_u16f (float)(((1 << 16) + .1f))
extern float tanf(float t);
extern float log2f(float t);

typedef struct {
  unsigned short phase, delay;
  unsigned short phaseInc;
} LFO;

float dummy[666];  // backward compact hack

float LFO_roll_out(LFO* lfo, unsigned int n, float* output) {
  while (n--) {
    if (lfo->delay > 0) {
      lfo->delay--;
      *output++ = 0.f;
      continue;
    } else {
      lfo->phase += lfo->phaseInc;
      *output++ = (float)(((short)lfo->phase) * modulo_s16f_inverse);
    }
  }
  return *output;
}

void set_frequency(LFO* lfo, short ct) {
  double freq = timecent2hertz(ct);
  lfo->phaseInc = (unsigned short)(modulo_u16f * freq / SAMPLE_RATE);
}
float centdb_val(LFO* lfo) { return (1 - lfo->phase) * 0.5; }

float roll(LFO* lfo, unsigned int n) {
  if (lfo->delay > n) {
    lfo->delay -= n;
    return 0.0f;
  } else {
    n -= lfo->delay;
    lfo->delay = 0;
  }
  while (n--) lfo->phase += lfo->phaseInc;
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
inline static double get_fraction(int x) {
  return fixed2double(x & fraction_mask);
}
#define fixed_floor(x) x >> scale

#endif  // fp12

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
  int is_mod;                 // 1 = modulation envelope (0..1 scale), 0 = volume (cB)
} EG;

void advanceStage(EG* eg);
float update_eg(EG* eg, int n);

/*
 * Roll one envelope forward n samples, always filling all n outputs.
 * Attack uses the att_db_levels LUT (volume) or a linear 0..1 ramp (mod).
 * Stages advance inside the loop so no stale samples are left behind.
 */
void eg_roll(EG* eg, int n, float* output) {
  for (int i = 0; i < n; i++) {
    /* Skip zero-length stages so a stage that is entered with nsteps == 0
     * never applies a stray increment before advancing. */
    while (eg->nsteps <= 0 && eg->stage != done && eg->stage != inactive) {
      int prev = eg->stage;
      advanceStage(eg);
      if (eg->stage == prev) break;
    }
    if (eg->stage == done || eg->stage == inactive) {
      eg->egval = eg->is_mod ? 0.0f : MAX_EG;
    } else if (eg->stage == attack) {
      eg->progress += eg->progressInc;
      if (eg->is_mod) {
        double p = fixed2double(eg->progress) / 255.0;
        if (p < 0) p = 0;
        if (p > 1) p = 1;
        eg->egval = (float)p;
      } else {
        int lut_index = fixed_floor(eg->progress);
        if (lut_index < 0) lut_index = 0;
        if (lut_index > 254) lut_index = 254;
        double frag = get_fraction(eg->progress);
        if (frag < 0) frag = 0;
        if (frag > 1) frag = 1;
        eg->egval =
            lerpd(att_db_levels[lut_index], att_db_levels[lut_index + 1], frag);
      }
      eg->nsteps--;
    } else {
      eg->egval += eg->egIncrement;
      eg->nsteps--;
    }
    if (eg->is_mod) {
      if (eg->egval < 0) eg->egval = 0;
      if (eg->egval > 1) eg->egval = 1;
    } else {
      if (eg->egval > 0) eg->egval = 0.0f;
      if (eg->egval < MAX_EG) eg->egval = MAX_EG;
    }
    output[i] = eg->egval;
  }
}
/**
 * advances envelope generator by n steps..
 * shift to next stage and advance the remaining n steps
 * if necessary
 *
 */
float update_eg(EG* eg, int n) {
  while (n--) {
    eg->egval += eg->egIncrement;
    eg->nsteps--;
  }
  if (eg->nsteps <= 7) advanceStage(eg);
  if (!eg->is_mod) {
    if (eg->egval > 0) eg->egval = 0.0f;
    if (eg->egval < MAX_EG) eg->egval = MAX_EG;
  }
  return eg->egval;
}

/*
 * Move to the next stage and initialize its increment / step count.
 * Volume envelope works in centibels (0..MAX_EG); the mod envelope is
 * normalized 0..1 (sustain in 0.1% units per the SF2 spec).
 * Decay ramps toward the sustain level and stops; sustain holds
 * indefinitely (nsteps = INT_MAX) until _eg_release moves to release.
 */
void advanceStage(EG* eg) {
  int isMod = eg->is_mod;
  switch (eg->stage) {
    case inactive:
      eg->stage = init;
      return;
    case init:
      eg->stage = delay;
      if (eg->delay > -12000) {
        eg->egval = isMod ? 0.0f : MAX_EG;
        eg->nsteps = timecent2sample(eg->delay);
        eg->egIncrement = 0.0f;
        break;
      }
    /* fallthrough: no delay stage */
    case delay:
      eg->stage = attack;
      if (eg->attack > -12000) {
        eg->egval = isMod ? 0.0f : MAX_EG;
        eg->nsteps = timecent2sample(eg->attack);
        if (eg->nsteps < 1) eg->nsteps = 1;
        eg->progress = double2fixed(0);
        eg->progressInc = double2fixed(255.0 / (double)eg->nsteps);
        eg->egIncrement = 0.0f;
        break;
      }
    /* fallthrough: no attack stage */
    case attack:
      eg->stage = hold;
      eg->egval = isMod ? 1.0f : 0.0f;
      eg->nsteps = timecent2sample(eg->hold);
      eg->egIncrement = 0.0f;
      break;
    case hold: /** TO DECAY */
      eg->stage = decay;
      /*
       * Decay/release times are for a 100% change, so nsteps is the fraction
       * of the full time needed to reach the sustain level; the increment is
       * derived from nsteps so the stage lands exactly on target.
       */
      if (isMod) {
        float sus = eg->sustain / 1000.0f; /* 0.1% units -> 0..1 */
        if (sus < 0) sus = 0;
        if (sus > 1) sus = 1;
        int full = timecent2sample(eg->decay);
        if (full < 1) full = 1;
        eg->nsteps = (int)(full * (1.0f - sus));
        eg->egIncrement =
            eg->nsteps > 0 ? -(1.0f - sus) / (float)eg->nsteps : 0.0f;
      } else {
        float susAtt = (float)eg->sustain; /* cB attenuation, 0..1440 */
        if (susAtt < 0) susAtt = 0;
        if (susAtt > 1440) susAtt = 1440;
        int full = timecent2sample(eg->decay);
        if (full < 1) full = 1;
        eg->nsteps = (int)(full * (susAtt / 1440.0f));
        eg->egIncrement = eg->nsteps > 0 ? -susAtt / (float)eg->nsteps : 0.0f;
      }
      break;

    case decay: /* reached sustain level: hold indefinitely */
      eg->stage = sustain;
      eg->egIncrement = 0.0f;
      eg->nsteps = 2147483647;
      break;

    case sustain: /* re-hold (e.g. after a sustain-level glide) */
      eg->stage = sustain;
      eg->egIncrement = 0.0f;
      eg->nsteps = 2147483647;
      break;
    case release:
      eg->stage = done;
      eg->egIncrement = 0.0f;
      eg->nsteps = 0;
      break;
    case done:
      break;
  }
}

void _eg_release(EG* e) {
  if (e->stage == done || e->stage == inactive) return;
  e->hasReleased = 1;
  e->stage = release;
  if (e->is_mod) {
    int full = timecent2sample(e->release);
    if (full < 1) full = 1;
    float cur = e->egval;
    if (cur < 0) cur = 0;
    if (cur > 1) cur = 1;
    e->nsteps = (int)(full * cur);
    e->egIncrement = e->nsteps > 0 ? -cur / (float)e->nsteps : 0.0f;
  } else {
    int full = timecent2sample(e->release);
    if (full < 1) full = 1;
    float cur = e->egval;
    if (cur > 0) cur = 0;
    if (cur < MAX_EG) cur = MAX_EG;
    e->nsteps = (int)(full * (1.0f - cur / MAX_EG));
    e->egIncrement =
        e->nsteps > 0 ? (MAX_EG - cur) / (float)e->nsteps : 0.0f;
  }
  if (e->nsteps < 1) {
    e->stage = done;
    e->nsteps = 0;
  }
}

void eg_init(EG* e) { e->attack = -12000; }

typedef struct {
  uint32_t loopstart, loopend, length, sampleRate;
  int originalPitch, pitchCorrection;
  float* data;
} pcm_t;

typedef struct {
  float mod2volume, mod2pitch, mod2filter;
} LFOEffects;

typedef struct {
  uint8_t lo, hi;
} rangesType;  //  Four-character code
typedef struct {
  short StartAddrOfs, EndAddrOfs, StartLoopAddrOfs, EndLoopAddrOfs,
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
  short StartLoopAddrCoarseOfs;
  short Keynum, Velocity, Attenuation, Reserved2;
  short EndLoopAddrCoarseOfs;
  short CoarseTune, FineTune, SampleId, SampleModes, Reserved3, ScaleTune,
      ExclusiveClass, OverrideRootKey, Dummy;
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
/* this holds the data required to update samples thru a filter */
typedef struct {
  double QInv, a0, a1, b1, b2, z1, z2;
} Biquad;

typedef struct {
  /* NOTE: the field order up to `pcm` is read by spin-structs.js; do not
   * reorder. New fields must be appended after `pright`. */
  float *inputf, *outputf;
  unsigned char channelId, key, velocity, p1, p2, p3, p4, p5;
  uint32_t position, loopStart, loopEnd;
  float fract, stride, pitch_dff_log;
  zone_t* zone;
  EG voleg, modeg;
  LFO modlfo, vibrlfo;
  Biquad lpf;
  pcm_t* pcm;
  uint32_t sampleLength;
  uint32_t active_dynamics_flag;
  int is_looping;
  /* --- appended fields (private to C) --- */
  float lfo1_pitch_c;  /* ModLFO2Pitch, cents */
  float lfo1_vol_cb;   /* ModLFO2Vol, centibels */
  float lfo2_pitch_c;  /* VibLFO2Pitch, cents */
  float modeg_pitch_c; /* ModEnv2Pitch, cents */
  float modeg_fc_c;    /* ModEnv2FilterFc, cents */
  float lfo1_fc_c;     /* ModLFO2FilterFc, cents */
  float filter_fc_cents; /* effective FilterFc, absolute cents */
  float filter_q_linear;
  int exclusiveClass;
  int preset_id;
  int zone_ref;
  int active; /* 1 = slot in use */
} spinner;

void set_spinner_zone(spinner* x, zone_t* z);
spinner* newSpinner(int ch);
spinner* alloc_voice(int ch);
void free_voice(spinner* x);
int sp_active(spinner* x);
void reset(spinner* x);
void reset_tables(void);
int spin(spinner* x, int n);
float* spOutput(spinner* x);

/* Per-channel generator overrides (inspector sliders / zone editor).
 * mode 0 = untouched (zone value), 1 = relative offset added to the zone
 * value (SF2 "relative" semantics), 2 = absolute override. */
void set_channel_gen(int ch, int gen, short value);
void clear_channel_gen(int ch, int gen);
short effective_gen(spinner* x, int gen);
short voice_gen(spinner* x, int gen);
spinner* sp_for_channel(int ch);
void voice_refresh_zone(spinner* x);
void ch_set_bend(int ch, int msb, int lsb);
void trigger_release(spinner* x);
void gm_reset(void);

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

void new_lpf(Biquad* biq, float fc, float Q) {
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
float calc_lpf(Biquad* b, double In) {
  double Out = In * b->a0 + b->z1;
  b->z1 = In * b->a1 + b->z2 - b->b1 * Out;
  b->z2 = In * b->a0 - b->b2 * Out;
  return (float)Out;
}

#endif
