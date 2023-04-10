#include <math.h>
#include <stdio.h>

#include "./nd/sf2.c"
#include "spin.h"

#define RENDQ 128
#define nchannels 4
float sample_data[1024 * 10];
typedef struct {
  int sampleRate, frequency, length;
  float* data;
} smpl_info;

void set_smpl_frames(float* fl, int cnt, float sr, float smpl_freq) {}
int main() {
  readsf(fopen("file.sf2", "rb"));
  shdrcast* sp = (shdrcast*)shdrs;
  for (int i = 0; i < 22; i++) {
    sp++;
    printf("\n %c", sp->startloop, sp->endloop, sp->sampleRate,
           sp->originalPitch);
  }
  smpl_info info = {44100, 440, 1982};
  float data[1982];
  for (int i = 0; i < 1982; i++) {
  }
  float period = info.sampleRate / (float)info.frequency;
  printf("%f", period);
  int tble_period = 1024;
  float ratio = 1024 / period;
  printf("%f", period);

  return 1;
}
