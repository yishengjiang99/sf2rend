#include "sf2.h"
#define cli 1
#ifdef cli
extern int printf(const char *__restrict, ...);
#endif

int nphdrs, npbags, npgens, npmods, nshdrs, ninsts, nimods, nigens, nibags;
phdr *phdrs;
pbag *pbags;
pmod *pmods;
pgen *pgens;
inst *insts;
ibag *ibags;
imod *imods;
igen *igens;
shdr *shdrs;
short *data;
void *info;
int nsamples;
float *sdta;
int sdtastart;

#define clamp(val, min, max) val > max ? max : val < min ? min : val
inline float fclamp(float val, float min, float max) {
  return val > max ? max : val < min ? min : val;
}
inline short add_pbag_val_to_zone(int genop, short ival, short pval) {
  int irange[2], prange[2];
  switch (genop) {
    case StartAddrOfs:
    case EndAddrOfs:
    case StartLoopAddrOfs:
    case EndLoopAddrOfs:
    case StartAddrCoarseOfs:
    case EndAddrCoarseOfs:
    case StartLoopAddrCoarseOfs:
    case EndLoopAddrCoarseOfs:
      return ival;
    case ModLFODelay:
    case VibLFODelay:
    case ModEnvDelay:
    case VolEnvDelay:
    case VolEnvHold:
    case ModEnvHold:
      return clamp(ival + pval, -12000, 5000);
    case ModEnvAttack:
    case ModEnvDecay:
    case ModEnvRelease:
    case VolEnvAttack:
    case VolEnvDecay:
    case VolEnvRelease:
      return clamp(ival + pval, -12000, 8000);
    case Key2ModEnvHold:
    case Key2ModEnvDecay:
    case Key2VolEnvHold:
    case Key2VolEnvDecay:
      return (short)clamp(ival + pval, -12000, 1200);
    case Pan:
      return (short)fclamp((float)ival + (float)pval * 0.001f, -.5f, .5f);
    case Attenuation:
      return (short)fclamp((float)ival + (float)pval, 0.0f, 1440.0f);
    case ModEnvSustain:
      return (short)clamp(ival + pval, 0, 1000);
    case VolEnvSustain:
      return (short)fclamp((float)ival + (float)pval, 0, 1400.0f);
    case ModLFO2Pitch:
    case VibLFO2Pitch:
    case ModLFO2FilterFc:
    case ModEnv2FilterFc:
    case ModLFO2Vol:
    case ModEnv2Pitch:
      return (short)clamp(ival + pval, -12000, 12000);
    case FilterFc:
      return (short)clamp(ival + pval, 1500, 13500);
    case FilterQ:
      return (short)clamp(ival + pval, 0, 960);
    case VibLFOFreq:
    case ModLFOFreq:
      return (short)clamp(ival + pval, -16000, 4500);
    case Instrument:
      return pval;
    case KeyRange:
    case VelRange:
      irange[0] = ival & 0x007f;
      irange[1] = ival >> 8;
      prange[0] = pval & 0x007f;
      prange[1] = pval >> 8;
      if (irange[1] > prange[1]) irange[1] = prange[1];
      if (irange[0] < prange[0]) irange[0] = prange[0];
      ival = (short)(irange[0] + (irange[1] << 8));
      return ival;
    case FineTune:
    case CoarseTune:
      return ival;
    case SampleModes:
      return ival;
    default:
      return ival;
  }
}
phdr *findPreset(int pid, int bank_id) {
  for (int i = 0; i < nphdrs; i++) {
    if (phdrs[i].pid == pid && phdrs[i].bankId == bank_id) {
      return &phdrs[i];
    }
  }
  return (void *)0;
}
pgen_t *globalZone(phdr *phr) { return &pgens[pbags[phr->pbagNdx].pgen_id]; }

void readpdta(void *pdtabuffer) {
  section_header *sh;

#define srr(section)                          \
  sh = (section_header *)pdtabuffer;          \
  pdtabuffer += 8;                            \
  n##section##s = sh->size / sizeof(section); \
  section##s = (section *)pdtabuffer;         \
  pdtabuffer += sh->size;                     \
  printf("%.4s \t %d\n", sh->name, sh->size);

  srr(phdr);
  srr(pbag);
  srr(pmod);
  srr(pgen);
  srr(inst);
  srr(ibag);
  srr(imod);
  srr(igen);
  srr(shdr);
  return;
}

void loopzone(phdr *phr, int midi, int velocity) {
/* filter based on ranges*/
#define filter(g, nextbag)                           \
  for (; g->genid <= VelRange; g++) {                \
    if (g->genid == VelRange) {                      \
      if (g->val.ranges.lo > velocity) goto nextbag; \
      if (g->val.ranges.hi < velocity) goto nextbag; \
    } else if (g->genid == KeyRange) {               \
      if (g->val.ranges.lo > midi) goto nextbag;     \
      if (g->val.ranges.hi < midi) goto nextbag;     \
    }                                                \
  }

  pgen *g, *ig;
  for (int j = phr->pbagNdx + 1; j < (phr + 1)->pbagNdx; j++) {
    pbag *pg = pbags + j;
    int pgenId = pg->pgen_id;
    int lastPgenId = pbags[j + 1].pgen_id - 1;
    g = pgens + pgenId;
    filter(g, nextbag);

    g = pgens + lastPgenId;
    if (g->genid != Instrument) {
      goto nextbag;
    }

    int instID = g->val.uAmount;
    inst *ihead = insts + instID;
    int ibgId = ihead->ibagNdx;
    int lastibg = (ihead + 1)->ibagNdx - 1;
    for (int ibg = lastibg; ibg >= ibgId; ibg--) {
      ibag *ibgg = ibags + ibg;
      ig = igens + ibgg->igen_id;
      filter(ig, nextibag);
      int lastIgenId = (ibgg + 1)->igen_id - 1;
      for (int i = lastIgenId; i >= ibgg->igen_id; i--) {
        ig = igens + i;
        printf("\n\t\tizone %hu %s: %d", ig->genid, generator[ig->genid],
               ig->val.shAmount);
      }
    nextibag:
      printf("\n");
    }

    printf("\nparse pzone");
    for (int k = pgenId; k <= lastPgenId; k++) {
      g = pgens + k;
      printf("\n\t\tpzone %hu %s: %hd", g->genid, generator[g->genid],
             g->val.shAmount);
    }
  nextbag:
    printf("..");
  }
}
// #define testingenv 18
#ifdef testingenv
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
void read_sdta(FILE *fd) {
  if (sdtastart) {
    fseek(fd, sdtastart, SEEK_SET);
    data = (short *)malloc(nsamples * sizeof(short));
    sdta = (float *)malloc(nsamples * sizeof(float));
    float *trace = sdta;

    fread(data, sizeof(short), nsamples, fd);
    for (int i = 0; i < nsamples; i++) {
      *trace++ = *(data + i) / 32767.0f;
    }
  }
}
int main(int argc, char **args) {
  char sfbk[4];

  RIFF_CHUNK rchunk[0];
  RIFFLIST rlist[0];
  RIFF_SUBCHUNK subc[0];
  section_header sech[3];
  char *filename = "file.sf2";
  FILE *fd = fopen(filename, "r");
  fread(sfbk, 4, 1, fd);
  printf("%.4s\n", sfbk);
  fread(rlist, sizeof(RIFFLIST), 1, fd);
  printf("%d\t%.4s\t%.4s \n", rlist->size, rlist->id, rlist->list);
  fread(rchunk, sizeof(RIFF_CHUNK), 1, fd);
  printf("%d\t%.4s\n", rchunk->size, rchunk->id);
  info = (char *)malloc(rchunk->size);
  fread(info, rchunk->size, 1, fd);
  fread(rchunk, sizeof(RIFF_CHUNK), 1, fd);
  printf("%d\t%.4s\n", rchunk->size, rchunk->id);
  fread(sech, sizeof(section_header), 1, fd);
  printf("%.4s\t%d\n", sech->name, sech->size);
  nsamples = sech->size / 2;
  short *d = (short *)malloc(sech->size);
  fread(d, nsamples, 2, fd);
  fread(sfbk, 4, 1, fd);
  printf("%.4s\n", sfbk);
  fread(rchunk, sizeof(RIFF_CHUNK), 1, fd);
  printf("%d\t%.4s\n", rchunk->size, rchunk->id);
  char *pdtabuffer = (char *)malloc(rchunk->size);
  fread(pdtabuffer, rchunk->size, 1, fd);
  readpdta(pdtabuffer);
  phdr *phr = findPreset(3, 0);
  loopzone(phr, 56, 110);
  return 0;
}
#endif