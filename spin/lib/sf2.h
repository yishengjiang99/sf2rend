#include <stdio.h>
#include <stdlib.h>
#ifndef SF2_H
#define SF2_H

typedef unsigned int uint32_t;
typedef unsigned char uint8_t;
typedef unsigned short uint16_t;
typedef int int32_t;
typedef short int16_t;

typedef uint32_t DWORD; // uint32_t;
typedef DWORD FOURCC;
typedef struct
{
  FOURCC ckID;  //  A chunk ID identifies the type of data within the chunk.
  DWORD ckSize; // The size of the chunk data in bytes, excluding any pad byte.
  char *ckDATA; // The actual data plus a pad byte if req'd to word align.
} RIFFCHUNKS;
typedef struct
{
  uint8_t lo, hi;
} rangesType; //  Four-character code

typedef union
{
  rangesType ranges;
  short shAmount;
  unsigned short uAmount;
} genAmountType;

typedef struct
{
  unsigned int size;
  char name[4];
} header2_t;

typedef struct
{
  char name[4];
  unsigned int size;
} section_header;
typedef enum
{
  monoSample = 1,
  rightSample = 2,
  leftSample = 4,
  linkedSample = 8,
  RomMonoSample = 0x8001,
  RomRightSample = 0x8002,
  RomLeftSample = 0x8004,
  RomLinkedSample = 0x8008
} SFSampleLink;

typedef struct
{
  unsigned short pgen_id, pmod_id;
} pbag;
typedef struct
{
  unsigned short igen_id, imod_id;
} ibag;
typedef struct
{
  unsigned short genid;
  genAmountType val;

} pgen_t;
typedef pgen_t pgen;
typedef struct
{
  unsigned short sfModSrcOper;
  unsigned short sfModDestOper;
  short modAmount;
  unsigned short sfModAmtSrcOper;
  unsigned short sfModTransOper;
} pmod;

typedef struct
{
  char name[20];
  unsigned short ibagNdx;
} inst;
typedef pmod imod;
typedef union
{
  uint8_t hi, lo;
  unsigned short val;
  short word;
} gen_val;

typedef pgen_t igen;
typedef struct
{
  char name[46];
} shdr;

typedef struct
{
  char name[20];
  uint16_t pid, bankId, pbagNdx;

  char idc[12];
} phdr;

typedef struct
{
  char name[20];
  unsigned int start, end, startloop, endloop, sampleRate;

  unsigned char originalPitch;
  signed char pitchCorrection;
  uint16_t wSampleLink, sampleType;
} shdrcast;
static int nphdrs, npbags, npgens, npmods, nshdrs, ninsts, nimods, nigens,
    nibags;

static phdr *phdrs;
static pbag *pbags;
static pmod *pmods;
static pgen *pgens;
static inst *insts;
static ibag *ibags;
static imod *imods;
static igen *igens;
static shdr *shdrs;
static short *data;
static void *info;
static int nsamples;
static float *sdta;
static int sdtastart;

typedef struct
{
  unsigned short StartAddrOfs, EndAddrOfs, StartLoopAddrOfs, EndLoopAddrOfs,
      StartAddrCoarseOfs;
  short ModLFO2Pitch, VibLFO2Pitch, ModEnv2Pitch, FilterFc, FilterQ,
      ModLFO2FilterFc, ModEnv2FilterFc, EndAddrCoarseOfs, ModLFO2Vol, Unused1,
      ChorusSend, ReverbSend, Pan, Unused2, Unused3, Unused4, ModLFODelay,
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
typedef struct
{
  phdr hdr;
  int npresets;
  zone_t *zones;
} PresetZones;

void readsf(FILE *f);
enum grntypes
{
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

#define defattrs                                                           \
  {                                                                        \
    /*StartAddrOfs:*/ 0, /*EndAddrOfs:*/ 0, /*StartLoopAddrOfs:*/ 0,       \
        /*EndLoopAddrOfs:*/ 0, /*StartAddrCoarseOfs:*/ 0,                  \
        /*ModLFO2Pitch:*/ 0, /*VibLFO2Pitch:*/ 0,                          \
        /*ModEnv2Pitch:*/ 0, /*FilterFc:*/ 13500, /*FilterQ:*/ 0,          \
        /*ModLFO2FilterFc:*/ -12000, /*ModEnv2FilterFc:*/ -12000,          \
        /*EndAddrCoarseOfs:*/ 0, /*ModLFO2Vol:*/ -12000, /*Unused1:*/ 0,   \
        /*ChorusSend:*/ 0, /*ReverbSend:*/ 0, /*Pan:*/ 0, /*IBAGID:*/ 0,   \
        /*PBagId:*/ 0, /*Unused4:*/ 0,                                     \
        /*ModLFODelay:*/ -12000,                                           \
        /*ModLFOFreq:*/ 0,                                                 \
        /*VibLFODelay:*/ -12000,                                           \
        /*VibLFOFreq:*/ 0,                                                 \
        /*ModEnvDelay:*/ -12000,                                           \
        /*ModEnvAttack:*/ -12000,                                          \
        /*ModEnvHold:*/ -12000,                                            \
        /*ModEnvDecay:*/ -12000,                                           \
        /*ModEnvSustain:*/ 0,                                              \
        /*ModEnvRelease:*/ -12000,                                         \
        /*Key2ModEnvHold:*/ 0,                                             \
        /*VolEnvAttack:*/ -12000,                                          \
        /*VolEnvHold:*/ -12000,                                            \
        /*VolEnvDecay:*/ -12000,                                           \
        /*VolEnvSustain:*/ 0,                                              \
        /*VolEnvRelease:*/ -12000,                                         \
        /*Key2VolEnvHold:*/ 0,                                             \
        /*Key2VolEnvDecay:*/ 0,                                            \
        /*Instrument:*/ -1,                                                \
        /*Reserved1:*/ 0,                                                  \
        /*KeyRange:*/ 127 << 8, /*VelRange:*/ 127 << 8,                    \
        /*StartLoopAddrCoarseOfs:*/ 0, /*Keynum:*/ -1, /*Velocity:*/ -1,   \
        /*Attenuation:*/ 0, /*Reserved2:*/ 0, /*EndLoopAddrCoarseOfs:*/ 0, \
        /*CoarseTune:*/ 0, /*FineTune:*/ 0, /*SampleId:*/ -1,              \
        /*SampleModes:*/ 1, /*Reserved3:*/ 0, /*ScaleTune:*/ 100,          \
        /*ExclusiveClass:*/ 0, /*OverrideRootKey:*/ -1, /*Dummy:*/ 0       \
  }
phdr *presetHeaders[128];
phdr *phdrRoot = 0;
phdr drumHeaders[128];
zone_t *presetZones;
zone_t *root;
zone_t *presets[0xff];
#endif