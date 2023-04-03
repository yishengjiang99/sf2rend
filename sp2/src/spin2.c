
#include "spin2.h"

#include <math.h>
#include <stdlib.h>
#include <string.h>

#include "calc.h"

extern float saturate(float input);
float hermite4(float frac_offset, float xm1, float x0, float x1, float x2);
float calc_pitch_ratio(uint32_t key, zone_t *zone);
float lerp(float f1, float f2, float frac);
spinner *trigger_attack(uint32_t channel, uint32_t key, uint32_t velocity,
                        zone_t *z);
float outputs[nchannels * RENDQ * 2];
float squared[1024];
float sine[1024];
pcm_t pcms[5000];

void ob_clear() { bzero(outputs, nchannels * RENDQ * 2 * sizeof(float)); }

eg_section_t sp_run(spinner *x) {
  uint32_t position = x->position;
  float fract = x->fract;
  float stride = x->stride;
  uint32_t loopstart = x->pcm->loopstart;
  uint32_t loopend = x->pcm->loopend;
  uint32_t looplen = loopend - loopstart;
  float *outL = &outputs[x->channel * 2 * RENDQ];
  float *outR = &outputs[x->channel * 2 * RENDQ + RENDQ];
  float db, modVol;
  uint32_t nsamples = x->pcm->length;
  float f = 0.0f;
  eg_setup(&(x->voleg));
  eg_setup(&(x->modeg));
  for (int i = 0; i < RENDQ; i++) {
    db = eg_run(&(x->voleg));
    modVol = eg_run(&(x->modeg));
    fract += stride;
    while (fract >= 1.0f) {
      position++;
      fract -= 1.0f;
    }
    if (position >= loopend && x->zone->SampleModes > 0) position -= looplen;
    if (position >= nsamples) f = 0.0f;
    if (position < x->pcm->length - 2 && position > 0) {
      f = hermite4(fract, x->inputf[position - 1], x->inputf[position],
                   x->inputf[position + 1], x->inputf[position + 2]);
    } else {
      f = lerp(x->inputf[position], x->inputf[position + 1], fract);
    }
    float ffmono = applyCentible(f, (short)(db - MAX_EG));
    outL[i] = saturate(outL[i] + ffmono);
    outR[i] = saturate(outL[i] + ffmono);
  }
  x->fract = fract;
  x->position = position;

  return x->voleg.section;
}

spinner *trigger_release(spinner *sp, int velocity) {
  eg_release(&(sp->voleg));
  eg_release(&(sp->modeg));
  return sp;
}

spinner *trigger_attack(uint32_t channel, uint32_t key, uint32_t velocity,
                        zone_t *z) {
  spinner *sp = (spinner *)malloc(sizeof(spinner));
  sp->channel = channel;
  sp->key = key;
  sp->pcm = &pcms[z->SampleId];
  sp->vel = velocity;
  sp->outputf = &outputs[channel * RENDQ * 2];
  sp->inputf = sp->pcm->data;
  sp->stride = calc_pitch_ratio(key, z);
  EG_PARAMS *volparam = (EG_PARAMS *)(&z->VolEnvDelay);
  eg_init(&sp->voleg, *volparam);
  EG_PARAMS *modParams = (EG_PARAMS *)(&z->ModEnvDelay);
  eg_init(&sp->modeg, *modParams);
  sp->zone = z;
  return sp;
}

float calc_pitch_ratio(uint32_t key, zone_t *zone) {
  pcm_t pcm = pcms[zone->SampleId];
  int rootKey =
      zone->OverrideRootKey > -1 ? zone->OverrideRootKey : pcm.originalPitch;
  float sample_pitch =
      rootKey * 100.0f + zone->CoarseTune * 100.0f + zone->FineTune;
  float pitch_diff = (key * 100.f - sample_pitch) / 1200.0f;
  return powf(2.0f, pitch_diff / 12.0f);
}

pcm_t *new_pcm(WORD sample_id, float *data) {
  pcms[sample_id].data = data;
  return &pcms[sample_id];
}

zone_t *new_zone() {
  zone_t *z = (zone_t *)malloc(120);
  short default_attrs[60] = defattrs;
  memcpy(z, default_attrs, 120);
  return z;
}
pcm_t *pcmRef(WORD sample_id) { return &pcms[sample_id]; }

float lerp(float f1, float f2, float frac) { return f1 + (f2 - f1) * frac; }

float hermite4(float frac_offset, float xm1, float x0, float x1, float x2) {
  const float c = (x1 - xm1) * 0.5f;
  const float v = x0 - x1;
  const float w = c + v;
  const float a = w + v + (x2 - x0) * 0.5f;
  const float b_neg = w + a;

  return ((((a * frac_offset) - b_neg) * frac_offset + c) * frac_offset + x0);
}
