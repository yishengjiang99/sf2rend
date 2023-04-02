#include <math.h>
#include <stdio.h>
#include <stdlib.h>

#include "assert.h"
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

  trigger_attack(0, 60, 122, z);
  trigger_attack(0, 62, 122, z);
  trigger_attack(0, 63, 122, z);
  spinner* y = find_sp(0, 62);
  assert(y != NULL);
  sp_run_all();
  spinner* x = trigger_release(0, 60, 122);
  assert(x != NULL);
  assert(x->voleg.section == RELEASE);
  while (x->voleg.section < DONE) {
    sp_run_all();
  }
  remove_queue();

  assert(queue_count() == 2);

  y = find_sp(0, 63);
  assert(y != NULL);
  spinner* y1 = trigger_release(0, 63, 122);
  spinner* y2 = trigger_release(0, 62, 122);
  while (y2->voleg.section < DONE || y1->voleg.section < DONE) {
    sp_run_all();
  }
  assert(queue_count() == 0);

  return 0;
}
int test_sp_run() {
  sp_queue = NULL;
  test_trigger_attack();
  sp_run_all();
  spinner* x = sp_queue->sp;
  assert(x != NULL);
  assert(x->outputf[40] > 0.0f);

  x = sp_queue->next->sp;
  assert(x != NULL);
  assert(x->outputf[40] > 0.0f);
  return 0;
}

int test_trigger_attack() {
  setup();

  spinner* x = trigger_attack(0, 60, 122, z);
  assert(*x->inputf == sine_tb[0]);
  assert(*(x->inputf + 1) == sine_tb[1]);
  assert(x->voleg.sections[ATTACK].nsteps == cent2nstep(-5000));
  assert(sp_queue->sp == x);
  spinner* y = trigger_attack(0, 62, 122, z);
  spinner* zz = trigger_attack(0, 64, 122, z);
  assert(sp_queue->next->sp == y);
  return 0;
}
void setup() {
  queue_reset();
  for (int i = 0; i < 1028; i++) {
    sine_tb[i] = sinf(2 * M_PI * i * 440 / 1024);
    square_tb[i] = i > 2 + 1028 / 2 ? 1 : -1;
  }
  pcm = new_pcm(0, sine_tb);
  pcm->loopstart = 2;
  pcm->loopend = 1026;
  pcm->sampleRate = 32000;
  pcm->originalPitch = 60;
  pcm->data = sine_tb;
  pcm2 = new_pcm(1, sine_tb);
  pcm2->loopstart = 2;
  pcm2->loopend = 1026;
  pcm2->sampleRate = 32000;
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
  eg_init(egs, (EG_PARAMS){-12000, -12000, -12000, -2222, 1000, 0});
  eg_setup(egs);

  while (egs->section < DONE) {
    if (egs->step % 128 == 0) eg_setup(egs);
    if (!egs->is_released && egs->step >= 2000) eg_release(egs);
    eg_run(egs);
  }

  return 0;
}