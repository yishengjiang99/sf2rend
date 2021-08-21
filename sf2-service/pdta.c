#include <math.h>
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
static inline void sanitizedInsert(short *attrs, int i, pgen_t *g) {
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
    // case VolEnvDelay:
    // case VolEnvAttack:
    // case VolEnvHold:
    // case VolEnvDecay:
    // case VolEnvRelease:
    // case ModEnvDelay:
    // case ModEnvAttack:
    // case ModEnvHold:
    // case ModEnvDecay:
    // case ModEnvRelease:
    //   attrs[i] = powf(2, g->val.shAmount / 1200);
    //   break;
    default:
      attrs[i] = g->val.shAmount;
      break;
  }
}
int findPresetZonesCount(int i) {
  int nregions = 0;
  int instID = -1, lastSampId = -1;
  phdr phr = phdrs[i];
  for (int j = phr.pbagNdx; j < phdrs[i + 1].pbagNdx; j++) {
    pbag *pg = pbags + j;
    pgen_t *lastg = pgens + pg[j + 1].pgen_id;
    int pgenId = pg->pgen_id;
    instID = -1;
    int lastPgenId = j < npbags - 1 ? pbags[j + 1].pgen_id : npgens - 1;
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
              break;
            }
          }
        }
      }
    }
  }
  return nregions;
}
/**
 *
 * merges pset attr into zoneAttr.
 * returns 0 if it should be skipped
 *
 * this adds two attributes that combine in non-linear fashion (pow2, pow10,
 * filter etc)
 */
static inline int combine_pattrs(int genop, short *zoneAttr, short psetAttr) {
  float pval, zval;
  int irange[2], prange[2];
  switch (genop) {
    case VelRange:
    case KeyRange:
      irange[0] = zoneAttr[genop] & 0x007f;
      irange[1] = zoneAttr[genop] >> 8;
      prange[0] = psetAttr & 0x007f;
      prange[1] = psetAttr >> 8;

      if (prange[0] > irange[1] || prange[1] < irange[0]) {
        return 0;
      }
      if (prange[1] < irange[1]) irange[1] = prange[1];
      if (prange[0] > irange[0]) irange[0] = prange[0];
      zoneAttr[genop] = irange[0] | (irange[1] << 8);
      break;
    case VolEnvDelay:
    case VolEnvAttack:
    case VolEnvHold:
    case VolEnvDecay:
    case VolEnvRelease:
    case ModEnvDelay:
    case ModEnvAttack:
    case ModEnvHold:
    case ModEnvDecay:
    case ModEnvRelease:
      // i apologize for the following lines of code.
      zval = powf(2.0f, zoneAttr[genop] / 1200.0f);
      pval = powf(2.0f, psetAttr / 1200.0f);
      zoneAttr[genop] = log2f(zval + pval) * 1200.0f;
      break;
    default:
      zoneAttr[genop] += psetAttr;
  }
  return 1;
}
zone_t *findPresetZones(int i, int nregions) {
  short defvals[60] = defattrs;

  enum {
    default_pbg_cache_index = 0,
    pbg_attr_cache_index = 60,
    default_ibagcache_idex = 120,
    ibg_attr_cache_index = 180
  };
  zone_t *zones = (zone_t *)malloc((nregions + 1) * sizeof(zone_t));
  zone_t *dummy;
  int found = 0;
  short attrs[240] = {0};
  int instID = -1;
  int lastbag = phdrs[i + 1].pbagNdx;
  bzero(&attrs[default_pbg_cache_index], 240 * sizeof(short));
  memcpy(attrs, defvals, 2 * 60);
  memcpy(attrs + pbg_attr_cache_index, defvals, 2 * 60);

  for (int j = phdrs[i].pbagNdx; j < phdrs[i + 1].pbagNdx; j++) {
    int attr_inex =
        j == phdrs[i].pbagNdx ? default_pbg_cache_index : pbg_attr_cache_index;
    bzero(&attrs[pbg_attr_cache_index], 180 * sizeof(short));
    memcpy(attrs + pbg_attr_cache_index, defvals, 2 * 60);

    pbag *pg = pbags + j;
    pgen_t *lastg = pgens + pg[j + 1].pgen_id;
    int pgenId = pg->pgen_id;
    int lastPgenId = j < npbags - 1 ? pbags[j + 1].pgen_id : npgens - 1;
    attrs[Unused1 + pbg_attr_cache_index] = j;
    for (int k = pgenId; k < lastPgenId; k++) {
      pgen *g = pgens + k;
      if (g->genid != Instrument) {
        sanitizedInsert(attrs, g->genid + attr_inex, g);
      } else {
        instID = g->val.shAmount;
        sanitizedInsert(attrs, g->genid + attr_inex, g);
        bzero(&attrs[default_ibagcache_idex], 120 * sizeof(short));
        memcpy(attrs + default_ibagcache_idex, defvals, 2 * 60);

        inst *ihead = insts + instID;
        int ibgId = ihead->ibagNdx;
        int lastibg = (ihead + 1)->ibagNdx;
        for (int ibg = ibgId; ibg < lastibg; ibg++) {
          bzero((&attrs[0] + ibg_attr_cache_index), 60 * sizeof(short));

          memcpy(attrs + ibg_attr_cache_index, defvals, 2 * 60);

          attr_inex =
              ibg == ibgId ? default_ibagcache_idex : ibg_attr_cache_index;
          ibag *ibgg = ibags + ibg;
          attrs[Unused2 + default_ibagcache_idex] = ibg;

          pgen_t *lastig = ibg < nibags - 1 ? igens + (ibgg + 1)->igen_id
                                            : igens + nigens - 1;

          for (pgen_t *g = igens + ibgg->igen_id; g->genid != 60 && g != lastig;
               g++) {
            sanitizedInsert(attrs, attr_inex + g->genid, g);

            if (g->genid == SampleId) {
              short zoneattr[60];
              bzero(zoneattr, 120);
              memcpy(zoneattr, defvals, 120);
              int add = 1;
              shdrcast *sh = (shdrcast *)shdrs + g->val.shAmount;
              for (int i = 0; i < 60; i++) {
                if (attrs[ibg_attr_cache_index + i]) {
                  zoneattr[i] = attrs[ibg_attr_cache_index + i];
                } else if (attrs[default_ibagcache_idex + i]) {
                  zoneattr[i] = attrs[default_ibagcache_idex + i];
                }
                short pbagAttr = attrs[pbg_attr_cache_index + i] != defvals[i]
                                     ? attrs[pbg_attr_cache_index + i]
                                     : attrs[default_pbg_cache_index + i];
                int add = combine_pattrs(i, zoneattr, pbagAttr);
                if (!add) break;
              }
              zone_t *zz = (zone_t *)zoneattr;
              if (add) {
                memcpy(zones + found, zoneattr, 60 * sizeof(short));
                emitZone(phdrs[i].pid, zz);
                found++;
              }
            }
          }
        }
      }
    }
  }
  dummy = zones + found;
  dummy->SampleId = -1;
  free(&attrs[0]);
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
