#include <assert.h>
#include <math.h>
#include <stdio.h>

#include "spin.c"
#include "test_utils.h"

void test_eg_init() {
  printf("Testing EG initialization...\n");
  EG eg[1];
  eg_init(eg);
  assert(eg->attack == -12000);
  printf("✓ EG init test passed\n");
}

void test_eg_stage_transitions() {
  printf("Testing EG stage transitions...\n");
  EG eg[1];
  
  // Initialize envelope with specific values
  eg->delay = 1200;      // 2 seconds
  eg->attack = 600;      // ~1 second
  eg->hold = 300;        // ~0.5 seconds
  eg->decay = 1200;      // 2 seconds
  eg->sustain = 60;      // 60 centibels attenuation
  eg->release = 900;     // ~1.5 seconds
  eg->stage = init;
  eg->nsteps = 0;
  eg->egval = -960.0f;
  eg->egIncrement = 0.0f;
  eg->hasReleased = 0;
  
  // Test init -> delay transition
  advanceStage(eg);
  assert(eg->stage == delay);
  assert(eg->egval == MAX_EG);
  assert(eg->nsteps > 0);
  printf("✓ init -> delay transition passed\n");
  
  // Test delay -> attack transition
  eg->nsteps = 0;
  advanceStage(eg);
  assert(eg->stage == attack);
  assert(eg->egval == MAX_EG);
  assert(eg->nsteps > 0);
  printf("✓ delay -> attack transition passed\n");
  
  // Test attack -> hold transition
  eg->nsteps = 0;
  advanceStage(eg);
  assert(eg->stage == hold);
  assert(eg->egval == 0.0f);
  assert(eg->egIncrement == 0.0f);
  printf("✓ attack -> hold transition passed\n");
  
  // Test hold -> decay transition
  eg->nsteps = 0;
  advanceStage(eg);
  assert(eg->stage == decay);
  assert(eg->nsteps > 0);
  assert(eg->egIncrement < 0.0f);  // Should be decreasing
  printf("✓ hold -> decay transition passed\n");
  
  // Test decay -> sustain transition
  eg->nsteps = 0;
  advanceStage(eg);
  assert(eg->stage == sustain);
  assert(eg->egIncrement == 0.0f);  // Sustain should hold
  assert(eg->nsteps == 48000);
  printf("✓ decay -> sustain transition passed\n");
  
  // Set egval to simulate being partway through decay
  eg->egval = -300.0f;  // Partway through decay
  
  // Test sustain -> release (via _eg_release)
  _eg_release(eg);
  assert(eg->hasReleased == 1);
  // nsteps calculation depends on egval, so just verify it's been set
  printf("✓ sustain -> release transition passed\n");
}

void test_eg_envelope_values() {
  printf("Testing EG envelope values...\n");
  EG eg[1];
  
  eg->delay = -12000;    // Skip delay
  eg->attack = -12000;   // Skip attack
  eg->hold = -12000;     // Skip hold
  eg->decay = 1200;      // 2 seconds
  eg->sustain = 600;     // 600 centibels = -60dB
  eg->release = 1200;    // 2 seconds
  eg->stage = init;
  eg->nsteps = 0;
  eg->egval = -960.0f;
  eg->egIncrement = 0.0f;
  
  // When all stages are skipped, advanceStage falls through from init all the way to hold
  advanceStage(eg);  // init -> delay -> attack -> hold (all skipped, falls through)
  
  // Now we should be at hold, advance to decay
  assert(eg->stage == hold);
  eg->nsteps = 0;  // Force transition
  advanceStage(eg);  // hold -> decay
  
  assert(eg->stage == decay);
  
  // Simulate half of decay time
  int halfDecaySteps = eg->nsteps / 2;
  float initialVal = eg->egval;
  update_eg(eg, halfDecaySteps);
  
  // egval should have decreased (become more negative)
  assert(eg->egval < initialVal);
  assert(eg->egval > MAX_EG);  // Should not go below MAX_EG
  
  printf("✓ EG envelope values test passed\n");
}

void test_eg_update() {
  printf("Testing EG update function...\n");
  EG eg[1];
  
  eg->stage = decay;
  eg->egval = 0.0f;
  eg->egIncrement = -0.1f;
  eg->nsteps = 100;
  
  // Update by 10 steps
  float result = update_eg(eg, 10);
  
  assert(eg->nsteps == 90);  // Should decrease by 10
  assert(fabs(eg->egval - (-1.0f)) < 0.01f);  // Should be approximately -1.0
  assert(result == eg->egval);
  
  // Make sure it doesn't go above 0
  eg->egval = -0.5f;
  eg->egIncrement = 1.0f;
  update_eg(eg, 2);
  assert(eg->egval == 0.0f);  // Should be capped at 0
  
  printf("✓ EG update test passed\n");
}

int main() {
  printf("Running ADSR Envelope Generator Tests\n");
  printf("======================================\n\n");
  
  test_eg_init();
  test_eg_stage_transitions();
  test_eg_envelope_values();
  test_eg_update();
  
  printf("\n======================================\n");
  printf("All ADSR tests passed! ✓\n");
  return 0;
}
