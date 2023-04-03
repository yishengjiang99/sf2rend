#if !defined(eg2h)
#define eg2h

#include "spin2.h"
extern float powf(float base, float exp);
extern float log2f(float exp);

#define SAMPLE_RATE 44100.0f
#define cent2nstep(cent) (int)(powf(2.0f, (float)cent / 1200.0f) * SAMPLE_RATE)
#define MAX_EG 960.f
#define clamp(val, min, max) val > max ? max : val < min ? min : val
#define log_coefficient(start, target, steps) \
  (log2f((float)target) - log2f((float)start)) / (float)steps

enum EG_SECTION {
  INIT = 0,
  DELAY = 1,
  ATTACK,
  HOLD,
  DECAY,
  SUSTAIN,
  RELEASE,
  DONE,
};
typedef enum EG_SECTION eg_section_t;

/*
min/max increment for a given stage
coeffient is used for multiplicative stages
*/
typedef struct {
  float min, max, increment, coefficient;
  uint32_t nsteps;
} sdata;

typedef struct _eg {
  sdata sections[DONE + 1];
  uint32_t step, step_since_release;
  float egval;
  eg_section_t section;
  int is_released;
} EG;
typedef struct {
  short delay, attack, hold, decay, sustain, release;
} EG_PARAMS;

void eg_reset(EG* eg) {
  eg->section = INIT;
  eg->step = 0;
  eg->step_since_release = 0;
  eg->egval = 0.0f;
  eg->is_released = 0;
}

void eg_setup(EG* g) {
  if (g->section == DONE) return;
  sdata section = g->sections[g->section];
  while (g->section < DONE && g->step >= section.nsteps) {
    g->section++;
    section = g->sections[g->section];
  }
  g->egval = clamp(g->egval, section.min, section.max);
}
float eg_run(EG* g) {
  sdata section = g->sections[g->section];
  g->step++;
  if (g->is_released) {
    g->step_since_release++;
  }
  g->egval += section.increment;
  g->egval += g->egval * section.coefficient;
  g->egval = clamp(g->egval, section.min, section.max);
  return g->egval;
}
void eg_init(EG* g, EG_PARAMS params) {
  params.sustain = clamp(params.sustain, 0, MAX_EG);
  uint32_t attack_steps =
      params.attack > -12000 ? cent2nstep(params.attack) : 0;
  uint32_t delay_steps = params.delay > -12000 ? cent2nstep(params.delay) : 0;
  uint32_t hold_steps = cent2nstep(params.hold);
  uint32_t release_steps = cent2nstep(params.release);
  float sustainPercent = params.sustain / 1000.0f;
  float sustainLevel = MAX_EG - MAX_EG * sustainPercent;
  uint32_t decay_steps = cent2nstep(params.decay) * (1 - sustainPercent);
  float decayIncre = (sustainLevel - MAX_EG) / (float)decay_steps;
  int max_steps = 0;

  g->sections[INIT] = (sdata){
      0.0f, 0.0f, 0.0f, 0.f, 0,
  };
  g->sections[DELAY] = (sdata){0.0f, 0.0f, 0.0f, 0.f, max_steps += delay_steps};
  g->sections[ATTACK] =
      (sdata){1.0f, MAX_EG, 0.f, log_coefficient(1, MAX_EG, attack_steps),
              max_steps += attack_steps};
  g->sections[HOLD] =
      (sdata){MAX_EG, MAX_EG, 0.0f, 0.0f, max_steps += hold_steps},
  g->sections[DECAY] =
      (sdata){sustainLevel, MAX_EG, decayIncre, 0, max_steps += decay_steps};
  g->sections[SUSTAIN] =
      (sdata){sustainLevel, sustainLevel, 0.0f, 0.0f, 0xfffffff},
  g->sections[RELEASE] =
      (sdata){0.0f, sustainLevel, -1.0f * MAX_EG / (float)release_steps, 0.0f,
              max_steps += release_steps};
  g->sections[DONE] = (sdata){0.0f, 0.0f, 0.0f, 0.0f, 0};
  g->section = INIT;
}
void eg_release(EG* e) {
  e->is_released = 1;
  e->sections[RELEASE].max = e->egval;
  e->sections[RELEASE].nsteps =
      e->step + (0.0f - e->egval) / e->sections[RELEASE].increment;
  e->section = RELEASE;
}

#endif  // eg2h
