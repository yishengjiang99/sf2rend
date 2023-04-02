
#include "spin2.h"

#include <math.h>
#include <stdlib.h>
#include <string.h>

#include "spin_queue.h"

float calc_pitch_ratio(int key, zone_t zone);
float lerp(float f1, float f2, float frac);
spinner *trigger_attack(int channel, int key, int velocity, zone_t *z);
float outputs[nchannels * RENDQ * 2];
float squared[1024];
float sine[1024];
pcm_t pcms[5000];

void _sp_run(spinner *x) {
  uint32_t position = x->position;
  float fract = x->fract;
  float stride = x->stride;
  uint32_t looplen = x->pcm->loopend - x->pcm->loopstart;
  float *outL = &outputs[x->channel * 2 * RENDQ];
  float *outR = &outputs[x->channel * 2 * RENDQ + RENDQ];
  eg_setup(&(x->voleg));
  for (int i = 0; i < RENDQ; i++) {
    float db = eg_run(&(x->voleg));
    float modVol = eg_run(&(x->modeg));
    fract += x->stride;
    while (fract >= 1.0f) {
      position++;
      fract -= 1.0f;
    }
    if (position >= x->pcm->loopend) {
      position -= looplen;
    }

    float f = lerp(x->inputf[position], x->inputf[position + 1], fract);
    outL[i] += f;
    outR[i] += f;
  }
  x->fract = fract;
  x->position = position;
}

void sp_run_all() {
  SP_NODE **trace = &sp_queue;
  bzero(outputs, nchannels * RENDQ * 2 * sizeof(float));
  while (*trace && (*trace)->sp) {
    spinner *x = (*trace)->sp;
    _sp_run(x);
    trace = &((*trace)->next);
  }
  remove_queue();
}

spinner *trigger_release(int channel, int key, int velocity) {
  spinner *sp = find_sp(channel, key);
  if (sp == NULL) return NULL;
  eg_release(&(sp->voleg));
  eg_release(&(sp->modeg));
  return sp;
}
spinner *trigger_attack(int channel, int key, int velocity, zone_t *z) {
  spinner *sp = (spinner *)malloc(sizeof(spinner));
  sp->channel = channel;
  sp->key = key;
  sp->pcm = &pcms[z->SampleId];
  sp->vel = velocity;
  sp->outputf = &outputs[channel * RENDQ * 2];
  sp->inputf = sp->pcm->data;
  sp->stride = calc_pitch_ratio(key, *z);
  EG_PARAMS *volparam = (EG_PARAMS *)(&z->VolEnvDelay);
  eg_init(&sp->voleg, *volparam);
  EG_PARAMS *modParams = (EG_PARAMS *)(&z->ModEnvDelay);
  eg_init(&sp->modeg, *modParams);
  insert_queue(sp);
  return sp;
}

float calc_pitch_ratio(int key, zone_t zone) {
  pcm_t pcm = pcms[zone.SampleId];
  int rootKey =
      zone.OverrideRootKey > -1 ? zone.OverrideRootKey : pcm.originalPitch;
  float sample_pitch = rootKey * 100 + zone.CoarseTune * 100 + zone.FineTune;
  float pitch_diff = (key * 100.f - sample_pitch) / 1200.0f;
  return powf(2.0f, pitch_diff) * (float)pcm.sampleRate / (float)SAMPLE_RATE;
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