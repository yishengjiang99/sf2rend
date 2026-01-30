#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <strings.h>

#include "call_ffp.h"
#include "ffmpeg_test_tool.c"
#include "pdta_extern_adapt.c"
#include "sf2.c"
#define WAVETABLE_SIZE 4096
#define SAMPLE_RATE 44100
#define MODULO_one BIT32_NORMALIZATION
#define zerogain pow(10.0f, -1440.0f)

typedef struct {
  uint32_t phase;
  int32_t phaseShift;
  float *wavetable;
  int pos;
  float frac, ratio;
} voice_t;

typedef struct {
  uint32_t delay_steps, att_steps, hold_steps, decay_steps, release_steps;
  unsigned short sustain;
  float db_attenuate;
  float att_rate, decay_rate, release_rate;
} adsr_t;

adsr_t *newEnvelope(short centDelay, short centAtt, short centHold,
                    short centRelease, short centDecay, short sustain,
                    int sampleRate) {
  adsr_t *env = (adsr_t *)malloc(sizeof(adsr_t));
  env->delay_steps = powf(2.0f, (float)centDelay / 1200.0f) * sampleRate;
  env->hold_steps = powf(2.0f, (float)centHold / 1200.0f) * sampleRate;

  env->att_steps = powf(2.0f, (float)centAtt / 1200.0f) * sampleRate;
  env->decay_steps = powf(2.0f, (float)centDecay / 1200.0f) * sampleRate;
  env->release_steps = powf(2.0f, (float)centRelease / 1200.0f) * sampleRate;
  env->att_rate = -960.0f / env->att_steps;
  env->decay_rate = ((float)1.0f * sustain) / (float)env->decay_steps;
  env->release_rate = (float)960.0f / ((float)env->release_steps);
  env->db_attenuate = 959.0f;

  return env;
}
float envShift(adsr_t *env) {
  if (env->delay_steps-- > 0) {
  }

  else if (env->att_steps > 0) {
    env->att_steps--;
    env->db_attenuate += env->att_rate;
  } else if (env->hold_steps-- > 0) {
  } else if (env->decay_steps > 0) {
    env->decay_steps--;
    env->release_steps--;

    env->db_attenuate += env->decay_rate;
  } else if (env->release_steps > 0) {
    env->release_steps--;
    env->db_attenuate += env->release_rate;
  }
  if (env->db_attenuate > 960) {
    if (env->att_steps <= 0) {
      env->decay_steps = 0;
    } else {
      env->db_attenuate = 960.0f;
    }
  }
  if (env->db_attenuate < 0.0) {
    env->db_attenuate = 0.0f;
  }
  return env->db_attenuate;
}
void adsrRelease(adsr_t *env) {
  env->decay_steps = 0;
  env->att_steps = 0;
  env->release_steps = env->db_attenuate / 1000.0f * (env->release_steps);
}

typedef struct _voice {
  unsigned int start, end, startloop, endloop;
  uint32_t pos;
  float frac;
  float ratio;
  adsr_t *ampvol, *moddvol;
  short attenuate;
} voice;

float calcratio(zone_t *z, shdrcast *sh, int midi) {
  short rt = z->OverrideRootKey > -1 ? z->OverrideRootKey : sh->originalPitch;
  float sampleTone = rt * 100.0f + z->CoarseTune * 100.0f + (float)z->FineTune;
  float octaveDivv = (float)midi * 100 - sampleTone;
  return powf(2.0f, octaveDivv / 1200.0f) * (float)sh->sampleRate / SAMPLE_RATE;
}
voice *newVoice(zone_t *z, int midi, int vel) {
  voice *v = (voice *)malloc(sizeof(voice));
  shdrcast *sh = (shdrcast *)(shdrs + z->SampleId);
  v->start = sh->start + (z->StartAddrCoarseOfs << 15) + z->StartAddrOfs;
  v->end = sh->end + (z->EndAddrCoarseOfs << 15) + z->EndAddrOfs;
  v->endloop =
      sh->endloop + (z->EndLoopAddrCoarseOfs << 15) + z->EndLoopAddrOfs;
  v->startloop =
      sh->startloop + (z->StartLoopAddrCoarseOfs << 15) + z->StartLoopAddrOfs;

  v->ampvol = newEnvelope(z->VolEnvDelay, z->VolEnvAttack, z->VolEnvHold,
                          z->VolEnvRelease, z->VolEnvDecay, z->VolEnvSustain,
                          sh->sampleRate);

  v->moddvol = newEnvelope(z->ModEnvDelay, z->ModEnvAttack, z->ModEnvHold,
                           z->ModEnvRelease, z->ModEnvDecay, z->ModEnvSustain,
                           sh->sampleRate);

  v->ratio = calcratio(z, sh, midi);
  v->pos = v->start;
  v->frac = 0.0f;

  return v;
}

float hermite4(float frac_pos, float xm1, float x0, float x1, float x2) {
  const float c = (x1 - xm1) * 0.5f;
  const float v = x0 - x1;
  const float w = c + v;
  const float a = w + v + (x2 - x0) * 0.5f;
  const float b_neg = w + a;

  return ((((a * frac_pos) - b_neg) * frac_pos + c) * frac_pos + x0);
}

#define settime2nsamples(cent, sr) powf(2.0f, (float)cent / 1200.0f) * sr

float sdta4lerp(float *sdta, voice *v) {
  float fm1 = *(sdta + v->pos - 1);
  float f1 = *(sdta + v->pos);
  float f2 = *(sdta + v->pos + 1);
  float f3 = *(sdta + v->pos + 2);
  return hermite4(v->frac, fm1, f1, f2, f3);
}

int main(int argc, char **argv) {
  char *readff = argc > 1 ? argv[1] : "file.sf2";
  FILE *FD = fopen(readff, "r");
  if (!FD) perror("ff");
  readsf(FD);
  phdr *phr = findPreset(0, 0);
  findPresetZonesCount(phr);
  findPresetZones(phr, findPresetZonesCount(phr));
  read_sdta(FD);
  zone_t *zone = filterForZone(presets[0], 65, 44);
  zone_t *z2 = filterForZone(zone, 65, 44);

  shdrcast *sh = (shdrcast *)(shdrs + zone->SampleId);

  voice *v = newVoice(zone, 60, 66);
  v->frac = 0.0f;
  float rootkey =
      (zone->OverrideRootKey > -1 ? zone->OverrideRootKey : sh->originalPitch) *
      100.0f;
  float pitch = rootkey + zone->CoarseTune * 100 + zone->FineTune;

  uint32_t looplength = sh->endloop - sh->startloop,
           p1len = sh->startloop - sh->start;
  v->pos = sh->start;
  float sr_ration = (float)sh->sampleRate / WAVETABLE_SIZE;
  float ratio = (float)sh->sampleRate /
                (powf(2, (pitch - 6900) / 1200) * 440.0f) / WAVETABLE_SIZE;
  float wavetables[WAVETABLE_SIZE * 5];

  for (int i = 0; i < WAVETABLE_SIZE; i++) {
    v->frac += v->ratio;
    if (v->frac >= 1.0f) {
      v->frac--;
      v->pos++;
    }
    wavetables[i] = sdta4lerp(sdta, v);
    if (v->pos >= sh->endloop) v->pos -= looplength;

    if (i == 3 * WAVETABLE_SIZE) {
      v->pos = sh->startloop;
    }
    if (i == 4 * WAVETABLE_SIZE) {
      v->pos = sh->end - looplength;
      sh->endloop = sh->end - 1;
    }
  }

  v->frac = 0.0f;

  v->pos = sh->start;
  FILE *output = wavepic("wvpic2.png");

  fwrite(&wavetables[WAVETABLE_SIZE], sizeof(float), 1 * WAVETABLE_SIZE,
         output);
  fclose(output);

  return 0;
}
