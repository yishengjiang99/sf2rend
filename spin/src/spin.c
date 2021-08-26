
#include "spin.h"

#ifdef debu1g
#include <stdio.h>
#endif

#define RENDQ 128
#define nchannels 32
#define one_over_128_128_128 1.0f / 128.0f / 128.0f / 128.0f
#define clamp(val, min, max) val > max ? max : val < min ? min : val
#define subtractWithFloor(a, b, floor) a - b > floor ? a - b : 0;

/**
 * global variables (like we're writing php)
 *
 **/
spinner sps[nchannels];
lpf_t lpf[nchannels];
EG eg[nchannels * 2];
LFO lfos[nchannels * 2];
pcm_t pcms[999];
char midi_cc_vals[nchannels * 128];
float outputs[nchannels * RENDQ * 2];
float silence[40];
char spsIndx = 0;
#define sps_index() (spsIndx++) & 0x0f

/**
 *functions
 *
 */

void set_midi_cc_val(int channel, int metric, int val) {
  midi_cc_vals[channel * 128 + metric] = (char)val & 0x7f;
}
void reset(spinner* x);
void gm_reset() {
  for (int idx = 0; idx < 128; idx++) {
    midi_cc_vals[idx * 128 + TML_VOLUME_MSB] = 100;
    midi_cc_vals[idx * 128 + TML_PAN_MSB] = 64;
    midi_cc_vals[idx * 128 + TML_EXPRESSION_MSB] = 127;
  }
}
spinner* newSpinner(zone_t* zoneRef, int idx) {
  spinner* x = &sps[idx];
  x->outputf = &outputs[idx * RENDQ * 2];
  x->inputf = silence;
  x->loopEnd = 36;
  x->loopStart = 4;
  x->fract = 0.0f;
  x->position = 0;
  x->lpf = &lpf[idx];
  x->voleg = &eg[idx * 2];
  x->modeg = &eg[idx * 2 + 1];
  x->modlfo = &lfos[idx * 2];
  x->vibrlfo = &lfos[idx * 2 + 1];
  set_zone(x, zoneRef);

  x->channelId = idx;
  return x;
}
spinner* sampleZone() {
  zone_t* z = (zone_t*)aZone;
  return newSpinner(z, 20);
}
void eg_release(spinner* x) {
  _eg_release(x->voleg);
  _eg_release(x->modeg);
}
void reset(spinner* x) {
  x->position = 0;
  x->fract = 0.0f;
  x->lpf->m1 = 0;

  x->voleg->stage = init;
  x->voleg->nsamples_till_next_stage = 0;
  x->voleg->egval = -960.0f;
  x->voleg->egIncrement = 0.0f;
  x->modeg->stage = init;
  x->modeg->nsamples_till_next_stage = 0;
  x->modeg->egval = -960.0f;
  x->voleg->egIncrement = 0.0f;
}
void set_zone(spinner* x, zone_t* z) {
  x->zone = z;
  init_mod_eg(x->modeg, z);
  init_vol_eg(x->voleg, z);
}

typedef struct {
  float mod2volume, mod2pitch, mod2filter;
} LFOEffects;

LFOEffects lfo_effects(float lfoval, zone_t* z) {
  float mod2vol = (1 - lfoval) * z->ModLFO2Vol;
  float mod2pitch = lfoval * z->ModEnv2Pitch;
  float mod2fc = lfoval * z->ModEnv2FilterFc * 8.8f;
  return (LFOEffects){mod2vol, mod2pitch, mod2fc};
}
float trigger_attack(spinner* x, zone_t* z, float stride, float velocity) {
  x->loopStart = pcms[z->SampleId].loopstart;
  x->loopEnd = pcms[z->SampleId].loopend;
  x->inputf = pcms[z->SampleId].data;
  x->stride = stride;
  x->velocity = velocity;
  set_zone(x, z);
  return x->stride;
}

float lerp(float f1, float f2, float frac) { return f1 + (f2 - f1) * frac; }

float kRateAttenuate(int initialAttenuation, int volume, int expression,
                     int velocity) {
  return 0 - (initialAttenuation + midi_volume_log10(volume) +
              midi_volume_log10(expression) + midi_volume_log10(velocity));
}

float _spinblock(spinner* x, int n, int blockOffset) {
  double db, dbInc;

  update_eg(x->voleg, n);

  update_eg(x->modeg, n);  // x->zone, 0);
  float modlfoval = roll(x->modlfo, n);
  if (x->voleg->stage == done) return .0f;
  if (x->voleg->egval == 0 && x->voleg->egIncrement == 0) return .0f;

  int position = x->position;
  float fract = x->fract;
  int looplen = x->loopEnd - x->loopStart + 1;
  double modEG = p10over200[(short)(clamp(x->modeg->egval, -960, 0) + 960)];

  if (x->zone->SampleModes == 0 && x->voleg->stage < 4) {
    db = 0.0f;
    dbInc = 0.0f;
  } else {
    db = x->voleg->egval;
    dbInc = x->voleg->egIncrement;
  }
  float stride = x->zone->SampleModes > 0 ? x->stride : 1;
  int ch = (int)x->channelId / 2;
  stride = stride + (float)(modEG * x->zone->ModEnv2Pitch);
  double krate_centible = kRateAttenuate(
      x->zone->Attenuation, midi_cc_vals[ch * 128 + TML_VOLUME_MSB],
      midi_cc_vals[ch * 128 + TML_EXPRESSION_MSB], x->velocity);

  double panLeft = panleftLUT[sf2midiPan(x->zone->Pan)];
  double panRight = panrightLUT[sf2midiPan(x->zone->Pan)];

  for (int i = 0; i < n; i++) {
    fract = fract + stride;

    while (fract >= 1.0f) {
      position++;
      fract -= 1.0f;
    }

    if (position >= x->loopEnd && x->loopStart != 0) position -= looplen;

    float outputf = lerp(x->inputf[position], x->inputf[position + 1], fract);
    x->outputf[i * 2 + blockOffset * 2] =
        applyCentible(outputf, (short)(db - krate_centible - 0));
    x->outputf[i * 2 + blockOffset * 2 + 1] =
        applyCentible(outputf, (short)(db - krate_centible - 0));
    db += dbInc;
  }
  x->position = position;
  x->fract = fract;
  x->stride = stride;

  return stride;
}

float spin(spinner* x, int n) {
  if (x->voleg->stage == done) return 0.f;
  for (int blockOffset = 0; blockOffset <= n - 32; blockOffset += 32) {
    _spinblock(x, 32, blockOffset);
  }
  return (float)x->voleg->egval;
}
