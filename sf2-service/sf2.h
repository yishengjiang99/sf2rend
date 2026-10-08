#ifndef SF2_H
#define SF2_H
#include <stddef.h>
#include <stdint.h>

/* SoundFont 2.04 pdta walker.
   This unit reads the preset/instrument tables only. It does not load
   sdta sample words; the caller keeps the pdta bytes alive for as long
   as any sf2_font pointer into them is used.

   Record layout matches the spec (little-endian). zone_t is an internal
   60 x int16 image of the generator enum, not a file record. Slots 18 and
   19 are unused in the spec and hold IBAGID / PBagId for the JS bridge.
*/

#define SF2_SECTION_HEADER_SIZE 8
#define SF2_GENERATOR_COUNT 60
#define SF2_GENERATOR_SIZE_BYTES (SF2_GENERATOR_COUNT * sizeof(short))
#define SF2_MAX_PRESETS 128
#define SF2_MAX_BANKS 256
/* Bank 0 lives in [0, 128). Bank 128 (drums) lives in [128, 256). */
#define SF2_GM_SLOTS (SF2_MAX_PRESETS * 2)
#define SF2_MAX_ZONES 10000

#define SF2_PHDR_SIZE 38
#define SF2_BAG_SIZE 4
#define SF2_MOD_SIZE 10
#define SF2_GEN_SIZE 4
#define SF2_INST_SIZE 22
#define SF2_SHDR_SIZE 46

/* Absolute generator limits from the spec, in generator units. */
#define SF2_MIN_DELAY -12000
#define SF2_MAX_DELAY_SHORT 5000
#define SF2_MAX_DELAY_LONG 8000
#define SF2_MIN_MODULATION -12000
#define SF2_MAX_MODULATION 12000
#define SF2_MIN_KEY_MOD -1200
#define SF2_MAX_KEY_MOD 1200
#define SF2_MIN_PAN -500
#define SF2_MAX_PAN 500
#define SF2_MIN_ATTENUATION 0
#define SF2_MAX_ATTENUATION 1440
#define SF2_MIN_SUSTAIN 0
#define SF2_MAX_SUSTAIN_MOD 1000
#define SF2_MAX_SUSTAIN_VOL 1440
#define SF2_MIN_FILTER_FC 1500
#define SF2_MAX_FILTER_FC 13500
#define SF2_MIN_FILTER_Q 0
#define SF2_MAX_FILTER_Q 960
#define SF2_MIN_LFO_FREQ -16000
#define SF2_MAX_LFO_FREQ 4500
#define SF2_MIN_COARSE_TUNE -120
#define SF2_MAX_COARSE_TUNE 120
#define SF2_MIN_FINE_TUNE -99
#define SF2_MAX_FINE_TUNE 99
#define SF2_MIN_SCALE_TUNE 0
#define SF2_MAX_SCALE_TUNE 1200
#define SF2_MIN_SEND 0
#define SF2_MAX_SEND 1000

enum {
  SF2_OK = 0,
  SF2_ERR_NULL = -1,
  SF2_ERR_TRUNCATED = -2,
  SF2_ERR_BAD_CHUNK = -3,
  SF2_ERR_NOMEM = -4
};

typedef struct {
  uint8_t lo, hi;
} rangesType;

typedef union {
  rangesType ranges;
  short shAmount;
  unsigned short uAmount;
} genAmountType;

/* Replaces the old overlapping-uint8 gen_val. lo/hi are a real pair. */
typedef union {
  rangesType ranges;
  unsigned short val;
  short word;
} gen_val;

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
typedef pgen_t igen;

typedef struct {
  char name[20];
  uint16_t pid, bankId, pbagNdx;
  char idc[12];
} phdr;

/* On-disk sample header. Packed: the natural alignment would pad 46 to 48
   and break the JS stride (SampleId * 46) as well as the chunk count. */
#pragma pack(push, 1)
typedef struct {
  char name[20];
  uint32_t start, end, startloop, endloop, sampleRate;
  uint8_t originalPitch;
  int8_t pitchCorrection;
  uint16_t wSampleLink, sampleType;
} shdrcast;
#pragma pack(pop)
typedef shdrcast shdr;

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
  /* Spec key/vel amounts: low byte = lo, high byte = hi. Not two structs,
     so zone_t stays 60 int16s with no padding. */
  uint16_t KeyRange, VelRange;
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

_Static_assert(SF2_GENERATOR_COUNT == Dummy + 1, "generator enum must be 60");
_Static_assert(sizeof(short) == 2, "short must be 16-bit");
_Static_assert(sizeof(zone_t) == SF2_GENERATOR_SIZE_BYTES,
               "zone_t must be packed 60 x int16");
_Static_assert(sizeof(phdr) == SF2_PHDR_SIZE, "phdr record");
_Static_assert(sizeof(pbag) == SF2_BAG_SIZE, "pbag record");
_Static_assert(sizeof(pmod) == SF2_MOD_SIZE, "pmod record");
_Static_assert(sizeof(pgen_t) == SF2_GEN_SIZE, "pgen record");
_Static_assert(sizeof(inst) == SF2_INST_SIZE, "inst record");
_Static_assert(sizeof(ibag) == SF2_BAG_SIZE, "ibag record");
_Static_assert(sizeof(shdrcast) == SF2_SHDR_SIZE, "shdr record");

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

typedef struct {
  uint16_t program;
  uint16_t bank;
  phdr *header;
  zone_t *zones; /* sentinel-terminated: zones[count].SampleId == -1 */
} sf2_preset_ref;

typedef struct {
  zone_t *ptr;
  int count; /* includes the SampleId == -1 sentinel */
} sf2_zone_block;

typedef struct sf2_font {
  const uint8_t *bytes; /* not owned */
  size_t length;

  phdr *phdrs;
  int nphdrs;
  pbag *pbags;
  int npbags;
  pmod *pmods;
  int npmods;
  pgen *pgens;
  int npgens;
  inst *insts;
  int ninsts;
  ibag *ibags;
  int nibags;
  imod *imods;
  int nimods;
  igen *igens;
  int nigens;
  shdr *shdrs;
  int nshdrs;

  /* GM-shaped table for the existing JS presetRefs view.
     [0,128) bank 0, [128,256) bank 128. Other banks are only in presets[]. */
  zone_t *gm[SF2_GM_SLOTS];
  sf2_preset_ref *presets;
  int npresets;

  sf2_zone_block *blocks;
  int nblocks;
  int blocks_cap;
} sf2_font;

void sf2_font_init(sf2_font *font);
void sf2_font_clear(sf2_font *font);

/* Map the nine pdta subchunks. Does not allocate zones and does not copy
   buf. Returns SF2_OK or a negative SF2_ERR_*. */
int sf2_read_pdta(sf2_font *font, const void *buf, size_t len);

/* read + expand every non-terminal preset. Zones are owned by font.
   Returns SF2_OK or a negative SF2_ERR_*. */
int sf2_load_pdta(sf2_font *font, const void *buf, size_t len);

phdr *sf2_find_preset(const sf2_font *font, int program, int bank);
zone_t *sf2_font_zones(const sf2_font *font, int program, int bank);

/* Key/velocity match inside this preset's zone list only.
   vel > 0 and key > 0 are filters; 0 disables that axis.
   Miss falls back to key-only, then to the first zone of THIS list.
   Returns NULL when from is NULL or the list is empty. Never borrows
   another preset's zones. */
zone_t *filterForZone(zone_t *from, uint8_t key, uint8_t vel);

/* WASM/JS bridge. Define skipthis for native tests that do not link the
   emscripten library (lib.js provides these). */
#ifndef skipthis
void emitHeader(int pid, int bid, void *name);
void emitZone(int pid, void *zone);
void emitSample(int id, int pid, void *p);
void emitFilter(int type, uint8_t lo, uint8_t hi);
#endif

/* Single active font used by the historical exports. loadpdta returns a
   heap watermark (exclusive byte offset) covering buf and every zone
   block, or NULL. Pass the pdta byte length; the buffer must stay alive. */
void *loadpdta(void *pdtabuffer, unsigned int len);
void *shdrref(void);
void *presetRef(void);
void *instRef(int instId);
phdr *findPreset(int pid, int bank_id);
zone_t *sf2_zones_for(int program, int bank);
zone_t *findPresetZones(phdr *phr, int nregions);
int findPresetZonesCount(phdr *phr);

#endif
