
#include "spin.h"

#define RENDQ 128
#define nchannels 64
#define nmidiChannels 16
extern void debugFL(float fl);
#define export __attribute__((used))

spinner sps[nchannels];
EG eg[nchannels * 2];
LFO lfos[nchannels * 2];

char midi_cc_vals[nmidiChannels * 128];
char pitch_bend_msb[nmidiChannels * 128];

float outputs[nchannels * RENDQ * 2];
float silence[40];
char spsIndx = 0;
pcm_t pcms[2222];

export spinner* get_available_spinner(int channelId) {
  spinner* sp;
  for (int i = 0; i < nchannels; i++) {
    if (sps[i].sp_avail == SP_AVAIL) {
      sp = &sps[i];
      sp->channelId=channelId;
      sp->sp_avail=sp_NOT_AVAIL;
      return sp;
    }
  }
  return 0;
}
export void set_available(spinner*x){
  x->sp_avail=sp_NOT_AVAIL;
}
spinner* newSpinner(int idx) {
  spinner* x = &sps[idx];
  x->outputf = &outputs[idx * RENDQ * 2];
  x->inputf = silence;
  x->loopEnd = 36;
  x->loopStart = 4;
  x->fract = 0.0f;
  x->position = 0;
  x->voleg = &eg[idx * 2];
  x->modeg = &eg[idx * 2 + 1];
  x->modlfo = &lfos[idx * 2];
  x->vibrlfo = &lfos[idx * 2 + 1];
  x->channelId = idx;
  return x;
}

export void gm_reset() {
  for (int idx = 0; idx < 128; idx++) {
    midi_cc_vals[idx * nmidiChannels + TML_VOLUME_MSB] = 100;
    midi_cc_vals[idx * nmidiChannels + TML_PAN_MSB] = 64;
    midi_cc_vals[idx * nmidiChannels + TML_EXPRESSION_MSB] = 127;
  }
  for (int i = 0; i < nchannels; i++) {
    newSpinner(i);
  }
}
void eg_release(spinner* x) {
  _eg_release(x->voleg);
  _eg_release(x->modeg);
}
void reset(spinner* x) {
  x->position = 0;
  x->fract = 0.0f;
  x->modlfo->phase = 0;
  x->vibrlfo->phase = 0;
}

void set_zone(spinner* x, zone_t* z, unsigned int pcmSampleRate) {
  x->zone = z;
  init_mod_eg(x->modeg, z, pcmSampleRate);
  init_vol_eg(x->voleg, z, pcmSampleRate);
  x->modlfo->delay = timecent2sample(z->ModLFODelay);
  x->vibrlfo->delay = timecent2sample(z->ModLFODelay);

  set_frequency(x->modlfo, z->ModLFOFreq);
  set_frequency(x->vibrlfo, z->VibLFOFreq);
}

void set_midi_cc_val(int channel, int metric, int val) {
  midi_cc_vals[channel * 128 + metric] = (char)(val & 0x7f);
}

spinner* spRef(int idx) { return &sps[idx]; }
pcm_t* pcmRef(int idx) { return &pcms[idx]; }
export float* spOutput(spinner* sp) { return sp->outputf; }

LFOEffects lfo_effects(float lfoval, zone_t* z) {
  float mod2vol = (1 - lfoval) * z->ModLFO2Vol;
  float mod2pitch = lfoval * z->ModEnv2Pitch;
  float mod2fc = lfoval * z->ModEnv2FilterFc * 8.8f;
  return (LFOEffects){mod2vol, mod2pitch, mod2fc};
}
float trigger_attack(spinner* x, zone_t* z, float ratio, int velocity) {
  pcm_t* pcm = pcms + z->SampleId;
  x->position = z->StartAddrOfs + (z->StartAddrCoarseOfs << 15);
  x->loopStart =
      pcm->loopstart + z->StartLoopAddrOfs + (z->StartLoopAddrCoarseOfs << 15);
  x->loopEnd = pcm->loopend + z->EndAddrOfs + (z->EndLoopAddrCoarseOfs << 15);
  x->inputf = pcm->data;
  x->position = 0;
  x->fract = 0.0f;
  x->stride = ratio;
  x->velocity = velocity & 0x7f;
  set_zone(x, z, pcm->sampleRate);
  return x->stride;
}

float lerp(float f1, float f2, float frac) { return f1 + (f2 - f1) * frac; }

float kRateAttenuate(spinner* x, int ch) {
  float kRateCB = 0.0f;
  kRateCB -= (float)x->zone->Attenuation / 4;
  kRateCB -= midi_volume_log10(midi_cc_vals[ch * 128 + TML_VOLUME_MSB]) / 4;
  if (x->voleg->stage > decay)
    kRateCB -= midi_volume_log10(midi_cc_vals[ch * 128 + TML_EXPRESSION_MSB]);
  kRateCB -= midi_volume_log10(x->velocity) / 4;
  return kRateCB;
}
void _spinblock(spinner* x, int n, int blockOffset) {
  double db, dbInc;
  float modlfoval = roll(x->modlfo, 64);
  float vibrLfoVal = roll(x->vibrlfo, 64);
  LFOEffects modlfoEffect = lfo_effects(modlfoval, x->zone);
  LFOEffects vibrLFOEffects = lfo_effects(vibrLfoVal, x->zone);
  unsigned int position = x->position;
  float fract = x->fract;
  unsigned int nsamples = pcms[x->zone->SampleId].length;
  unsigned int looplen = x->loopEnd - x->loopStart + 1;
  double modEG = p10over200[(short)(clamp(x->modeg->egval, -960, 0) + 960)];

  if (x->zone->SampleModes == 0 && x->voleg->stage < release) {
    db = 0.0f;
    dbInc = 0.0f;
  } else {
    db = x->voleg->egval;
    dbInc = x->voleg->egIncrement;
  }
  float stride = x->zone->SampleModes > 0 ? x->stride : 1.0f;
  int ch = (int)(x->channelId / 2);
  stride = stride *
           (12.0f + (float)(modEG * x->zone->ModEnv2Pitch / 100.0f) +
            (float)(modlfoEffect.mod2pitch / 100.0f) +
            (float)(vibrLFOEffects.mod2pitch / 100.0f)) /
           12.0f;

  float kRateCB = kRateAttenuate(x, ch);

  double panLeft = panleftLUT[midi_cc_vals[ch * 128 + TML_PAN_MSB]] / 2;
  double panRight = panrightLUT[midi_cc_vals[ch * 128 + TML_PAN_MSB]] / 2;

  for (int i = 0; i < n; i++) {
    fract = fract + stride;

    while (fract >= 1.0f) {
      position++;
      fract -= 1.0f;
    }

    if (position >= x->loopEnd && x->zone->SampleModes > 0)
      position -= looplen + 1;
    if (position >= nsamples - 1) {
      x->outputf[i * 2 + blockOffset * 2] = 0.0f;
      x->outputf[i * 2 + blockOffset * 2 + 1] = 0.0f;
      x->voleg->stage = done;
      return;
    }

    float outputf = lerp(x->inputf[position], x->inputf[position + 1], fract);
    // outputf = process_input(x->lpf, outputf);
    x->outputf[i * 2 + blockOffset * 2] =
        applyCentible(outputf, (short)(db + kRateCB + panLeft));
    x->outputf[i * 2 + blockOffset * 2 + 1] =
        applyCentible(outputf, (short)(db + kRateCB + panRight));
    db += dbInc;
  }
  x->position = position;
  x->fract = fract;
  x->stride = stride;
}

int spin(spinner* x, int n) {
  update_eg(x->voleg, 64);

  update_eg(x->modeg, 64);

  _spinblock(x, 64, 0);
  update_eg(x->voleg, 64);

  update_eg(x->modeg, 64);

  _spinblock(x, 64, 64);
  return x->voleg->stage;
}
