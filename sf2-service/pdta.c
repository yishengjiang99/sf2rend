#include <stdlib.h>
#include <string.h>

#include "sf2.h"
extern void emitHeader(int pid, int bid, void *p);
extern void emitZone(int pid, void *ref);
extern void emitSample(void *ref, int start, int len);
extern void emitFilter(int type, uint8_t lo, uint8_t hi);
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
zone_t *presetZones;
zone_t *root;
zone_t *presets[0xff];

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

  for (int i = 0; i < nphdrs; i++) {
    if (phdrs[i].bankId == 0) {
      emitHeader(phdrs[i].pid, phdrs[i].bankId, phdrs + i);
      presets[phdrs[i].pid] = findPresetZones(i, findPresetZonesCount(i));
    } else if (phdrs[i].bankId == 128) {
      emitHeader(phdrs[i].pid, phdrs[i].bankId, phdrs + i);

      presets[phdrs[i].pid | phdrs[i].bankId] =
          findPresetZones(i, findPresetZonesCount(i));
    }
  }
  // get mem end;
  return malloc(4);
}

zone_t *findByPid(int pid, int bkid) {
  for (int i = 0; i < nphdrs - 1; i++) {
    if (phdrs[i].pid == pid && phdrs[i].bankId == bkid) {
      return presets[phdrs[i].pid | phdrs[i].bankId];
    }
  }

  return NULL;
}
void sanitizedInsert(short *attrs, int i, pgen_t *g) {
  switch (i % 60) {
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
int findPresetZonesCount(int i) {
  int nregions = 0;
  int instID = -1, lastSampId = -1;
  phdr phr = phdrs[i];
  for (int pbagIndex = phr.pbagNdx; pbagIndex < phdrs[i + 1].pbagNdx;
       pbagIndex++) {
    pbag *pg = pbags + pbagIndex;
    pgen_t *lastg = pgens + pg[pbagIndex + 1].pgen_id;
    int pgenId = pg->pgen_id;
    instID = -1;
    int lastPgenId =
        pbagIndex < npbags - 1 ? pbags[pbagIndex + 1].pgen_id : npgens - 1;
    for (int k = pgenId; k < lastPgenId; k++) {
      pgen *g = pgens + k;
      if (g->genid == Instrument) {
        instID = g->val.uAmount;
        lastSampId = -1;
        inst *ihead = insts + instID;
        int ibgId = ihead->ibagNdx;
        int lastibg = (ihead + 1)->ibagNdx;
        for (int ibg = ibgId; ibg < lastibg; ibg++) {
          lastSampId = -1;
          ibag *ibgg = ibags + ibg;
          pgen_t *lastig = ibg < nibags - 1 ? igens + (ibgg + 1)->igen_id
                                            : igens + nigens - 1;
          for (pgen_t *g = igens + ibgg->igen_id; g->genid != 60 && g != lastig;
               g++) {
            if (g->genid == SampleId) {
              nregions++;
            }
          }
        }
      }
    }
  }
  return nregions;
}
zone_t *findPresetZones(int i, int nregions) {
  short defvals[60] = defattrs;
  short zoneAttrs[60];
  zone_t *zones = (zone_t *)malloc((nregions + 1) * sizeof(zone_t));
  zone_t *dummy;
  int found = 0;
  short pattrs[60];
  short *pdefs;
  for (int pbagIndex = phdrs[i].pbagNdx; pbagIndex < phdrs[i + 1].pbagNdx;
       pbagIndex++) {
    pbag *pg = pbags + pbagIndex;
    pgen_t *lastg = pgens + pg[pbagIndex + 1].pgen_id;
    int pgenId = pg->pgen_id;
    int lastPgenId = pbags[pbagIndex + 1].pgen_id;
    if (pbagIndex == npbags - 1) lastPgenId = npgens - 1;
    pattrs[Unused1] = pbagIndex;
    if (pdefs) memcpy(pattrs, pdefs, 120);
    int instIds[255];
    int ninsts_ = 0;
    pattrs[Instrument] = -1;
    for (int k = pgenId; k < lastPgenId; k++) {
      pgen *g = pgens + k;
      sanitizedInsert(pattrs, g->genid, g);
    }
    if (pattrs[Instrument] == -1 && pdefs == NULL) {
      pdefs = pattrs;
    } else {
      rangesType pKeyRange = ((genAmountType)pattrs[KeyRange]).ranges;
      rangesType pVelRange = ((genAmountType)pattrs[VelRange]).ranges;

      inst *instrument = insts + pattrs[Instrument];
      short *instrument_defaults;
      short instrument_generators[60];
      for (int ibagIndex = instrument->ibagNdx;
           ibagIndex < instrument[1].ibagNdx; ibagIndex++) {
        if (instrument_defaults != NULL) {
          memcpy(instrument_generators, instrument_defaults, 120);
        }
        instrument_generators[SampleId] = -1;
        ibag *ib = ibags + ibagIndex;
        for (int igenIndex = ib->igen_id; igenIndex < ib[1].igen_id;
             igenIndex++) {
          igen *ig = igens + igenIndex;
          sanitizedInsert(instrument_generators, ig->genid, ig);
        }
        rangesType iKeyRange =
            ((genAmountType)instrument_generators[KeyRange]).ranges;
        rangesType iVelRange =
            ((genAmountType)instrument_generators[VelRange]).ranges;
        if (iKeyRange.lo > pKeyRange.hi) continue;
        if (iKeyRange.hi < pKeyRange.hi) continue;
        if (iVelRange.lo > pVelRange.hi) continue;
        if (iVelRange.hi < pVelRange.lo) continue;

        if (instrument_generators[SampleId] != -1) {
          for (int i = 0; i < 60; i++) {
            zoneAttrs[i] = instrument_generators[i] + pattrs[i];
          }
          memcpy(&zones[found++], zoneAttrs,
                 120);  // = (zone_t *)zoneAttrs;
        } else {
          if (instrument_defaults == NULL)
            instrument_defaults = instrument_generators;
        }
      }
    }
  }
  dummy = zones + found;
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
