
#include "spin.h"

#include "LFO.c"
#ifdef debug
#include <stdio.h>
#endif

#define RENDQ 128
#define sps_index() (spsIndx++) & 0x0f
#define one_over_128_128 1.0f / 128.0f / 128.0f
#define clamp(val, min, max) val > max ? max : val < min ? min : val
spinner sps[21];
lpf_t lpf[21];
EG eg[44];
char midi_cc_vals[16 * 128];
void set_midi_cc_val(int channel, int metric, int val) {
  midi_cc_vals[channel * 128 + metric] = (char)val & 0x7f;
}
float outputs[16 * RENDQ * 2];
float silence[40];
char spsIndx = 0;
void reset(spinner* x);

spinner* newSpinner(zone_t* zoneRef, int idx) {
  spinner* x = &sps[idx];
  x->outputf = &outputs[idx * RENDQ * 2];
  x->inputf = silence;
  x->loopEnd = 36;
  x->loopStart = 4;
  x->fract = 0.0f;
  x->position = 0;
  x->lpf = &lpf[idx];
  newLpf(x->lpf, 0.45f);
  x->voleg = &eg[idx * 2];
  x->modeg = &eg[idx * 2 + 1];
  set_zone(x, zoneRef);
  midi_cc_vals[idx * 128 + TML_VOLUME_MSB] = 100;
  midi_cc_vals[idx * 128 + TML_PAN_MSB] = 64;
  midi_cc_vals[idx * 128 + TML_EXPRESSION_MSB] = 127;
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
  reset(x);
  init_mod_eg(x->modeg, z);
  init_vol_eg(x->voleg, z);
}
float set_attrs(spinner* x, float* inp, uint32_t loopstart, uint32_t loopend,
                zone_t* z, float stride) {
  x->loopStart = loopstart;
  x->loopEnd = loopend;
  x->inputf = inp;
  x->stride = stride;
  set_zone(x, z);

  return x->stride;
}

float lerp(float f1, float f2, float frac) { return f1 + (f2 - f1) * frac; }
#define subtractWithFloor(a, b, floor) a - b > floor ? a - b : 0;

float _spinblock(spinner* x, int n, int blockOffset) {
  update_eg(x->voleg, n);

  update_eg(x->modeg, n);  // x->zone, 0);
  if (x->voleg->stage == done) return .0f;
  if (x->voleg->egval == 0 && x->voleg->egIncrement == 0) return .0f;

  int position = x->position;
  float fract = x->fract;
  float stride = x->stride;
  double db = x->voleg->egval;
  double dbTarget = x->voleg->egval + x->voleg->egIncrement * n;

  int looplen = x->loopEnd - x->loopStart + 1;

  float mixIncrement = 1.0f / (float)n;
  float mix = 0.0f;
  double dbInc = x->voleg->egIncrement;
  double modEG = p10over200[(short)(clamp(x->modeg->egval, -960, 0))];
  stride = stride > 0
               ? stride *
                     (12.0f + (float)(modEG * x->zone->ModEnv2Pitch) / 100.0f) /
                     12.0f
               : 0;
  float midicc = midi_cc_vals[128 * x->channelId + TML_VOLUME_MSB] *
                 midi_cc_vals[128 * x->channelId + TML_EXPRESSION_MSB] *
                 one_over_128_128;
  for (int i = 0; i < n; i++) {
    mix += mixIncrement;
    fract = fract + stride;

    while (fract >= 1.0f) {
      position++;
      fract -= 1.0f;
    }

    if (position >= x->loopEnd && x->loopStart != 0) position -= looplen;

    float outputf = lerp(x->inputf[position], x->inputf[position + 1], fract);
    x->outputf[i * 2 + blockOffset * 2] = outputf;
    x->outputf[i * 2 + blockOffset * 2 + 1] =
        applyCentible(outputf, (short)db) * midicc;

    db += dbInc;
  }
  // x->voleg->egval = db;
  x->position = position;
  x->fract = fract;
  x->stride = stride;
  // x->voleg->nsamples_till_next_stage =
  //     subtractWithFloor(x->voleg->nsamples_till_next_stage, n, 0);
  // x->modeg->nsamples_till_next_stage =
  //     subtractWithFloor(x->modeg->nsamples_till_next_stage, n, 0);
  return stride;
}

float spin(spinner* x, int n) {
  if (x->voleg->stage == done) return 0.f;
  for (int blockOffset = 0; blockOffset <= n - 32; blockOffset += 32) {
    _spinblock(x, 32, blockOffset);
  }
  return (float)x->voleg->egval;
}