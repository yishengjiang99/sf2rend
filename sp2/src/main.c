#include <math.h>
#include <stdio.h>
#include <stdlib.h>

#include "assert.h"
float saturate(float x) { return x; }
#include "spin2.c"
float sine_tb[1028];
float square_tb[1028];
pcm_t *pcm, *pcm2;
zone_t *z, *z2;

int test_trigger_attack();
int test_sp_run();
void setup();
int test_eg();
int test_sp_release();

int main() {
  return test_eg() || test_trigger_attack() || test_sp_run() ||
         test_sp_release();
}

int test_sp_release() {
  setup();

  spinner* sp1 = trigger_attack(0, 60, 122, z);
  spinner* sp2 = trigger_attack(0, 62, 122, z);
  spinner* sp3 = trigger_attack(0, 63, 122, z);
  assert(sp1 != NULL);
  spinner* x = trigger_release(sp1, 122);
  assert(x != NULL);
  assert(x->voleg.section == RELEASE);
  while (x->voleg.section < DONE) {
    sp_run(x);
  }
  return 0;
}
int test_sp_run() {
  setup();
  z->OverrideRootKey = 60;
  z->CoarseTune = 0;
  z->FineTune = 0;
  pcms[z->SampleId].sampleRate = SAMPLE_RATE;
  spinner* x = trigger_attack(0, 60, 122, z);
  assert(x->stride == 1.0f);
  z->OverrideRootKey = -1;
  (&pcms[z->SampleId])->originalPitch = 48;
  x = trigger_attack(0, 60, 122, z);
  printf("\nstr %f", x->stride);
  assert(x->stride == 2.0f);

  sp_run(x);
  sp_run(x);

  assert(x != NULL);
  for (int i = 0; i < 128 * 2; i++) printf("\no %f", x->outputf[i]);
  assert(x->outputf[40] != 0.0f);

  assert(x != NULL);
  return 0;
}

int test_trigger_attack() {
  setup();

  spinner* x = trigger_attack(0, 60, 122, z);
  assert(*x->inputf == sine_tb[0]);
  assert(*(x->inputf + 1) == sine_tb[1]);
  assert(x->voleg.sections[ATTACK].nsteps == cent2nstep(-5000));
  spinner* y = trigger_attack(0, 62, 122, z);
  spinner* zz = trigger_attack(0, 64, 122, z);
  return 0;
}
void setup() {
  for (int i = 0; i < 1028; i++) {
    sine_tb[i] = sinf(2 * M_PI * i * 440 / 1024);
    square_tb[i] = i > 2 + 1028 / 2 ? 1 : -1;
  }
  pcm = new_pcm(0, sine_tb);
  pcm->loopstart = 2;
  pcm->loopend = 1026;
  pcm->sampleRate = SAMPLE_RATE;
  pcm->originalPitch = 60;
  pcm->data = sine_tb;
  pcm2 = new_pcm(1, sine_tb);
  pcm2->loopstart = 2;
  pcm2->loopend = 1026;
  pcm2->sampleRate = SAMPLE_RATE;
  pcm2->originalPitch = 60;
  pcm2->data = square_tb;

  z = new_zone();
  z->VolEnvDelay = -12000;
  z->VolEnvAttack = -5000;
  z->SampleId = 0;
  z->Attenuation = 10;

  z2 = new_zone();
  z2->VolEnvDelay = -12000;
  z2->VolEnvAttack = -5000;
  z2->SampleId = 0;
  z2->Attenuation = 60;
}

int test_eg() {
  EG egs[1];
  eg_reset(egs);
  eg_init(egs, (EG_PARAMS){-12000, -12000, -12000, 2400, 700, 0});
  eg_setup(egs);
  EG* g = egs;
  sdata section = g->sections[g->section];
  printf(
      "\nsection %u, steps %u, section steps: %u, [%f-%f] egval %f inc%f "
      "coeficient %f "
      "%f",
      g->section, g->step, section.nsteps, section.min, section.max, g->egval,
      section.increment, section.coefficient,
      pow(10, (g->egval - MAX_EG) / 200));
  while (egs->section < SUSTAIN) {
    eg_setup(egs);
    eg_run(egs);
  }
  return 1;
  return 0;
}