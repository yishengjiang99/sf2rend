#include <assert.h>
#include <fcntl.h>
#include <libgen.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#include "add_generator_vals.c"
#include "gnames.h"
#include "pdta_extern_adapt.c"
#include "sf2.h"

#ifndef skipthis
extern void emitHeader(int pid, int bid, void *p);
extern void emitZone(int pid, void *ref);
extern void emitSample(int id, int pid, void *p);
extern void emitFilter(int type, uint8_t lo, uint8_t hi);
#endif

phdr *findPreset(int pid, int bank_id);
zone_t *findPresetZones(phdr *phr);

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
char *info;
int nsamples;
float *sdta;
int sdtastart;
phdr *presetHeaders[128];
phdr *phdrRoot = 0;
phdr drumHeaders[128];
zone_t *presetZones;
zone_t *root;
zone_t *presets[0xff];
zone_t *newZone() {
  zone_t *z = (zone_t *)malloc(sizeof(zone_t));
  short defz[60] = defattrs;
  return z;
}
void *readpdta(void *pdtabuffer) {
#define psread(section)                       \
  sh = (section_header *)pdtabuffer;          \
  pdtabuffer += sizeof(section_header);       \
  n##section##s = sh->size / sizeof(section); \
  section##s = (section *)pdtabuffer;         \
  pdtabuffer += sh->size;
  section_header *sh;
  psread(phdr);
  psread(pbag);
  psread(pmod);
  psread(pgen);
  psread(inst);
  psread(ibag);
  psread(imod);
  psread(igen);
  psread(shdr);
  return malloc(4);
}
void *loadpdta(void *pdtabuffer) {
  readpdta(pdtabuffer);
  for (uint16_t i = 34; i < 128; i++) {
    phdr *phr = findPreset(i, 0x00);

    if (phr) {
      presets[i] = findPresetZones(phr);
      emitHeader(phr->pid, phr->bankId, phr->name);
    }
  }
  for (uint16_t i = 0; i < 128; i++) {
    phdr *phr = findPreset(i, 128);
    if (phr) {
      presets[i + 128] = findPresetZones(phr);
      emitHeader(phr->pid, phr->bankId, phr->name);
    }
  }
  // get mem end;
  return malloc(4);
}

phdr *findPreset(int pid, int bank_id) {
  for (int i = 0; i < nphdrs; i++) {
    if (phdrs[i].pid == pid && phdrs[i].bankId == bank_id) {
      return &phdrs[i];
    }
  }
  return (void *)0;
}

zone_t *findPresetZones(phdr *phr) {
  int ident = 0;

  printf("\npreset %s,%hu,%hu:", phr->name, phr->pid, phr->bankId);
  // generator attributes
  short presetDefault[60] = {0};
  short pbagLegion[60] = {0};
  zone_t *zones = (zone_t *)malloc((55 + 1) * sizeof(zone_t));
  int found = 0;
  int instID = -1;
  int lastbag = (phr + 1)->pbagNdx;
  unsigned short instList[100];
  int instCount = 0;
  for (int j = phr->pbagNdx; j < (phr + 1)->pbagNdx; j++) {
    pbag *pbg = pbags + j;
    int pgenId = pbg->pgen_id;
    int lastPgenId = j < npbags - 1 ? pbags[j + 1].pgen_id : npgens - 1;
    memcpy(pbagLegion, presetDefault, 120);
    pbagLegion[Instrument] = -1;
    pbagLegion[PBagId] = j;
    if (j == phr->pbagNdx)
      printf("\n  Global Generators: %d", pgenId);
    else
      printf("\n  Preset Generators: %d", pgenId);
    for (int k = pgenId; k < lastPgenId; k++) {
      pgen *g = pgens + k;
      pbagLegion[g->genid] = g->val.shAmount;
      if (g->genid == 43 || g->genid == VelRange) {
        printf("\n        - %hu %s: %hu %hu", g->genid, generator[g->genid],
               g->val.ranges.lo, g->val.ranges.hi);
      } else {
        printf("\n        - %hu %s: %hd %hu", g->genid, generator[g->genid],
               g->val.shAmount, g->val.uAmount);
      }
      if (g->genid == Instrument) {
        instList[instCount++] = g->val.uAmount;
        inst *instPtr = insts + g->val.uAmount;
        printf("\n      - ibg-pbg ref: %hu, %hu", instPtr->ibagNdx,
               pbg->pgen_id);
      }
    }

    if (pbagLegion[Instrument] == -1) {
      memcpy(presetDefault, pbagLegion, 120);
    }
  }
  printf("\n  Instruments:");

  for (int i = 0; i < instCount; i++) {
    int dups = 0;
    for (int j = i - 1; j >= 0; j--) {
      if (instList[j] == instList[i]) {
        dups++;
        break;
      }
    }
    if (dups > 0) continue;
    inst *instPtr = insts + instList[i];
    int ibgId = instPtr->ibagNdx;
    int lastibg = (instPtr + 1)->ibagNdx;
    short instDefault[60] = defattrs;
    short instZone[60] = {0};

    printf("\n    - inst %hu: %s", instList[i], instPtr->name);
    for (int ibg = ibgId; ibg < lastibg; ibg++) {
      if (ibg == ibgId)
        printf("\n      default izone: %d", ibg);
      else
        printf("\n      izone: %d", ibg);
      memcpy(instZone, instDefault, 120);
      ibag *ibgg = ibags + ibg;
      pgen_t *lastig = igens + (ibgg + 1)->igen_id;
      for (igen *ig = igens + ibgg->igen_id; ig != lastig; ig++) {
        if (ig->genid == 43 || ig->genid == VelRange) {
          printf("\n        - %hu %s: %hu %hu", ig->genid, generator[ig->genid],
                 ig->val.ranges.lo, ig->val.ranges.hi);
        } else {
          printf("\n        - %hu %s: %hd %hu", ig->genid, generator[ig->genid],
                 ig->val.shAmount, ig->val.uAmount);
        }
        instZone[ig->genid] = ig->val.shAmount;
      }
      if (instZone[SampleId] == -1) {
        memcpy(instDefault, instZone, 120);
      } else {
        instZone[IBAGID] = ibg;
        // for (int i = 0; i < 60; i++) {
        //   add_pbag_val_to_zone(i, instZone, pbagLegion[i]);
        // }
        memcpy(zones + found, instZone, 120);
        emitZone(phr->pid, zones + found);
        found++;
      }
    }
  }

  zone_t *dummy = zones + found;
  dummy->SampleId = -1;
  return zones;
}

zone_t *filterForZone(zone_t *from, uint8_t key, uint8_t vel) {
  for (zone_t *z = from; z; z++) {
    if (z == 0 || z->SampleId == (short)-1) break;
    if (vel > 0 && (z->VelRange.lo > vel || z->VelRange.hi < vel)) continue;
    if (key > 0 && (z->KeyRange.lo > key || z->KeyRange.hi < key)) continue;
    return z;
  }
  if (vel > 0) return filterForZone(from, key, 0);
  if (key > 0) return filterForZone(from, 0, vel);
  return &presetZones[0];
}

void *shdrref() { return shdrs; }
void *presetRef() { return presets; }
void *instRef(int instId) { return insts + instId; }

int main(int argc, char **args) {
  const char *filename;
  if (argc < 2)
    filename = "file.sf2";
  else
    filename = args[1];
  printf("\n%s", filename);
  FILE *fd = fopen(filename, "r");
  char *str = malloc(strlen(basename((char *)filename)) + 5);

  sprintf(str, "cshf/%s.txt", basename((char *)filename));
  printf("\n%s", str);

  //  freopen(str, "w+", stdout);

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

  loadpdta(pdtabuffer);

  return 0;
}