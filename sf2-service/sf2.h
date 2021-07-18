#ifndef SF2_H
#define SF2_H

typedef unsigned int uint32_t;
typedef unsigned char uint8_t;
typedef unsigned short uint16_t;
typedef int int32_t;
typedef short int16_t;

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
  char sfModSrcOper[2];
  unsigned short gen_operator;
  short modAmount;
  char sfModAmtSrcOper;
  short fModTransOper;
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
  // shdr's 46 byters is malloc aligned to 48 and I don't make it stop
  // so we first read 46 chars explicitly and then casted to shdrcast defined
  // beloe
  uint8_t dc[46];
} shdr;
typedef struct {
  char name[20];
  uint16_t pid, bankId, pbagNdx;
  char idc[12];
} phdr;

typedef struct {
  char name[20];
  uint32_t start, end, startloop, endloop, sampleRate;

  char originalPitch;
  char pitchCorrection;
  uint16_t wSampleLink;
  SFSampleLink sfSampleqaType;
} shdrcast;

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
// ModLFO2Pitch, VibLFO2Pitch,ModLFO2FilterFc,
typedef struct {
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

zone_t *presetZones;
zone_t *findByPid(int pid, int bkid);

zone_t *findPresetZones(int i, int nregions);
zone_t *findPresetByName(const char *name);
int findPresetZonesCount(int i);

zone_t * filterForZone(zone_t *pset, uint8_t key, uint8_t vel);

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
  Unused2,
  Unused3,
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

#define defattrs                                                                        \
  {fivezeros, 0,         0,         0,        13500,              /* 9*/                \
   fivezeros, fivezeros, 0,         0,        -12000,             /*22*/                \
   0,         -12000,    0,                                       /*25*/                \
   defenvel,  0,         0,         defenvel,                     /*39*/                \
   0,         0,         0,         0,        127 << 8, 127 << 8, /*velrange/keyrange*/ \
   0,                                                             /*45*/                \
   -1,        -1,        fivezeros,                               /*55*/                \
   0,         0,         0,         100,      0,        -1,       0};
#endif