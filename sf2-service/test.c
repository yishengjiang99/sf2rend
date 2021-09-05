#include <stdio.h>
#include <stdlib.h>
#include <sys/stat.h>
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
                       "Unused2",
                       "Unused3",
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

#include "sf2.h"
typedef struct {
  rangesType vel, key;
  pgen *attrs;
} conditionals;

typedef struct {
  phdr *pheader;
  unsigned short pg0, pgf;
  unsigned char lokey, hikey;
} pzone;

typedef struct {
  char name[4];
  unsigned int size;
} riff;
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

int mkpdtaf() {
  FILE *fd = fopen("file.sf2", "rb");
  FILE *pdtafd = fopen("file.pdta", "wb");
  char c;
  char seek[4] = {'p', 'd', 't', 'a'};
  int m = 0;
  while (!feof(fd)) {
    c = fgetc(fd);
    if (c == seek[m])
      m++;
    else
      m = 0;
    if (m >= 4) break;
    // printf("%d %c\n", m, c);
  }
  while (!feof(fd)) {
    fputc(fgetc(fd), pdtafd);
  }
  fclose(fd);
  fclose(pdtafd);
}
int main() {
  mkpdtaf();
  struct stat fst;
  stat("file.pdta", &fst);
  printf("%llu\n", fst.st_size);
  char pdta[fst.st_size];
  char *pdtabuffer = &pdta[0];
  FILE *pdtafd = fopen("file.pdta", "rb");
  fread(pdtabuffer, fst.st_size, 1, pdtafd);
  riff *sh;

#define read(section)                         \
  sh = (riff *)pdtabuffer;                    \
  pdtabuffer += 8;                            \
  n##section##s = sh->size / sizeof(section); \
  section##s = (section *)pdtabuffer;         \
  pdtabuffer += sh->size;

  read(phdr);
  read(pbag);
  read(pmod);
  read(pgen);
  read(inst);
  read(ibag);
  read(imod);
  read(igen);

  printf("%d %d %d\n", nphdrs, npbags, npgens);

  pzone tunes[128];
  for (int i = 0; i < 128; i++) {
    for (int j = 0; j < nphdrs; j++) {
      if (phdrs[j].bankId != 0) continue;
      if (phdrs[j].pid == i) {
        tunes[i].pheader = &phdrs[j];
        break;
      }
    }
    phdr *ph = tunes[i].pheader;
    unsigned short pg0, pgf;
    pg0 = pbags[ph->pbagNdx].pgen_id;
    pgf = pbags[ph[1].pbagNdx].pgen_id;
    printf("\n");

    printf("\n%.20s, %d:%hd %hd", ph->name, i, pg0, pgf);

    int lastInstId = -1;
    for (int pg = pg0; pg < pgf; pg++) {
      printf("\n[p]%d %s %d", pgens[pg].genid, generator[pgens[pg].genid],
             pgens[pg].val.shAmount);

      if (pgens[pg].genid == Instrument &&
          pgens[pg].val.uAmount != lastInstId) {
        inst *instrumentRef = insts + pgens[pg].val.uAmount;
        lastInstId = pgens[pg].val.uAmount;
        inst *ihead = insts + lastInstId;
        printf("\nINST %.20s", ihead->name);

        int ibgId = ihead->ibagNdx;
        int lastibg = (ihead + 1)->ibagNdx;
        for (int ibg = ibgId; ibg < lastibg; ibg++) {
          for (int ig = ibags[ibg].igen_id; ig < ibags[ibg + 1].igen_id; ig++) {
            igen igg = igens[ig];
            printf("\n%s %d", generator[igg.genid], igg.val.shAmount);
            if (igg.genid == SampleId) {
              printf("\n");
            }
          }
        }
      }
    }
  }
  return 0;
}
