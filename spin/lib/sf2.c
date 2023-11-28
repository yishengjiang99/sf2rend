#ifndef SF2_C
#define SF2_C

#include "sf2.h"

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
void sf2Info(FILE *fd) {
  sheader_t *header = (sheader_t *)malloc(sizeof(sheader_t));
  header2_t *h2 = (header2_t *)malloc(sizeof(header2_t));
  fread(header, sizeof(sheader_t), 1, fd);
  fread(h2, sizeof(header2_t), 1, fd);
  info = malloc(h2->size);
  fread(info, h2->size, 1, fd);
  fread(h2, sizeof(header2_t), 1, fd);

  nsamples = h2->size / sizeof(short);
  sdtastart = ftell(fd);

  fseek(fd, h2->size, SEEK_CUR);
#define readSection(section)                  \
  fread(sh, sizeof(section_header), 1, fd);   \
  n##section##s = sh->size / sizeof(section); \
  section##s = (section *)malloc(sh->size);   \
  fread(section##s, sizeof(section), sh->size / sizeof(section), fd);

  section_header *sh = (section_header *)malloc(sizeof(section_header));

  fread(h2, sizeof(header2_t), 1, fd);
  readSection(phdr);

  readSection(pbag);
  readSection(pmod);
  readSection(pgen);
  readSection(inst);
  readSection(ibag);
  readSection(imod);
  readSection(igen);
  readSection(shdr);
  presetZones = (PresetZones *)malloc(nphdrs * sizeof(PresetZones));
  for (int i = 0; i < nphdrs; i++) {
    *(presetZones + i) = findPresetZones(i, findPresetZonesCount(i));
  }
}

void readsf(FILE *fd) {
  sf2Info(fd);
  read_sdta(fd);
}

void read_sf2_mem(void *mem, int n) {
  FILE *fd = fmemopen(mem, n, "rb");
  readsf(fd);
}
PresetZones findByPid(int pid, int bkid) {
  for (unsigned short i = 0; i < nphdrs - 1; i++) {
    if (phdrs[i].pid == pid && phdrs[i].bankId == bkid) {
      return presetZones[i];
    }
  }

  return (PresetZones){
      (phdr){"", 0, 0, 0, ""},
      0,
      NULL,
  };
}
PresetZones findPresetByName(const char *name) {
  for (unsigned short i = 0; i < nphdrs - 1; i++) {
    if (strstr(phdrs[i].name, name)) {
      return *(presetZones + i);
    }
  }

  return presetZones[0];
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
  for (int j = phr.pbagNdx; j < phdrs[i + 1].pbagNdx; j++) {
    pbag *pg = pbags + j;
    pgen_t *lastg = pgens + pg[j + 1].pgen_id;
    int pgenId = pg->pgen_id;
    instID = -1;
    int lastPgenId = j < npbags - 1 ? pbags[j + 1].pgen_id : npgens - 1;
    for (int k = pgenId; k < lastPgenId; k++) {
      pgen *g = pgens + k;
      if (g->genid == Instrument) {
        instID = g->val.shAmount;
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
PresetZones findPresetZones(int i, int nregions) {
  short defvals[60] = defattrs;

  enum {
    default_pbg_cache_index = 0,
    pbg_attr_cache_index = 60,
    default_ibagcache_idex = 120,
    ibg_attr_cache_index = 180
  };
  zone_t *zones = (zone_t *)malloc(nregions * sizeof(zone_t));
  int found = 0;
  short attrs[240] = {0};
  int instID = -1;
  int lastbag = phdrs[i + 1].pbagNdx;
  bzero(&attrs[default_pbg_cache_index], 240 * sizeof(short));

  for (int j = phdrs[i].pbagNdx; j < phdrs[i + 1].pbagNdx; j++) {
    int attr_inex =
        j == phdrs[i].pbagNdx ? default_pbg_cache_index : pbg_attr_cache_index;
    bzero(&attrs[pbg_attr_cache_index], 180 * sizeof(short));

    pbag *pg = pbags + j;
    pgen_t *lastg = pgens + pg[j + 1].pgen_id;
    int pgenId = pg->pgen_id;
    int lastPgenId = j < npbags - 1 ? pbags[j + 1].pgen_id : npgens - 1;

    for (int k = pgenId; k < lastPgenId; k++) {
      pgen *g = pgens + k;
      if (g->genid != Instrument) {
        sanitizedInsert(attrs, g->genid + attr_inex, g);
      } else {
        instID = g->val.shAmount;
        sanitizedInsert(attrs, g->genid + attr_inex, g);
        bzero(&attrs[default_ibagcache_idex], 120 * sizeof(short));
        int lastSampId = -1;
        inst *ihead = insts + instID;
        int ibgId = ihead->ibagNdx;
        int lastibg = (ihead + 1)->ibagNdx;
        for (int ibg = ibgId; ibg < lastibg; ibg++) {
          bzero((&attrs[0] + ibg_attr_cache_index), 60 * sizeof(short));
          attr_inex =
              ibg == ibgId ? default_ibagcache_idex : ibg_attr_cache_index;
          lastSampId = -1;
          ibag *ibgg = ibags + ibg;
          pgen_t *lastig = ibg < nibags - 1 ? igens + (ibgg + 1)->igen_id
                                            : igens + nigens - 1;
          for (pgen_t *g = igens + ibgg->igen_id; g->genid != 60 && g != lastig;
               g++) {
            sanitizedInsert(attrs, attr_inex + g->genid, g);
            if (g->genid == SampleId) {
              short zoneattr[60] = defattrs;
              int add = 1;
              lastSampId = g->val.shAmount;  // | (ig->val.ranges.hi << 8);
              for (int i = 0; i < 60; i++) {
                if (attrs[ibg_attr_cache_index + i]) {
                  zoneattr[i] = attrs[ibg_attr_cache_index + i];
                } else if (attrs[default_ibagcache_idex + i]) {
                  zoneattr[i] = attrs[default_ibagcache_idex + i];
                }
                short pbagAttr = attrs[pbg_attr_cache_index + i];

                if (i == VelRange || i == KeyRange) {
                  int irange[2] = {zoneattr[i] & 0x007f, zoneattr[i] >> 8};
                  int prange[2] = {pbagAttr & 0x007f, pbagAttr >> 8};
                  if (prange[0] > irange[1] || prange[1] < irange[0]) {
                    add = 0;
                    break;
                  }
                  if (prange[1] < irange[1]) irange[1] = prange[1];

                  if (prange[0] > irange[0]) irange[0] = prange[0];

                  zoneattr[i] = irange[0] | (irange[1] << 8);
                } else {
                  if (attrs[pbg_attr_cache_index + i]) {
                    zoneattr[i] += attrs[pbg_attr_cache_index + i];
                  } else if (attrs[default_pbg_cache_index + i]) {
                    zoneattr[i] += attrs[default_pbg_cache_index + i];
                  }
                }
              }
              if (add) {
                memcpy(zones + found, zoneattr, 60 * sizeof(short));

                found++;
              }
            }
          }
        }
      }
    }
  }
  return (PresetZones){phdrs[i], found, zones};
}
#endif