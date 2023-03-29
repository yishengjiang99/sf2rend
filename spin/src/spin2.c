#include <stdlib.h>

#include "spin.h"
#define n_channels 16

float *left_outputs[n_channels];
float *right_outputs[n_channels];

typedef struct _sp {
  pcm_t *pcm;
  LFO *modlfo, vibrlfo;
  EG *modeg, voleg;
  int channel, key, velocity;
  int position, loopStart, loopEnd;
  float fraction, stride;
} spin_t;

spin_t *new_sp(int channel_id, zone_t *z, pcm_t *pcm) {
  spin_t *x = (spin_t *)malloc(sizeof(spin_t));
  x->channel = channel_id;
  x->pcm = pcm;
  x->loopStart = pcm->loopstart;
  x->loopEnd = pcm->loopend;
  x->position = z->StartAddrOfs + (z->StartAddrCoarseOfs << 15);
  x->loopStart += z->StartLoopAddrOfs + (z->StartLoopAddrCoarseOfs << 15);
  x->loopEnd += z->EndAddrOfs + (z->EndLoopAddrCoarseOfs << 15);
  x->voleg = new_eg();
  return x;
}
EG *new_eg(EGParams egAttrs) { EG *eg = (EG *)malloc(sizeof(EG);
}
void set_spinner_input(spin_t *x, pcm_t *pcm) {
  x->loopStart = pcm->loopstart;
  x->loopEnd = pcm->loopend;
  x->inputf = pcm->data;
  x->pcm = pcm;
}