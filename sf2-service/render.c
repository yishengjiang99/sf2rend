#include "sf2.h"
#define sr 48000
typedef struct voice {
  shdrcast *sh;
  zone_t *z;
  float *samples;
  float *output1, *output2;
  int offset;
  float fraction;
  float stride;
  int key, vel;

} voice;
extern float powf(float b, float exp);
extern float sinf(float x);

static voice v[2];
static float output1[128];
static float output2[128];
static float input[0x2000];
static int pcmDownload;
static float pcm[0x0000ffff];

static shdrcast sh[2];
static zone_t z[2];

void *loadPCM(int len) {
  void *ref = (void *)(&pcm[pcmDownload]);
  pcmDownload += len;
  return ref;
}

float calcratio(zone_t *z, shdrcast *sh, int midi) {
  short rt = z->OverrideRootKey > -1 ? z->OverrideRootKey : sh->originalPitch;
  float sampleTone = rt * 100.0f + z->CoarseTune * 100.0f + (float)z->FineTune;
  float octaveDivv = (float)midi * 100 - sampleTone;
  return powf(2.0f, octaveDivv / 1200.0f) * (float)sh->sampleRate / sr;
}

voice *newVoice(int midi, int vel) {
  v->samples = input;
  v->output1 = output1;
  v->output2 = output2;
  v->sh = sh;
  v->z = z;
  return v;
}
float hermite4(float frac_offset, float xm1, float x0, float x1, float x2) {
  const float c = (x1 - xm1) * 0.5f;
  const float v = x0 - x1;
  const float w = c + v;
  const float a = w + v + (x2 - x0) * 0.5f;
  const float b_neg = w + a;

  return ((((a * frac_offset) - b_neg) * frac_offset + c) * frac_offset + x0);
}

float panLeftLUT(short Pan) {
  if (Pan < -500) {
    return 1;
  }
  if (Pan > 500) {
    return 0.0f;
  } else {
    return 0.5f + sinf((float)(Pan - 500.0f) / 1000.0f * 3.1415f * 2);
  }
}
void render(voice *v) {
  if (!v->stride) v->stride = calcratio(v->z, v->sh, v->key);
  uint32_t loopLength = v->sh->endloop - v->sh->startloop;

  float volume_gain = v->z->Attenuation;  //* ch.midi_volume;
  float g_left = panLeftLUT(v->z->Pan);
  float g_right = 2 - 2 * panLeftLUT(v->z->Pan);
  for (int i = 0; i < (int)128; i++) {
    float fm1 = v->offset > 0 ? *(v->samples + v->offset - 1) : 0;
    float f1 = *(v->samples + v->offset);
    float f2 = *(v->samples + v->offset + 1);
    float f3 = *(v->samples + v->offset + 2);

    float gain = hermite4(v->fraction, fm1, f1, f2, f3);

    v->output1[0] += (float)gain * g_left;
    ;
    v->output1[1] += (float)gain * g_right;

    v->fraction += v->stride;  // p2over1200(modEG * v->z->ModEnv2Pitch);
    while (v->fraction >= 1.0f) {
      v->fraction--;
      v->offset++;
    }
    while (v->offset >= v->sh->endloop) {
      if (v->z->SampleModes == 0) {
        return;
      }
      v->offset = v->offset - loopLength + 1;
    }
  }
}
