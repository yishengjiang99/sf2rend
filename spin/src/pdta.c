#include <math.h>
#include <stdlib.h>
#include <string.h>

#include "add_generator_vals.c"
#include "sf2.h"

#ifndef skipthis
extern void emitHeader(int pid, int bid, void *p);
extern void emitZone(int pid, void *ref);
extern void emitSample(int id, int pid, void *p);
extern void emitFilter(int type, uint8_t lo, uint8_t hi);
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
enum {
  phdrHead = 0x1000,
  instHead = 0x2000,
  shdrHead = 0x4000,
} headertype;
#define read(section)                         \
  sh = (section_header *)pdtabuffer;          \
  pdtabuffer += 8;                            \
  n##section##s = sh->size / sizeof(section); \
  section##s = (section *)pdtabuffer;         \
  pdtabuffer += sh->size;

void *loadpdta(void *pdtabuffer) {
  section_header *sh;

  read(phdr);
  read(pbag);
  read(pmod);
  read(pgen);
  read(inst);
  read(ibag);
  read(imod);
  read(igen);
  read(shdr);

  for (uint16_t i = 0; i < 128; i++) {
    phdr *phr = findPreset(i, 0x00);

    // printf("[%u %u] %s \n", phr->pid, phr->bankId,phr->name);
    if (phr) {
      int n = findPresetZonesCount(phr);
      // printf("\t num %d\n",n);
      presets[(uint32_t)i] = findPresetZones(phr, n);
      emitHeader(phr->pid, phr->bankId, phr->name);
    }
    phr = findPreset(i, 128);

    // printf("[%u %u] %s \n", phr->pid, phr->bankId,phr->name);
    if (phr) {
      int n = findPresetZonesCount(phr);
      // printf("\t num %d\n",n);
      presets[(uint32_t)i + 128] = findPresetZones(phr, n);
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

#define filter_zone(g, ig)                    \
  if (g->val.ranges.lo > ig->val.ranges.hi || \
      g->val.ranges.hi < ig->val.ranges.lo || \
      ig->val.ranges.lo == ig->val.ranges.hi) \
    continue;

int findPresetZonesCount(phdr *phr) {
  int nregions = 0;
  int instID = -1, lastSampId = -1;
  for (int j = phr->pbagNdx; j < (phr + 1)->pbagNdx; j++) {
    pbag *pg = pbags + j;
    pgen_t *lastg = pgens + pg[j + 1].pgen_id;
    int pgenId = pg->pgen_id;
    instID = -1;
    int lastPgenId = j < npbags - 1 ? pbags[j + 1].pgen_id : npgens - 1;
    unsigned char plokey = 0, phikey = 127, plovel = 0, phivel = 127;
    for (int k = pgenId; k < lastPgenId; k++) {
      pgen *g = pgens + k;
      if (k == VelRange) {
        plovel = g->val.ranges.lo;
        phivel = g->val.ranges.hi;
        continue;
      }
      if (k == KeyRange) {
        plokey = g->val.ranges.lo;
        phikey = g->val.ranges.hi;
        continue;
      }
      if (plokey == phikey) continue;
      if (g->genid == Instrument) {
        instID = g->val.uAmount;
        inst *ihead = insts + instID;
        int ibgId = ihead->ibagNdx;
        int lastibg = (ihead + 1)->ibagNdx;
        for (int ibg = ibgId; ibg < lastibg; ibg++) {
          ibag *ibgg = ibags + ibg;
          pgen_t *lastig = ibg < nibags - 1 ? igens + (ibgg + 1)->igen_id
                                            : igens + nigens - 1;
          unsigned char ilokey = 0, ihikey = 127, ilovel = 0, ihivel = 127;

          for (pgen_t *g = igens + ibgg->igen_id; g->genid != 60 && g != lastig;
               g++) {
            if (g->genid == KeyRange) {
              ilokey = g->val.ranges.lo;
              ihikey = g->val.ranges.hi;
              continue;
            }
            if (g->genid == VelRange) {
              ilovel = g->val.ranges.lo;
              ihivel = g->val.ranges.hi;
              continue;
            }
            if (k == VelRange || k == KeyRange) {
              if (g->val.ranges.lo == g->val.ranges.hi) break;
            }
            if (g->genid == SampleId) {
              if (g->val.uAmount >= nshdrs) break;
              nregions++;
              break;
            }
          }
        }
      }
    }
  }
  return nregions;
}
zone_t *findPresetZones(phdr *phr, int nregions) {
  // generator attributes
  short presetDefault[60] = defattrs;
  short pbagLegion[60] = {0};
  zone_t *zones = (zone_t *)malloc((nregions + 1) * sizeof(zone_t));
  int found = 0;
  int instID = -1;
  int lastbag = (phr + 1)->pbagNdx;
  for (int j = phr->pbagNdx; j < (phr + 1)->pbagNdx; j++) {
    pbag *pg = pbags + j;
    pgen_t *lastg = pgens + pg[j + 1].pgen_id;
    int pgenId = pg->pgen_id;
    int lastPgenId = j < npbags - 1 ? pbags[j + 1].pgen_id : npgens - 1;
    memcpy(pbagLegion, presetDefault, 120);
    pbagLegion[Instrument] = -1;
    pbagLegion[Unused1] = j;
    for (int k = pgenId; k < lastPgenId; k++) {
      pgen *g = pgens + k;
      combine_pattrs(g->genid, pbagLegion, g->val.shAmount);
      if (g->genid == Instrument) {
        pbagLegion[Instrument] = g->val.uAmount;
        int sampleID = -1;
        inst *instrument_ptrs = insts + pbagLegion[Instrument];
        int ibgId = instrument_ptrs->ibagNdx;
        int lastibg = (instrument_ptrs + 1)->ibagNdx;
        short instDefault[60] = defattrs;
        short instZone[60] = {0};
        instZone[SampleId] = -1;
        for (int ibg = ibgId; ibg < lastibg; ibg++) {
          memcpy(instZone, instDefault, 120);
          ibag *ibgg = ibags + ibg;
          pgen_t *lastig = igens + (ibgg + 1)->igen_id;
          for (pgen_t *ig = igens + ibgg->igen_id; ig != lastig; ig++) {
            instZone[ig->genid] = ig->val.shAmount;
            if (k == VelRange || k == KeyRange) {
              filter_zone(g, ig);
              if (ig->val.ranges.lo == ig->val.ranges.hi) break;
            }
            if (ig->genid == SampleId) {
              if (ig->val.uAmount >= nshdrs) break;
              instZone[SampleId] = ig->val.shAmount;
              instZone[Unused2] = ibg;

              for (int i = 0; i < 60; i++) {
                add_pbag_val_to_zone(i, instZone, pbagLegion[i]);
              }

              memcpy(zones + found, instZone, 120);
              emitZone(phr->pid, zones + found);
              //  emitZone(phr->pid, zones + found);

              found++;
            } else {
              //  combine_pattrs(ig->genid, instZone, ig->val.shAmount);
            }
          }
          if (instZone[SampleId] == -1) {
            memcpy(instDefault, instZone, 120);
          }
        }
      }
    }
    if (pbagLegion[Instrument] == -1) {
      memcpy(presetDefault, pbagLegion, 120);
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