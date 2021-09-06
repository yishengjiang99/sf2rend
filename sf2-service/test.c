#include <string.h>

#include "gnames.h"
#include "sf2.h"

#define export __attribute__((used))

typedef struct {
  phdr *pheader;
  pgen_t *pgs;
  int npgs;
} pzone;

typedef struct {
  pgen_t *gens;
  int ngens;
} izone;

typedef struct {
  char name[4];
  unsigned int size;
} riff;
typedef struct {
  char LIST[4];
  unsigned int size;
  char name[4];
} riffLIST;

export short *pcms;
export pzone tunes[128];
export pzone drums[128];
export izone instruments[999];
static int zoneRefCnt = 0;
#define zref() zoneRefCnt++ & 0x4f

export zone_t *activeZones;
char ram[0x4fffff];
unsigned long brrk = 0;
export void *maloloc(unsigned int len) {
  void *ref = (void *)&ram[brrk];
  brrk += len;
  while (brrk % 4) brrk++;
  return ref;
}

export int loadsf2(char *buf, int n) {
  activeZones = (zone_t *)maloloc(64 * sizeof(zone_t));
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
  char sdta[4] = "sdta";
  char riffa[12];
  char *pdtabuffer;
  int m = 0;
  riff *sh = (riff *)riffa;
  riffLIST *riffListHeader = (riffLIST *)riffa;
  unsigned short pg0, pgf, ig0, igf;

  while (m < 4 && buf) {
    if (*buf++ != sdta[m++]) m = 0;
  }
  sh = (riff *)buf;
  buf += sizeof(riff);
  buf += sh->size;
  // ffread(pcms, sizeof(short), sh->size / 2, fd);
  riffListHeader = (riffLIST *)buf;
  buf += sizeof(riffLIST);
  pdtabuffer = buf;

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
  for (int j = 0; j < nphdrs; j++) {
    if (phdrs[j].bankId == 0) tunes[phdrs[j].pid].pheader = &phdrs[j];
    if (phdrs[j].bankId == 128) drums[phdrs[j].pid].pheader = &phdrs[j];
  }
  for (int i = 0; i < 128; i++) {
    phdr *ph = tunes[i].pheader;
    pg0 = pbags[ph->pbagNdx].pgen_id;
    pgf = pbags[ph[1].pbagNdx].pgen_id;
    tunes[i].npgs = pgf - pg0;
    tunes[i].pgs = (pgen_t *)maloloc(tunes[i].npgs * sizeof(pgen));
    memcpy(tunes[i].pgs, &pgens[pg0], tunes[i].npgs * sizeof(pgen));
    int lastInstId = -1;
    for (int pg = pg0; pg < pgf; pg++) {
      if (pgens[pg].genid == Instrument &&
          pgens[pg].val.uAmount != lastInstId) {
        lastInstId = pgens[pg].val.uAmount;
        inst *ihead = insts + lastInstId;
        ig0 = ibags[ihead->ibagNdx].igen_id;
        igf = ibags[ihead[1].ibagNdx].igen_id;
        instruments[lastInstId].ngens = igf - ig0;
        unsigned long igensize = instruments[lastInstId].ngens * sizeof(igens);
        instruments[lastInstId].gens = (pgen_t *)maloloc(igensize);
        memcpy(instruments[lastInstId].gens, &igens[ig0], igensize);
      }
    }
  }
  return 0;
}

export zone_t *getZone(int pset, int bankId, int key, int vel) {
#define filter_attr(pg)                                   \
  (pg.genid == VelRange &&                                \
   (pg.val.ranges.lo > vel || pg.val.ranges.hi < vel)) || \
      (pg.genid == KeyRange &&                            \
       (pg.val.ranges.lo > key || pg.val.ranges.hi < key))

  short deltas[60];
  short attrs[60];
  short defzonear[] = {defzone};
  memcpy(attrs, defzonear, 120) l;
  pzone z = tunes[pset];
  int skipping = 0;
  int instId = -1;
  for (int j = 0; j < z.npgs; j++) {
    pgen_t pg = z.pgs[j];
    if (skipping == 0 && filter_attr(pg)) skipping = 1;
    if (!skipping) deltas[pg.genid] = pg.val.shAmount;
    if (pg.genid == Instrument && skipping)
      skipping = 0;
    else if (pg.genid == Instrument && !skipping) {
      instId = pg.val.uAmount;
      izone iz = instruments[instId];
      for (int i = 0; i < iz.ngens; i++) {
        pgen_t ig = iz.gens[i];
        if (skipping == 0 && filter_attr(ig)) skipping = 1;

        if (!skipping) attrs[ig.genid] = ig.val.shAmount + deltas[ig.genid];

        if (ig.genid == SampleId && !skipping) {
          zone_t *zz = &activeZones[0];
          memcpy(zz, attrs, 120);
          bzero(deltas, 120);
          // return zz;
        }

        if (ig.genid == SampleId && skipping) skipping = 0;
      }
    }
  }
  return 0;
}

// void downloadSucceeded(emscripten_fetch_t *fetch) {
//   mkpdtaf((char *)fetch->data, fetch->numBytes - 1);
//   emscripten_fetch_close(fetch);  // Free data associated with the fetch.
//   zone_t *z = printset(0, 0, 55, 88);
//   printf("%d", z->KeyRange.lo);
// }

// void downloadFailed(emscripten_fetch_t *fetch) {
//   printf("Downloading %s failed, HTTP failure status code: %d.\n",
//   fetch->url,
//          fetch->status);
//   emscripten_fetch_close(fetch);  // Also free data on failure.
// }
// int main(int argc, char **argv) {
//   emscripten_fetch_attr_t attr;
//   emscripten_fetch_attr_init(&attr);
//   strcpy(attr.requestMethod, "GET");
//   attr.attributes = EMSCRIPTEN_FETCH_LOAD_TO_MEMORY;
//   attr.onsuccess = downloadSucceeded;
//   attr.onerror = downloadFailed;
//   emscripten_fetch(&attr, "file.sf2");
//   // mkpdtaf("file.sf2");
//   // printset(55, 0, 66, 99);
//   // printset(55, 0, 55, 99);
// }
