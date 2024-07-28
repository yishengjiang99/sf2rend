

#include "spin.h"

#include "calc.h"
#include "sf2.h"

#define MAX_VOICE_CNT 256

// ghetto malloc all variables
int sp_idx = 0;
spinner sps[MAX_VOICE_CNT];
pcm_t pcms[4096];
uint8_t midi_cc_vals[nmidiChannels * 128] = {0};
float outputs[MAX_VOICE_CNT * RENDQ * 2];
float silence[440] = {.0f};
float calc_pitch_diff_log(zone_t *z, pcm_t *pcm, unsigned char key);
float volEgOut[RENDQ];
float modEgOut[RENDQ];
float lfo1Out[RENDQ];
float lfo2Out[RENDQ];

void eg_advance(EG *eg);
float eg_update(EG *eg, int n);

void sp_wipe_output_tab() {
  int output_arr_len = MAX_VOICE_CNT * RENDQ * 2;
  for (int i = 0; i < output_arr_len; i++) {
    outputs[i] = 0.0f;
  }
}

spinner *spRef(int idx) { return &sps[idx]; }
pcm_t *pcmRef(int sampleId) { return &pcms[sampleId]; }

spinner *allocate_sp() {
  spinner *x = &sps[sp_idx % MAX_VOICE_CNT];
  x->outputf = &outputs[sp_idx * RENDQ * 2];
  sp_idx++;
  return x;
}
#define def_drum_c 9
#define modulo_s16f_inverse 1.0f / 32767.1f
#define modulo_u16f (float)(((1 << 16) + .1f))
extern float tanf(float t);
float dummy[666];  // backward compact hack

void eg_scale_tc(EG *eg, unsigned int pcmSampleRate) {
  float scaleFactor = SAMPLE_RATE / (float)pcmSampleRate;
  eg->attack *= scaleFactor;
  eg->delay *= scaleFactor;
  eg->decay *= scaleFactor;
  eg->release *= scaleFactor;
  eg->hold *= scaleFactor;
}

void init_vol_eg(EG *eg, zone_t *z, unsigned int pcmSampleRate) {
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

void init_mod_eg(EG *eg, zone_t *z, unsigned int pcmSampleRate) {
  eg->attack = z->ModEnvAttack;
  eg->delay = z->ModEnvDelay;
  eg->decay = z->ModEnvDecay;
  eg->release = z->ModEnvRelease;
  eg->hold = z->ModEnvHold;
  eg->sustain = z->ModEnvSustain;
}

float LFO_roll_out(LFO *lfo, unsigned int n, float *output) {
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

void LFO_set_frequency(LFO *lfo, short ct) {
  double freq = timecent2hertz(ct);
  lfo->phaseInc = (unsigned short)(modulo_u16f * freq / SAMPLE_RATE);
}

float LFO_roll(LFO *lfo, unsigned int n) {
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

void eg_roll(EG *eg, int n, float *output) {
  while (n-- && eg->nsteps--) {
    if (eg->stage == attack) {
      int lut_index = fixed_floor(eg->progress);
      double frag = get_fraction(eg->progress);
      double f1 = att_db_levels[lut_index], f2 = att_db_levels[lut_index + 1];
      eg->egval = lerpd(f1, f2, frag);
    } else {
      eg->egval += eg->egIncrement;
    }
    *output++ = eg->egval;
  }
  if (eg->egval > 0) eg->egval = 0.0f;
  if (eg->nsteps <= 7) eg_advance(eg);
}
/**
 * advances envelope generator by n steps..
 * shift to next stage and advance the remaining n steps
 * if necessary
 *
 */
float eg_update(EG *eg, int n) {
  while (n--) {
    eg->egval += eg->egIncrement;
    eg->nsteps--;
  }
  if (eg->nsteps <= 7) eg_advance(eg);
  if (eg->egval > 0) eg->egval = 0.0f;
  return eg->egval;
}

void eg_advance(EG *eg) {
  switch (eg->stage) {
    case inactive:
      eg->stage++;
      return;
    case init:
      eg->stage = delay;
      eg->egval = MAX_EG;

      if (eg->delay > -12000) {
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

      if (eg->sustain > 0) {
        eg->nsteps = timecent2sample(eg->decay);
        eg->egIncrement = (MAX_EG + eg->sustain / 1000) / eg->nsteps;

      } else {
        eg->nsteps = 0;
      }
      break;

    case decay:  // headsing to released;

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
          timecent2sample(eg->release);  //+ timecent2sample(eg->decay);
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

void _eg_release(EG *e) {
  e->stage = sustain;
  eg_advance(e);
}
spinner *new_sp(int ch) {
  spinner *x = allocate_sp();
  x->outputf = &outputs[ch * RENDQ * 2];
  x->inputf = silence;
  x->channelId = ch;
  x->lpf.z1 = x->lpf.z2 = 0;
  return x;
}

void sp_set_attr(spinner *x, igen *ig) {
  switch (ig->genid) {}
}

void trigger_release(spinner *x) {
  _eg_release(&x->voleg);
  _eg_release(&x->modeg);
}

void reset_eg(EG *eg) {
  eg->stage = inactive;
  eg->egval = MAX_EG;
  eg->egIncrement = 0.0f;
  eg->hasReleased = 0;
  eg->attack = eg->delay = eg->hold = eg->release = -12000;
  eg->sustain = 250;
}

void reset(spinner *x) {
  x->position = 0;
  x->stride = .0f;
  x->fract = 0.0f;
  reset_eg(&x->modeg);
  reset_eg(&x->voleg);
  lpf_set_filter_q(&x->lpf, 0);
  x->active_dynamics_flag = 0;
}

void set_midi_cc_val(int channel, int metric, int val) {
  midi_cc_vals[channel * 128 + metric] = (char)(val & 0x7f);
}

#define ccval(eff) midi_cc_vals[x->channelId * 128 + eff]
#define effect_floor(v) v <= -12000 ? 0 : calcp2over1200(v)

float trigger_attack(spinner *x, uint32_t key, uint32_t velocity) {
  x->velocity = (unsigned char)velocity;
  x->position = 0;
  x->fract = 0.0f;
  x->voleg.stage = init;
  x->key = (unsigned char)(key & 0x7f);
  EG *eg = &x->voleg;
  float scaleFactor = SAMPLE_RATE / (float)x->pcm->sampleRate;
  zone_t *z = x->zone;
  eg->attack = (ccval(VCA_ATTACK_TIME) > 0)
                   ? midi_p1200[ccval(VCA_ATTACK_TIME) | 0]
                   : z->VolEnvAttack * scaleFactor;
  eg->decay = (ccval(VCA_DECAY_TIME) > 0)
                  ? midi_p1200[ccval(VCA_DECAY_TIME) | 0]
                  : z->VolEnvDecay * scaleFactor;
  eg->release = (ccval(VCA_RELEASE_TIME) > 0)
                    ? midi_p1200[ccval(VCA_RELEASE_TIME) | 0]
                    : z->VolEnvRelease * scaleFactor;
  eg->sustain = (ccval(VCA_SUSTAIN_LEVEL) > 0)
                    ? (short)(ccval(VCA_SUSTAIN_LEVEL) / 128.f * 1000.f)
                    : z->VolEnvSustain;

  eg->delay = z->VolEnvDelay * scaleFactor;
  eg->hold = z->VolEnvHold * scaleFactor;
  eg->stage = init;
  eg->nsteps = 0;

  eg = &x->modeg;
  eg->stage = init;
  if (ccval(TML_BANK_SELECT_MSB) > 0) {
    x->is_looping = 0;
  }
  lpf_set_filter_q(&x->lpf, x->zone->FilterQ);

  eg->delay = z->ModEnvDecay * scaleFactor;
  eg->hold = z->ModEnvHold * scaleFactor;
  eg->attack = (ccval(VCF_ATTACK_TIME) > 0)
                   ? midi_p1200[ccval(VCF_ATTACK_TIME) | 0]
                   : z->ModEnvAttack * scaleFactor;
  eg->decay = (ccval(VCF_DECAY_TIME) > 0)
                  ? midi_p1200[ccval(VCF_DECAY_TIME) | 0]
                  : z->ModEnvDecay * scaleFactor;
  eg->release = (ccval(VCF_RELEASE_TIME) > 0)
                    ? midi_p1200[ccval(VCF_RELEASE_TIME) | 0]
                    : z->ModEnvRelease * scaleFactor;
  eg->sustain = (ccval(VCF_SUSTAIN_LEVEL) > 0)
                    ? (short)(ccval(VCF_SUSTAIN_LEVEL) / 128.f * 1000.f)
                    : z->ModEnvSustain;

  x->pitch_dff_log = calc_pitch_diff_log(x->zone, x->pcm, x->key);

  x->stride = 1.0f;
  eg_advance(&x->voleg);
  eg_advance(&x->modeg);

  x->lfo1_pitch = effect_floor(x->zone->ModLFO2Pitch);
  x->lfo1_volume = effect_floor(x->zone->ModLFO2Vol);
  x->lfo2_pitch = effect_floor(x->zone->VibLFO2Pitch);
  x->modeg_pitch = effect_floor(x->zone->ModEnv2Pitch);
  x->modeg_fc = effect_floor(x->zone->ModEnv2FilterFc);
  x->lfo1_fc = effect_floor(x->zone->ModLFO2FilterFc);
  x->modlfo.delay = timecent2sample(x->zone->ModLFODelay);
  x->vibrlfo.delay = timecent2sample(x->zone->ModLFODelay);
  LFO_set_frequency(&x->modlfo, x->zone->ModLFOFreq);
  LFO_set_frequency(&x->vibrlfo, x->zone->VibLFOFreq);
  lpf_set_filter_q(&x->lpf, x->zone->FilterQ);

  lpf_set_frequency(&x->lpf, x->zone->FilterFc);

  x->initialFc = x->zone->FilterFc;

  x->initialQ = p10over200[x->zone->FilterQ];
  x->lpf.QInv = 1.0 / p10over200[x->zone->FilterQ];
  lpf_set_frequency(&x->lpf, x->zone->FilterFc);
  lpf_set_filter_q(&x->lpf, x->zone->FilterQ);

  return x->stride;
};

void set_spinner_input(spinner *x, pcm_t *pcm) {
  x->loopStart = pcm->loopstart;
  x->loopEnd = pcm->loopend;
  x->inputf = pcm->data;
  x->sampleLength = pcm->length;
  x->pcm = pcm;
  x->position = 0;
}

float calc_pitch_diff_log(zone_t *z, pcm_t *pcm, unsigned char key) {
  short rt = z->OverrideRootKey > -1 ? z->OverrideRootKey : pcm->originalPitch;
  float smpl_rate = rt * 100.0f + z->CoarseTune * 100.0f + (float)z->FineTune;
  float diff = key * 100.0f - smpl_rate + .0001f;
  diff += ((pcm->sampleRate - SAMPLE_RATE) / 4096.f * 100.f);
  return diff;
}
#define ccval(eff) midi_cc_vals[x->channelId * 128 + eff]

void set_spinner_zone(spinner *x, zone_t *z) {
  pcm_t *pcm = &pcms[z->SampleId];
  set_spinner_input(x, pcm);
  x->zone = z;

  x->is_looping = z->SampleModes > 0;
  x->position += (unsigned short)z->StartAddrOfs +
                 (unsigned short)(z->StartAddrCoarseOfs << 15);
  x->loopStart += (unsigned short)z->StartLoopAddrOfs +
                  (unsigned short)(z->StartLoopAddrCoarseOfs << 15);
  x->loopEnd += (unsigned short)z->EndLoopAddrOfs;
  x->loopEnd += (unsigned short)(z->EndLoopAddrCoarseOfs << 15);
  x->sampleLength += z->EndAddrOfs + (z->EndAddrCoarseOfs << 15);
}

void _spinblock(spinner *x, int n, int blockOffset) {
  double db, dbInc;
  float stride = 1.0f;
  float pdiff = x->pitch_dff_log;

  int ch = x->channelId;
  float *output_L = &x->outputf[blockOffset];
  float *output_R = &x->outputf[RENDQ + blockOffset];
  eg_roll(&x->modeg, n, modEgOut);
  eg_roll(&x->voleg, n, volEgOut);
  LFO_roll_out(&x->modlfo, n, lfo1Out);
  LFO_roll_out(&x->vibrlfo, n, lfo2Out);

  unsigned int position = x->position;
  float fract = x->fract;
  unsigned int nsamples = x->sampleLength;
  unsigned int looplen = x->loopEnd - x->loopStart;
  int should_skip_blocks = x->zone->SampleModes > 0 ? 1 : 0;

  float kRateCB = 0.0f;
  kRateCB += (float)x->zone->Attenuation;
  kRateCB += midi_volume_log10(ccval(TML_VOLUME_MSB));
  kRateCB += midi_volume_log10(midi_cc_vals[ch * 128 + TML_EXPRESSION_MSB]);
  if (x->voleg.stage < decay) kRateCB += midi_volume_log10(x->velocity);

  double panLeft = panleftLUT[midi_cc_vals[ch * 128 + TML_PAN_MSB]];

  double panRight = panrightLUT[midi_cc_vals[ch * 128 + TML_PAN_MSB]];

  int isLooping = x->is_looping;
  short lfo1_volume, lfo1_pitch, modeg_pitch, lfo2_pitch, modeg_fc;
  lfo1_volume = x->lfo1_volume;
  modeg_fc = x->modeg_fc;
  lfo1_pitch = x->lfo1_pitch;
  modeg_pitch = x->modeg_pitch;
  lfo2_pitch = x->lfo2_pitch;
  Biquad lpf = x->lpf;
  float tfc, outputf, fchertz;
  short initFc = x->initialFc;

  for (int i = 0; i < n; i++) {
    db = volEgOut[i];  //+ lfo1_volume * lfo1Out[i];
    pdiff += lfo1Out[i] * lfo1_pitch + modEgOut[i] * modeg_pitch +
             lfo2Out[i] * lfo2_pitch;

    stride = calcp2over1200(pdiff);

    fract = fract + stride;
    while (fract >= 1.0f) {
      position++;
      fract -= 1.0f;
    }
    if (position >= x->loopEnd && isLooping > 0) position -= looplen;

    outputf = lerp(x->inputf[position], x->inputf[position + 1], fract);
    //    tfc = initFc + modeg_fc * modEgOut[i] + x->lfo1_fc * lfo1Out[i];

    if (position > nsamples) {
      position = 0;
      outputf = 0.0;
      x->voleg.stage = done;
    }
    outputf = applyCentible(outputf, (short)(db + kRateCB));

    if (tfc > .5) {
      lpf_set_frequency(&lpf, tfc);
      outputf = lpf_calc(&lpf, outputf);
    }
    output_L[i] = applyCentible(outputf, panLeft);
    output_R[i] = applyCentible(outputf, panRight);
  }
  x->position = position;
  x->fract = fract;
  x->stride = stride;
}

int spin(spinner *x, int n) {
  _spinblock(x, 64, 0);

  _spinblock(x, 64, 64);

  if (x->voleg.egval < -1440.f) {
    x->voleg.stage = done;
    return 0;
  }
  if (x->voleg.stage == done) {
    return 0;
  }
  return 1;
}

unsigned int sp_byte_len() { return sizeof(spinner); }
EG *get_vol_eg(spinner *x) { return &x->voleg; }
EG *get_mod_eg(spinner *x) { return &x->modeg; }

float *get_sp_output(spinner *x) { return x->outputf; }
int get_sp_channel_id(spinner *x) { return x->channelId; }

void gm_reset() {
  for (int idx = 0; idx < nmidiChannels; idx++) {
    midi_cc_vals[idx * num_cc_list + TML_VOLUME_MSB] = 100;
    midi_cc_vals[idx * num_cc_list + TML_PAN_MSB] = 64;
    midi_cc_vals[idx * num_cc_list + TML_EXPRESSION_MSB] = 127;
    if (idx == def_drum_c)
      midi_cc_vals[idx * num_cc_list + TML_BANK_SELECT_MSB] = 128;
  }
  for (int i = 0; i < nchannels; i++) reset(&sps[i]);
}

#define ts2hz(ts) timecent2hertz(ts)

void lpf_set_filter_q(Biquad *lpf, short filterQ) {
  lpf->QInv = 1.0 / centible[(unsigned short)filterQ & 0x0fff];
  lpf->z1 = lpf->z2 = 0;
}

void lpf_set_frequency(Biquad *lpf, float fc) {
  float lowpassFc = ts2hz(fc) / SAMPLE_RATE;
  double K = tanf(3.1415f * lowpassFc);
  double KK = K * K;
  double norm = 1.0 / (1 + K * lpf->QInv + KK);
  lpf->a0 = KK * norm;
  lpf->a1 = 2 * lpf->a0;
  lpf->b1 = 2 * (KK - 1) * norm;
  lpf->b2 = (1 - K * lpf->QInv + KK) * norm;
}

float lpf_calc(Biquad *b, double In) {
  double Out = In * b->a0 + b->z1;
  b->z1 = In * b->a1 + b->z2 - b->b1 * Out;
  b->z2 = In * b->a0 - b->b2 * Out;
  return (float)Out;
}

// #define TEST_ENV
#ifdef TEST_ENV
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#define BIT32_NORMALIZATION 4294967296.0f

int main() {
#define ts2hz(ts) 8.176f * powf(2.0f, (float)ts / 1200.0)

  float sample[4096] = {0.f};
  for (int i = 0; i < 4096; i++) {
    sample[i] = .5 * sinf((float)i * M_2_PI / 4096);
    sample[i] = .5 * sinf(.5f * (float)i * M_2_PI / 4096);
  }
  spinner *x = new_sp(0);

  short lowpassFC = 11111;
  lpf_set_filter_q(&x->lpf, 800);
  lpf_set_frequency(&x->lpf, 5700);
  FILE *adc;

  adc = popen("ffplay -loglevel debug -i pipe:0 -f f32le -ac 1 -ar 48000", "w");
  uint32_t pinc = ts2hz(5700) * BIT32_NORMALIZATION / SAMPLE_RATE;
  uint32_t wavetableBits = 12;
  uint32_t nfract = 32 - wavetableBits;
  uint32_t mask_fraction = (1L << nfract) - 1;
  uint32_t mask_index = wavetableBits - 1;
  float scalar_fractional = 4096.f / BIT32_NORMALIZATION;
  uint32_t p = 0;
  float o;

  for (uint32_t i = 0; i < 48900 * 5; i++) {
    uint32_t index = (uint32_t)(p >> nfract) & 0x0fff;
    uint32_t index2 = (index + 1) & 0x0fff;
    float g1 = scalar_fractional * (float)(p & mask_fraction);
    float v = lerp(sample[index], sample[index2], g1);
    o = lpf_calc(&x->lpf, v);
    p += pinc;

    // fwrite(&o, 4, 1, adc);
    if (i % 288 == 100) {
      lowpassFC += 1500;
      lpf_set_frequency(&x->lpf, lowpassFC);
    }
    if (i % 288 == 0) {
      lowpassFC -= 1500;
      lpf_set_frequency(&x->lpf, lowpassFC);
    }
    fwrite(&o, 4, 1, adc);
  }
  if (adc) fclose(adc);
  // while (!feof(fd)) {
  //   fread(f, sizeof(float), 1, fd);
  //   *o = calc_lpf(&x->lpf, *f);
  //   fwrite(o, sizeof(float), 1, fo);
  // }
  return 0;
}
#endif