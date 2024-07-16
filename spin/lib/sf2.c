#ifndef SF2_C
#define SF2_C

#include "sf2.h"
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifndef emitHeader
void emitHeader(int pid, int bid, void *p) {}
void emitZone(int pid, void *ref) {}
void emitSample(int id, int pid, void *name) {}
void emitFilter(int type, uint8_t lo, uint8_t hi) {}
#endif

void read_sdta(FILE *fd)
{
  if (sdtastart)
  {
    fseek(fd, sdtastart, SEEK_SET);
    data = (short *)malloc(nsamples * sizeof(short));
    sdta = (float *)malloc(nsamples * sizeof(float));
    float *trace = sdta;

    fread(data, sizeof(short), nsamples, fd);
    for (int i = 0; i < nsamples; i++)
    {
      *trace++ = *(data + i) / 32767.0f;
    }
  }
}
typedef struct _riff
{
  unsigned int size;
  char id[4];
} RIFF_CHUNK;
typedef struct _rifflist
{
  unsigned int size;

  char id[4];
  char list[4];
  // void *data;
} RIFFLIST;
typedef struct _riff_sub_chunk
{
  char id[4];
  unsigned int size;
  void *data;
} RIFF_SUBCHUNK;
typedef struct filter_zone
{
  phdr *header;
  pbag *global;

} TZONE;

char sfbk[4];
char *generator[60] = {"StartAddrOfs",
                       "EndAddrOfs",
                       "StartLoopAddrOfs",
                       "EndLoopAddrOfs",
                       "StartAddrCoarseOfs",
                       "ModLFO2Pitch",
                       "VibLFO2Pitch",
                       "ModEnv2Pitch",
                       "FilterFc",
                       "FilterQ",
                       "ModLFO2FilterFc",
                       "ModEnv2FilterFc",
                       "EndAddrCoarseOfs",
                       "ModLFO2Vol",
                       "Unused1",
                       "ChorusSend",
                       "ReverbSend",
                       "Pan",
                       "IBAGID",
                       "PBagId",
                       "Unused4",
                       "ModLFODelay",
                       "ModLFOFreq",
                       "VibLFODelay",
                       "VibLFOFreq",
                       "ModEnvDelay",
                       "ModEnvAttack",
                       "ModEnvHold",
                       "ModEnvDecay",
                       "ModEnvSustain",
                       "ModEnvRelease",
                       "Key2ModEnvHold",
                       "Key2ModEnvDecay",
                       "VolEnvDelay",
                       "VolEnvAttack",
                       "VolEnvHold",
                       "VolEnvDecay",
                       "VolEnvSustain",
                       "VolEnvRelease",
                       "Key2VolEnvHold",
                       "Key2VolEnvDecay",
                       "Instrument",
                       "Reserved1",
                       "KeyRange",
                       "VelRange",
                       "StartLoopAddrCoarseOfs",
                       "Keynum",
                       "Velocity",
                       "Attenuation",
                       "Reserved2",
                       "EndLoopAddrCoarseOfs",
                       "CoarseTune",
                       "FineTune",
                       "SampleId",
                       "SampleModes",
                       "Reserved3",
                       "ScaleTune",
                       "ExclusiveClass",
                       "OverrideRootKey",
                       "Dummy"};

RIFF_CHUNK rchunk[0];
RIFFLIST rlist[0];
RIFF_SUBCHUNK subc[0];
section_header sech[3];

#define readSection(section)                                          \
  fread(sh, sizeof(section_header), 1, fd);                           \
  n##section##s = sh->size / sizeof(section);                         \
  section##s = (section *)malloc(sh->size);                           \
  fread(section##s, sizeof(section), sh->size / sizeof(section), fd); \
  printf("%.4s \t %d\n", sh->name, sh->size);

void sanitizedInsert(short *attrs, int i, pgen_t *g)
{
  switch (i % 60)
  {
  case StartAddrOfs:
  case EndAddrOfs:
  case StartLoopAddrOfs:
  case EndLoopAddrOfs:
  case StartAddrCoarseOfs:
  case EndAddrCoarseOfs:
  case StartLoopAddrCoarseOfs:
  case EndLoopAddrCoarseOfs:
  case OverrideRootKey:
    attrs[i] = g->val.uAmount & 0x7f;
    break;
  default:
    attrs[i] = g->val.shAmount;
    break;
  }
}
#endif

#define clamp(val, min, max) val > max ? max : val < min ? min \
                                                         : val
static inline float fclamp(float val, float min, float max)
{
  return val > max ? max : val < min ? min
                                     : val;
}
static inline short add_pbag_val_to_zone(int genop, short ival, short pval)
{
  int irange[2], prange[2];
  switch (genop)
  {
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
    if (irange[1] > prange[1])
      irange[1] = prange[1];
    if (irange[0] < prange[0])
      irange[0] = prange[0];
    ival = (short)(irange[0] + (irange[1] << 8));
    return ival;
  case CoarseTune:
    printf("\n\t coarse %hd %hd", ival, pval);

    return 0;
  case SampleModes:
    printf("\nsfmod %hd %hd", ival, pval);
    return ival;
  default:
    return ival;
  }
}
phdr *findPreset(int pid, int bank_id)
{
  for (int i = 0; i < nphdrs; i++)
  {
    if (phdrs[i].pid == pid && phdrs[i].bankId == bank_id)
    {
      return &phdrs[i];
    }
  }
  return (void *)0;
}

float cent2freq(short cent)
{
  return powf(2, (float)cent / 1200.f) * 8.176;
}

void loopzone(phdr *phr, int midi, int velocity)
{
  int nregions = 0;
  int instID = -1, lastSampId = -1;
  printf("[%u %u] %s \n", phr->pid, phr->bankId, phr->name);

  for (int j = phr->pbagNdx; j < (phr + 1)->pbagNdx; j++)
  {
    pbag *pg = pbags + j;
    pgen_t *lastg = pgens + pg[j + 1].pgen_id;
    int pgenId = pg->pgen_id;
    instID = -1;
    int lastPgenId = j < npbags - 1 ? pbags[j + 1].pgen_id : npgens - 1;
    unsigned char plokey = 0, phikey = 127, plovel = 0, phivel = 127;
    if (j == phr->pbagNdx)
      printf("\n\tGlobal Generators: %d", pgenId);
    for (int k = pgenId; k < lastPgenId; k++)
    {
      pgen *g = pgens + k;
      if (g->genid == VelRange)
      {

        if (g->val.ranges.lo > velocity)
          break;
        if (g->val.ranges.hi < velocity)
          break;
        continue;
      }
      else if (g->genid == KeyRange)
      {
        if (g->val.ranges.lo > midi)
          break;
        if (g->val.ranges.hi < midi)
          break;
      }

      if (g->genid == VelRange || g->genid == KeyRange)
      {
        printf("\n\t%hu(%s): %hu %hu", g->genid, generator[g->genid],
               g->val.ranges.lo, g->val.ranges.hi);
      }
      else if (g->genid == Instrument)
      {
        instID = g->val.uAmount;
        inst *ihead = insts + instID;
        int ibgId = ihead->ibagNdx;
        int lastibg = (ihead + 1)->ibagNdx;
        for (int ibg = ibgId; ibg < lastibg; ibg++)
        {
          ibag *ibgg = ibags + ibg;
          pgen_t *lastig = ibg < nibags - 1 ? igens + (ibgg + 1)->igen_id
                                            : igens + nigens - 1;
          if (ibg == ihead->ibagNdx)
            printf("\n\t Inst Generators: %d", ibg);

          unsigned char ilokey = 0, ihikey = 127, ilovel = 0, ihivel = 127;

          for (pgen_t *g = igens + ibgg->igen_id; g->genid != 60 && g != lastig;
               g++)
          {
            if (g->genid == VelRange)
            {

              if (g->val.ranges.lo > velocity)
                break;
              if (g->val.ranges.hi < velocity)
                break;
            }
            else if (g->genid == KeyRange)
            {
              if (g->val.ranges.lo > midi)
                break;
              if (g->val.ranges.hi < midi)
                break;
            }

            if (g->genid == VelRange || g->genid == KeyRange)
            {
              printf("\n\t%hu(%s inst): %hu %hu", g->genid, generator[g->genid],
                     g->val.ranges.lo, g->val.ranges.hi);
            }

            else if (g->genid == SampleId)
            {
              if (g->val.uAmount >= nshdrs)
                break;
              nregions++;
              break;
            }

            else
            {
              if (g->genid == VolEnvRelease)
                printf("\n\t\tizone %hu %s: %d", g->genid, generator[g->genid],
                       g->val.shAmount);
            }
          }
        }
      }
      else
      {
        if (g->genid == VolEnvRelease)
          printf("\n\t\tpzone %hu %s: %hd", g->genid, generator[g->genid],
                 g->val.shAmount);
      }
    }
  }
}
int main(int argc, char **args)
{
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
  section_header *sh = (section_header *)malloc(sizeof(section_header));

  readSection(phdr);
  readSection(pbag);
  readSection(pmod);
  readSection(pgen);
  readSection(inst);
  readSection(ibag);
  readSection(imod);
  readSection(igen);
  readSection(shdr);
  phdr *phr = findPreset(0, 0);

  loopzone(phr, 56, 60);
  loopzone(phr, 54, 60);
  phr = findPreset(28, 0);
  loopzone(phr, 54, 111);

  return 0;
}
