#include <assert.h>
#include <stdio.h>
#include <stdlib.h>

#include "gnames.h"
#include "pdta.c"
#include "pdta_extern_adapt.c"
#include "sf2.h"

typedef struct {
  pgen *pdef;
  uint16_t n_pzones;
  pgen **pzones;
  igen *idef;
  uint32_t n_izones;
  igen **izones;
} ptree;
struct tsf_envelope {
  float delay, attack, hold, decay, sustain, release, keynumToHold,
      keynumToDecay;
};
struct tsf_voice_envelope {
  float level, slope;
  int samplesUntilNextSegment;
  short segment, midiVelocity;
  struct tsf_envelope parameters;
  int segmentIsExponential, isAmpEnv;
};
struct tsf_voice_lowpass {
  double QInv, a0, a1, b1, b2, z1, z2;
  int active;
};
struct tsf_voice_lfo {
  int samplesUntil;
  float level, delta;
};

struct tsf_region {
  int loop_mode;
  unsigned int sample_rate;
  unsigned char lokey, hikey, lovel, hivel;
  unsigned int group, offset, end, loop_start, loop_end;
  int transpose, tune, pitch_keycenter, pitch_keytrack;
  float attenuation, pan;
  struct tsf_envelope ampenv, modenv;
  int initialFilterQ, initialFilterFc;
  int modEnvToPitch, modEnvToFilterFc, modLfoToFilterFc, modLfoToVolume;
  float delayModLFO;
  int freqModLFO, modLfoToPitch;
  float delayVibLFO;
  int freqVibLFO, vibLfoToPitch;
};

#define _TSFREGIONOFFSET(TYPE, FIELD) \
  v = ((TYPE *)&((struct tsf_region *)0)->FIELD) - (TYPE *)0 \ 
  (unsigned char)(v)

int main() {
  printf("hello\n");
  char *filename = "file.sf2";

  FILE *fd = fopen(filename, "r");
  sheader_t *header = (sheader_t *)malloc(sizeof(sheader_t));
  header2_t *h2 = (header2_t *)malloc(sizeof(header2_t));
  fread(header, sizeof(sheader_t), 1, fd);
  printf("%.4s %.4s %.4s %u", header->name, header->sfbk, header->list,
         header->size);
  fread(h2, sizeof(header2_t), 1, fd);
  printf("\n%.4s %u", h2->name, h2->size);
  fseek(fd, h2->size, SEEK_CUR);
  fread(h2, sizeof(header2_t), 1, fd);
  printf("\n%.4s %u", h2->name, h2->size);
  fseek(fd, h2->size, SEEK_CUR);
  fread(h2, sizeof(header2_t), 1, fd);
  printf("\n%.4s %u", h2->name, h2->size);
  char *pdtabuffer = malloc(h2->size);
  fread(pdtabuffer, h2->size, h2->size, fd);
  readpdta(pdtabuffer);
  int i = 0, j = 0;
  phdr *p = phdrs;
  pbag *pb = pbags;
  pgen *pg = pgens;
  printf("\n%s", p->name);

  for (; i < npgens; i++, pg++) {
    if (i >= (pb + 1)->pgen_id) {
      pb++;
      printf("\n");
      j++;
    }

    if (j > (p + 1)->pbagNdx) {
      p++;
      printf("\n%s", p->name);
    }
    printf("\n\t- %s %hd", generator[pg->genid], pg->val);
  }
  return 1;
}