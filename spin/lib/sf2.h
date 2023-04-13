#ifndef SF2_H
#define SF2_H
typedef unsigned int uint32_t;
typedef unsigned char uint8_t;
typedef unsigned short uint16_t;
typedef int int32_t;
typedef short int16_t;
typedef unsigned short WORD;

typedef struct {
  uint8_t lo, hi;
} rangesType;  //  Four-character code

typedef union {
  rangesType ranges;
  short shAmount;
  unsigned short uAmount;
} genAmountType;

typedef struct {
  char name[4];
  unsigned int size;
  char sfbk[4];
  char list[4];
} sheader_t;

typedef struct {
  unsigned int size;
  char name[4];
} header2_t;

typedef struct {
  char name[4];
  unsigned int size;
} section_header;
typedef enum {
  monoSample = 1,
  rightSample = 2,
  leftSample = 4,
  linkedSample = 8,
  RomMonoSample = 0x8001,
  RomRightSample = 0x8002,
  RomLeftSample = 0x8004,
  RomLinkedSample = 0x8008
} SFSampleLink;

typedef struct {
  unsigned short pgen_id, pmod_id;
} pbag;
typedef struct {
  unsigned short igen_id, imod_id;
} ibag;
typedef struct {
  unsigned short genid;
  genAmountType val;

} pgen_t;
typedef pgen_t pgen;
typedef struct {
  unsigned short sfModSrcOper;
  unsigned short sfModDestOper;
  short modAmount;
  unsigned short sfModAmtSrcOper;
  unsigned short sfModTransOper;
} pmod;

typedef struct {
  char name[20];
  unsigned short ibagNdx;
} inst;
typedef pmod imod;
typedef union {
  uint8_t hi, lo;
  unsigned short val;
  short word;
} gen_val;

typedef pgen_t igen;
typedef struct {
  char name[46];
} shdr;

typedef struct {
  char name[20];
  uint16_t pid, bankId, pbagNdx;
  char idc[12];
} phdr;

typedef struct {
  char name[20];
  uint32_t start, end, startloop, endloop, sampleRate;

  unsigned char originalPitch;
  signed char pitchCorrection;
  uint16_t wSampleLink, sampleType;
} shdrcast;

typedef struct {
  short StartAddrOfs, EndAddrOfs, StartLoopAddrOfs, EndLoopAddrOfs,
      StartAddrCoarseOfs;
  short ModLFO2Pitch, VibLFO2Pitch, ModEnv2Pitch, FilterFc, FilterQ,
      ModLFO2FilterFc, ModEnv2FilterFc, EndAddrCoarseOfs, ModLFO2Vol, Unused1,
      ChorusSend, ReverbSend, Pan, IBAGID, PBagId, Unused4, ModLFODelay,
      ModLFOFreq, VibLFODelay, VibLFOFreq, ModEnvDelay, ModEnvAttack,
      ModEnvHold, ModEnvDecay, ModEnvSustain, ModEnvRelease, Key2ModEnvHold,
      Key2ModEnvDecay, VolEnvDelay, VolEnvAttack, VolEnvHold, VolEnvDecay,
      VolEnvSustain, VolEnvRelease, Key2VolEnvHold, Key2VolEnvDecay, Instrument,
      Reserved1;
  rangesType KeyRange, VelRange;
  unsigned short StartLoopAddrCoarseOfs;
  short Keynum, Velocity, Attenuation, Reserved2, EndLoopAddrCoarseOfs,
      CoarseTune, FineTune, SampleId, SampleModes, Reserved3, ScaleTune,
      ExclusiveClass, OverrideRootKey, Dummy;
} zone_t;

enum grntypes {
  StartAddrOfs,
  EndAddrOfs,
  StartLoopAddrOfs,
  EndLoopAddrOfs,
  StartAddrCoarseOfs,
  ModLFO2Pitch,
  VibLFO2Pitch,
  ModEnv2Pitch,
  FilterFc,
  FilterQ,
  ModLFO2FilterFc,
  ModEnv2FilterFc,
  EndAddrCoarseOfs,
  ModLFO2Vol,
  Unused1,
  ChorusSend,
  ReverbSend,
  Pan,
  IBAGID,
  PBagId,
  Unused4,
  ModLFODelay,
  ModLFOFreq,
  VibLFODelay,
  VibLFOFreq,
  ModEnvDelay,
  ModEnvAttack,
  ModEnvHold,
  ModEnvDecay,
  ModEnvSustain,
  ModEnvRelease,
  Key2ModEnvHold,
  Key2ModEnvDecay,
  VolEnvDelay,
  VolEnvAttack,
  VolEnvHold,
  VolEnvDecay,
  VolEnvSustain,
  VolEnvRelease,
  Key2VolEnvHold,
  Key2VolEnvDecay,
  Instrument,
  Reserved1,
  KeyRange,
  VelRange,
  StartLoopAddrCoarseOfs,
  Keynum,
  Velocity,
  Attenuation,
  Reserved2,
  EndLoopAddrCoarseOfs,
  CoarseTune,
  FineTune,
  SampleId,
  SampleModes,
  Reserved3,
  ScaleTune,
  ExclusiveClass,
  OverrideRootKey,
  Dummy
};
#define fivezeros 0, 0, 0, 0, 0
#define defenvel -12000, -12000, -12000, -12000, 0, -12000

#define defattrs                                                               \
  {                                                                            \
    /*StartAddrOfs:*/ 0, /*EndAddrOfs:*/ 0, /*StartLoopAddrOfs:*/ 0,           \
        /*EndLoopAddrOfs:*/ 0, /*StartAddrCoarseOfs:*/ 0,                      \
        /*ModLFO2Pitch:*/ -12000, /*VibLFO2Pitch:*/ -12000,                    \
        /*ModEnv2Pitch:*/ -12000, /*FilterFc:*/ 13500, /*FilterQ:*/ 0,         \
        /*ModLFO2FilterFc:*/ -12000, /*ModEnv2FilterFc:*/ -12000,              \
        /*EndAddrCoarseOfs:*/ 0, /*ModLFO2Vol:*/ -12000, /*Unused1:*/ 0,       \
        /*ChorusSend:*/ 0, /*ReverbSend:*/ 0, /*Pan:*/ 0, /*IBAGID:*/ 0,       \
        /*PBagId:*/ 0, /*Unused4:*/ 0, /*ModLFODelay:*/ -12000,                \
        /*ModLFOFreq:*/ 0, /*VibLFODelay:*/ -12000, /*VibLFOFreq:*/ 0,         \
        /*ModEnvDelay:*/ -12000, /*ModEnvAttack:*/ -12000,                     \
        /*ModEnvHold:*/ -12000, /*ModEnvDecay:*/ -12000, /*ModEnvSustain:*/ 0, \
        /*ModEnvRelease:*/ -12000, /*Key2ModEnvHold:*/ 0,                      \
        /*Key2ModEnvDecay:*/ 0, /*VolEnvDelay:*/ -12000,                       \
        /*VolEnvAttack:*/ -12000, /*VolEnvHold:*/ -12000,                      \
        /*VolEnvDecay:*/ -12000, /*VolEnvSustain:*/ 0,                         \
        /*VolEnvRelease:*/ -12000, /*Key2VolEnvHold:*/ 0,                      \
        /*Key2VolEnvDecay:*/ 0, /*Instrument:*/ -1, /*Reserved1:*/ 0,          \
        /*KeyRange:*/ 127 << 8, /*VelRange:*/ 127 << 8,                        \
        /*StartLoopAddrCoarseOfs:*/ 0, /*Keynum:*/ -1, /*Velocity:*/ -1,       \
        /*Attenuation:*/ 0, /*Reserved2:*/ 0, /*EndLoopAddrCoarseOfs:*/ 0,     \
        /*CoarseTune:*/ 0, /*FineTune:*/ 0, /*SampleId:*/ -1,                  \
        /*SampleModes:*/ 1, /*Reserved3:*/ 0, /*ScaleTune:*/ 100,              \
        /*ExclusiveClass:*/ 0, /*OverrideRootKey:*/ -1, /*Dummy:*/ 0           \
  }
#endif

#if sf2_impl

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
phdr drumHeaders[128];
zone_t *root;
zone_t *presets[0xff];
void *loadpdta(void *pdtabuffer);
phdr *findPreset(int pid, int bank_id);
zone_t *findPresetZones(phdr *phr, int n);
int findPresetZonesCount(phdr *phr);

phdr *presetHeaders[128];
phdr *phdrRoot = 0;
phdr drumHeaders[128];
zone_t *presetZones;
zone_t *root;
zone_t *presets[0xff];

void *readpdta(void *pdtabuffer) {
#define srr(section)                          \
  sh = (section_header *)pdtabuffer;          \
  pdtabuffer += 8;                            \
  n##section##s = sh->size / sizeof(section); \
  section##s = (section *)pdtabuffer;         \
  pdtabuffer += sh->size;
  section_header *sh;
  srr(phdr);
  srr(pbag);
  srr(pmod);
  srr(pgen);
  srr(inst);
  srr(ibag);
  srr(imod);
  srr(igen);
  srr(shdr);
  return malloc(4);
}
void *loadpdta(void *pdtabuffer) {
  readpdta(pdtabuffer);
  for (uint16_t i = 0; i < 128; i++) {
    phdr *phr = findPreset(i, 0x00);

    if (phr) {
      int n = findPresetZonesCount(phr);
      presets[(uint32_t)i] = findPresetZones(phr, n);
    }
    phr = findPreset(i, 128);

    // printf("[%u %u] %s \n", phr->pid, phr->bankId,phr->name);
    if (phr) {
      int n = findPresetZonesCount(phr);
      presets[(uint32_t)i + 128] = findPresetZones(phr, n);
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

#define clamp(val, min, max) val > max ? max : val < min ? min : val
static inline float fclamp(float val, float min, float max) {
  return val > max ? max : val < min ? min : val;
}

static inline short add_pbag_val_to_zone(int genop, short ival, short pval) {
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
    default:
      return ival;
  }
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

void arrcpy(short *dest, short *srcc, int n) {
  for (int i = 0; i < n; i++) dest[i] = srcc[i];
}

zone_t *findPresetZones(phdr *phr, int nregions) {
  // generator attributes
  short presetDefault[60] = {0};
  short pbagLegion[60] = {0};
  presetDefault[VelRange] = 127 << 8;
  presetDefault[KeyRange] = 127 << 8;

  zone_t *zones = (zone_t *)malloc((nregions + 1) * sizeof(zone_t));
  int found = 0;
  int instID = -1;
  int lastbag = (phr + 1)->pbagNdx;
  for (int j = phr->pbagNdx; j < (phr + 1)->pbagNdx; j++) {
    pbag *pg = pbags + j;
    pgen_t *lastg = pgens + pg[j + 1].pgen_id;
    int pgenId = pg->pgen_id;
    int lastPgenId = j < npbags - 1 ? pbags[j + 1].pgen_id : npgens - 1;
    arrcpy(pbagLegion, presetDefault, 120);
    pbagLegion[Instrument] = -1;
    pbagLegion[PBagId] = j;
    for (int k = pgenId; k < lastPgenId; k++) {
      pgen *g = pgens + k;
      pbagLegion[g->genid] = g->val.shAmount;
      if (g->genid == Instrument) {
        inst *instptr = insts + pbagLegion[Instrument];
        int ibgId = instptr->ibagNdx;
        int lastibg = (instptr + 1)->ibagNdx;
        short instDefault[60] = defattrs;
        short instZone[60] = {0};
        for (int ibg = ibgId; ibg < lastibg; ibg++) {
          arrcpy(instZone, instDefault, 120);
          ibag *ibgg = ibags + ibg;
          pgen_t *lastig = igens + (ibgg + 1)->igen_id;
          for (pgen_t *ig = igens + ibgg->igen_id; ig != lastig; ig++) {
            instZone[ig->genid] = ig->val.shAmount;
          }
          if (instZone[SampleId] == -1) {
            arrcpy(instDefault, instZone, 120);
          } else {
            for (int i = 0; i < 60; i++) {
              instZone[i] = add_pbag_val_to_zone(i, instZone[i], pbagLegion[i]);
            }
            instZone[IBAGID] = ibg;
            instZone[PBagId] = j;
            zones[found] = *((zone_t *)instZone);
            found++;
          }
        }
      }
    }
    if (pbagLegion[Instrument] == -1) {
      presetDefault=pbagLegion;
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
float sample_cent(zone_t *z, shdrcast *sh) {
  short rt = z->OverrideRootKey > -1 ? z->OverrideRootKey : sh->originalPitch;
  return rt * 100.0f + z->CoarseTune * 100.0f + (float)z->FineTune;
}

// void read_sf(FILE *fd) {
//   sheader_t *header = (sheader_t *)malloc(sizeof(sheader_t));
//   header2_t *h2 = (header2_t *)malloc(sizeof(header2_t));
//   fread(header, sizeof(sheader_t), 1, fd);
//   printf("%.4s %.4s %.4s %u", header->name, header->sfbk, header->list,
//          header->size);
//   fread(h2, sizeof(header2_t), 1, fd);
//   printf("\n%.4s %u", h2->name, h2->size);
//   fseek(fd, h2->size, SEEK_CUR);
//   fread(h2, sizeof(header2_t), 1, fd);
//   printf("\n%.4s %u", h2->name, h2->size);
//   nsamples = h2->size / sizeof(short);
//   sdtastart = ftell(fd);
//   fseek(fd, h2->size, SEEK_CUR);
//   //  fseek(fd, h2->size, SEEK_CUR);
//   // printf("\n%.4s %u", h2->name, h2->size);

//   fread(h2, sizeof(header2_t), 1, fd);
//   printf("\n%.4s %u", h2->name, h2->size);
//   char *pdtabuffer = malloc(h2->size);
//   fread(pdtabuffer, h2->size, h2->size, fd);

//   loadpdta(pdtabuffer);
// }

#endif  // MACRO
