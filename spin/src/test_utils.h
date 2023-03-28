#ifndef tuh
#define tuh
#include <stdio.h>
#include <stdlib.h>

#define printvoleg(x)                                                \
  {                                                                  \
    printf("=>i%s %f, egval:%f\t nsteps: %d\t stag: %d %d\n", "str", \
           x->voleg->egIncrement, x->voleg->egval, x->voleg->nsteps, \
           x->voleg->stage, x->position);                            \
  }

#define print_sp(x)                                                          \
  {                                                                          \
    printf("\nfract: %f stride:%f, posotion %d  %pp\n", x->fract, x->stride, \
           x->position, x->outputf);                                         \
  }

#define print_zone(x)                                                     \
  {                                                                       \
    printf("\nzone: %d sampleId %d sample mode %u\n ", x->zone->SampleId, \
           x->zone->SampleId, x->zone->VolEnvDelay);                      \
    printf("\n pcm : %p\n", x->inputf);                                   \
  }
#endif  // tuh
