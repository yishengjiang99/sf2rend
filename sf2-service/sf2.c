#include <stdlib.h>
#include <string.h>

#include "sf2.h"

static inline int iclamp(int val, int lo, int hi) {
  if (val > hi)
    return hi;
  if (val < lo)
    return lo;
  return val;
}

static inline short sadd(short ival, short pval, int lo, int hi) {
  return (short)iclamp((int)ival + (int)pval, lo, hi);
}

static short merge_range(short ival, short pval) {
  unsigned iu = (unsigned short)ival;
  unsigned pu = (unsigned short)pval;
  unsigned ilo = iu & 0x7fu;
  unsigned ihi = (iu >> 8) & 0x7fu;
  unsigned plo = pu & 0x7fu;
  unsigned phi = (pu >> 8) & 0x7fu;
  if (plo > ilo)
    ilo = plo;
  if (phi < ihi)
    ihi = phi;
  return (short)(ilo | (ihi << 8));
}

/* Preset generators add to the instrument value, except the instrument-only
   operators (sample address, keynum, velocity, sampleID, sampleModes,
   exclusive class, overriding root key) and the internal bag ids.
   Pan and attenuation stay in spec units (0.1% and centibels). */
static short add_pbag_val_to_zone(int genop, short ival, short pval) {
  switch (genop) {
  case StartAddrOfs:
  case EndAddrOfs:
  case StartLoopAddrOfs:
  case EndLoopAddrOfs:
  case StartAddrCoarseOfs:
  case EndAddrCoarseOfs:
  case StartLoopAddrCoarseOfs:
  case EndLoopAddrCoarseOfs:
  case Keynum:
  case Velocity:
  case SampleId:
  case SampleModes:
  case ExclusiveClass:
  case OverrideRootKey:
  case IBAGID:
  case PBagId:
  case Unused1:
  case Unused4:
  case Reserved1:
  case Reserved2:
  case Reserved3:
  case Dummy:
    return ival;
  case Instrument:
    /* Zone field carries the preset's instrument index for the JS lookup. */
    return pval;
  case KeyRange:
  case VelRange:
    return merge_range(ival, pval);
  case ModLFODelay:
  case VibLFODelay:
  case ModEnvDelay:
  case VolEnvDelay:
  case VolEnvHold:
  case ModEnvHold:
    return sadd(ival, pval, SF2_MIN_DELAY, SF2_MAX_DELAY_SHORT);
  case ModEnvAttack:
  case ModEnvDecay:
  case ModEnvRelease:
  case VolEnvAttack:
  case VolEnvDecay:
  case VolEnvRelease:
    return sadd(ival, pval, SF2_MIN_DELAY, SF2_MAX_DELAY_LONG);
  case Key2ModEnvHold:
  case Key2ModEnvDecay:
  case Key2VolEnvHold:
  case Key2VolEnvDecay:
    return sadd(ival, pval, SF2_MIN_KEY_MOD, SF2_MAX_KEY_MOD);
  case Pan:
    return sadd(ival, pval, SF2_MIN_PAN, SF2_MAX_PAN);
  case Attenuation:
    return sadd(ival, pval, SF2_MIN_ATTENUATION, SF2_MAX_ATTENUATION);
  case ChorusSend:
  case ReverbSend:
    return sadd(ival, pval, SF2_MIN_SEND, SF2_MAX_SEND);
  case ModEnvSustain:
    return sadd(ival, pval, SF2_MIN_SUSTAIN, SF2_MAX_SUSTAIN_MOD);
  case VolEnvSustain:
    return sadd(ival, pval, SF2_MIN_SUSTAIN, SF2_MAX_SUSTAIN_VOL);
  case ModLFO2Pitch:
  case VibLFO2Pitch:
  case ModLFO2FilterFc:
  case ModEnv2FilterFc:
  case ModLFO2Vol:
  case ModEnv2Pitch:
    return sadd(ival, pval, SF2_MIN_MODULATION, SF2_MAX_MODULATION);
  case FilterFc:
    return sadd(ival, pval, SF2_MIN_FILTER_FC, SF2_MAX_FILTER_FC);
  case FilterQ:
    return sadd(ival, pval, SF2_MIN_FILTER_Q, SF2_MAX_FILTER_Q);
  case VibLFOFreq:
  case ModLFOFreq:
    return sadd(ival, pval, SF2_MIN_LFO_FREQ, SF2_MAX_LFO_FREQ);
  case CoarseTune:
    return sadd(ival, pval, SF2_MIN_COARSE_TUNE, SF2_MAX_COARSE_TUNE);
  case FineTune:
    return sadd(ival, pval, SF2_MIN_FINE_TUNE, SF2_MAX_FINE_TUNE);
  case ScaleTune:
    return sadd(ival, pval, SF2_MIN_SCALE_TUNE, SF2_MAX_SCALE_TUNE);
  default: {
    int sum = (int)ival + (int)pval;
    return (short)iclamp(sum, -32768, 32767);
  }
  }
}

/* Historical WASM entry points share one font. sf2_load_pdta is reentrant. */
static sf2_font g_font;

void sf2_font_init(sf2_font *font) {
  if (font)
    memset(font, 0, sizeof *font);
}

void sf2_font_clear(sf2_font *font) {
  int i;
  if (!font)
    return;
  for (i = 0; i < font->nblocks; i++)
    free(font->blocks[i].ptr);
  free(font->blocks);
  free(font->presets);
  memset(font, 0, sizeof *font);
}

static int parse_pdta(sf2_font *font, const uint8_t *buf, size_t len) {
  static const struct {
    char tag[4];
    int rec;
  } expect[9] = {
      {{'p', 'h', 'd', 'r'}, SF2_PHDR_SIZE},
      {{'p', 'b', 'a', 'g'}, SF2_BAG_SIZE},
      {{'p', 'm', 'o', 'd'}, SF2_MOD_SIZE},
      {{'p', 'g', 'e', 'n'}, SF2_GEN_SIZE},
      {{'i', 'n', 's', 't'}, SF2_INST_SIZE},
      {{'i', 'b', 'a', 'g'}, SF2_BAG_SIZE},
      {{'i', 'm', 'o', 'd'}, SF2_MOD_SIZE},
      {{'i', 'g', 'e', 'n'}, SF2_GEN_SIZE},
      {{'s', 'h', 'd', 'r'}, SF2_SHDR_SIZE},
  };
  void *ptrs[9];
  int counts[9];
  size_t off = 0;
  int i;

  for (i = 0; i < 9; i++) {
    uint32_t sz;
    if (len - off < SF2_SECTION_HEADER_SIZE)
      return SF2_ERR_TRUNCATED;
    if (memcmp(buf + off, expect[i].tag, 4) != 0)
      return SF2_ERR_BAD_CHUNK;
    memcpy(&sz, buf + off + 4, sizeof sz);
    off += SF2_SECTION_HEADER_SIZE;
    if ((size_t)sz > len - off)
      return SF2_ERR_TRUNCATED;
    if (expect[i].rec == 0 || (sz % (uint32_t)expect[i].rec) != 0)
      return SF2_ERR_BAD_CHUNK;
    counts[i] = (int)(sz / (uint32_t)expect[i].rec);
    if (counts[i] < 1)
      return SF2_ERR_BAD_CHUNK; /* terminal record is mandatory */
    ptrs[i] = (void *)(buf + off);
    off += sz;
    if ((sz & 1u) && off < len)
      off++; /* RIFF word padding between odd-sized chunks */
  }

  font->bytes = buf;
  font->length = len;
  font->phdrs = ptrs[0];
  font->nphdrs = counts[0];
  font->pbags = ptrs[1];
  font->npbags = counts[1];
  font->pmods = ptrs[2];
  font->npmods = counts[2];
  font->pgens = ptrs[3];
  font->npgens = counts[3];
  font->insts = ptrs[4];
  font->ninsts = counts[4];
  font->ibags = ptrs[5];
  font->nibags = counts[5];
  font->imods = ptrs[6];
  font->nimods = counts[6];
  font->igens = ptrs[7];
  font->nigens = counts[7];
  font->shdrs = ptrs[8];
  font->nshdrs = counts[8];
  return SF2_OK;
}

int sf2_read_pdta(sf2_font *font, const void *buf, size_t len) {
  if (!font || !buf)
    return SF2_ERR_NULL;
  if (len < SF2_SECTION_HEADER_SIZE)
    return SF2_ERR_TRUNCATED;
  return parse_pdta(font, (const uint8_t *)buf, len);
}

static int preset_bag_bounds(const sf2_font *font, const phdr *phr, int *start,
                             int *end) {
  /* phr+1 is the next header, including the terminal EOP. A missing
     terminal header used to read one record past nphdrs. */
  if (!font->phdrs || font->nphdrs < 2 || phr < font->phdrs ||
      phr >= font->phdrs + font->nphdrs - 1)
    return -1;
  *start = phr->pbagNdx;
  *end = (phr + 1)->pbagNdx;
  if (*start < 0 || *end < *start || *end > font->npbags)
    return -1;
  return 0;
}

static int inst_bag_bounds(const sf2_font *font, int inst_id, int *start,
                           int *end) {
  if (inst_id < 0 || font->ninsts < 2 || inst_id >= font->ninsts - 1)
    return -1;
  *start = font->insts[inst_id].ibagNdx;
  *end = font->insts[inst_id + 1].ibagNdx;
  if (*start < 0 || *end < *start || *end > font->nibags)
    return -1;
  return 0;
}

static int gen_limit(int bag, int nbags, int next_gen, int ngens) {
  int end = (bag < nbags - 1) ? next_gen : ngens;
  return end;
}

static int gen_span_ok(int start, int end, int ngens) {
  return start >= 0 && end >= start && end <= ngens;
}

/* The chunk's final all-zero generator is the spec terminal, not data.
   Skipping only that record keeps a real last generator (the old pgen
   path used an inclusive npgens-1 and dropped it). */
static int is_terminal_gen(int index, int ngens, unsigned short genid,
                           short amount) {
  return ngens > 0 && index == ngens - 1 && genid == 0 && amount == 0;
}

static int ensure_zones(zone_t **zones, int *cap, int need) {
  int ncap;
  zone_t *grown;
  if (need <= *cap)
    return SF2_OK;
  if (need > SF2_MAX_ZONES + 1)
    return SF2_ERR_NOMEM;
  ncap = *cap ? *cap * 2 : 8;
  if (ncap < need)
    ncap = need;
  if (ncap > SF2_MAX_ZONES + 1)
    ncap = SF2_MAX_ZONES + 1;
  if (ncap < need)
    return SF2_ERR_NOMEM;
  grown = (zone_t *)realloc(*zones, (size_t)ncap * sizeof(zone_t));
  if (!grown)
    return SF2_ERR_NOMEM;
  *zones = grown;
  *cap = ncap;
  return SF2_OK;
}

static void apply_gens(short *dst, const pgen_t *gens, int start, int end,
                       int ngens) {
  int k;
  for (k = start; k < end; k++) {
    unsigned short id = gens[k].genid;
    if (is_terminal_gen(k, ngens, id, gens[k].val.shAmount))
      continue;
    if (id < SF2_GENERATOR_COUNT)
      dst[id] = gens[k].val.shAmount;
  }
}

static int collect_zones(const sf2_font *font, phdr *phr, zone_t **out,
                         int *out_count) {
  int pbag_start, pbag_end, j;
  int count = 0, cap = 0;
  zone_t *zones = NULL;
  short preset_default[SF2_GENERATOR_COUNT];

  *out = NULL;
  *out_count = 0;
  if (!font || !phr)
    return SF2_ERR_NULL;

  memset(preset_default, 0, sizeof preset_default);
  preset_default[VelRange] = (short)(127 << 8);
  preset_default[KeyRange] = (short)(127 << 8);

  if (preset_bag_bounds(font, phr, &pbag_start, &pbag_end) != 0) {
    if (ensure_zones(&zones, &cap, 1) != SF2_OK)
      return SF2_ERR_NOMEM;
    memset(zones, 0, sizeof(zone_t));
    zones[0].SampleId = -1;
    *out = zones;
    return SF2_OK;
  }

  for (j = pbag_start; j < pbag_end; j++) {
    pbag *pg = font->pbags + j;
    int pgen_start = pg->pgen_id;
    int pgen_end = gen_limit(j, font->npbags,
                             (j < font->npbags - 1) ? font->pbags[j + 1].pgen_id : 0,
                             font->npgens);
    short pbag_vals[SF2_GENERATOR_COUNT];
    int inst_id = -1;
    int ibag_start, ibag_end, ibg, k;
    short inst_default[SF2_GENERATOR_COUNT] = defattrs;

    if (!gen_span_ok(pgen_start, pgen_end, font->npgens))
      continue;

    memcpy(pbag_vals, preset_default, sizeof pbag_vals);
    pbag_vals[Instrument] = -1;
    pbag_vals[PBagId] = (short)j;

    /* Apply every preset generator first. Spec puts Instrument last;
       malformed files sometimes don't, and the zone merge needs the
       whole bag either way. */
    apply_gens(pbag_vals, font->pgens, pgen_start, pgen_end, font->npgens);
    for (k = pgen_start; k < pgen_end; k++) {
      if (font->pgens[k].genid == Instrument)
        inst_id = (int)font->pgens[k].val.uAmount;
    }

    if (inst_id < 0) {
      memcpy(preset_default, pbag_vals, sizeof pbag_vals);
      continue;
    }
    pbag_vals[Instrument] = (short)inst_id;
    if (inst_bag_bounds(font, inst_id, &ibag_start, &ibag_end) != 0)
      continue;

    for (ibg = ibag_start; ibg < ibag_end; ibg++) {
      ibag *bag = font->ibags + ibg;
      int igen_start = bag->igen_id;
      int igen_end = gen_limit(ibg, font->nibags,
                               (ibg < font->nibags - 1) ? font->ibags[ibg + 1].igen_id : 0,
                               font->nigens);
      short inst_zone[SF2_GENERATOR_COUNT];
      unsigned sample_id;
      int g;

      if (!gen_span_ok(igen_start, igen_end, font->nigens))
        continue;

      memcpy(inst_zone, inst_default, sizeof inst_zone);
      apply_gens(inst_zone, font->igens, igen_start, igen_end, font->nigens);

      if (inst_zone[SampleId] == -1) {
        memcpy(inst_default, inst_zone, sizeof inst_zone);
        continue;
      }

      sample_id = (unsigned short)inst_zone[SampleId];
      /* Last shdr is the EOS record, not a playable sample. */
      if (font->nshdrs < 2 || sample_id >= (unsigned)(font->nshdrs - 1))
        continue;

      for (g = 0; g < SF2_GENERATOR_COUNT; g++)
        inst_zone[g] = add_pbag_val_to_zone(g, inst_zone[g], pbag_vals[g]);
      inst_zone[IBAGID] = (short)ibg;
      inst_zone[PBagId] = (short)j;

      if (ensure_zones(&zones, &cap, count + 1) != SF2_OK) {
        free(zones);
        return SF2_ERR_NOMEM;
      }
      memcpy(zones + count, inst_zone, SF2_GENERATOR_SIZE_BYTES);
      count++;
    }
  }

  if (ensure_zones(&zones, &cap, count + 1) != SF2_OK) {
    free(zones);
    return SF2_ERR_NOMEM;
  }
  memset(zones + count, 0, sizeof(zone_t));
  zones[count].SampleId = -1;
  *out = zones;
  *out_count = count;
  return SF2_OK;
}

static int track_block(sf2_font *font, zone_t *zones, int count_with_sentinel) {
  if (font->nblocks == font->blocks_cap) {
    int ncap = font->blocks_cap ? font->blocks_cap * 2 : 8;
    sf2_zone_block *grown = (sf2_zone_block *)realloc(
        font->blocks, (size_t)ncap * sizeof(sf2_zone_block));
    if (!grown)
      return SF2_ERR_NOMEM;
    font->blocks = grown;
    font->blocks_cap = ncap;
  }
  font->blocks[font->nblocks].ptr = zones;
  font->blocks[font->nblocks].count = count_with_sentinel;
  font->nblocks++;
  return SF2_OK;
}

static int gm_slot(int program, int bank) {
  if (program < 0 || program >= SF2_MAX_PRESETS)
    return -1;
  if (bank == 0)
    return program;
  if (bank == 128)
    return SF2_MAX_PRESETS + program;
  return -1;
}

int sf2_load_pdta(sf2_font *font, const void *buf, size_t len) {
  int err, i;
  if (!font)
    return SF2_ERR_NULL;
  sf2_font_clear(font);
  err = sf2_read_pdta(font, buf, len);
  if (err != SF2_OK)
    return err;
  if (font->nphdrs < 2)
    return SF2_OK;

  font->npresets = font->nphdrs - 1; /* drop terminal EOP */
  font->presets =
      (sf2_preset_ref *)calloc((size_t)font->npresets, sizeof(sf2_preset_ref));
  if (!font->presets) {
    sf2_font_clear(font);
    return SF2_ERR_NOMEM;
  }

  for (i = 0; i < font->npresets; i++) {
    phdr *phr = font->phdrs + i;
    zone_t *zones = NULL;
    int nzones = 0;
    int slot;
    err = collect_zones(font, phr, &zones, &nzones);
    if (err != SF2_OK) {
      sf2_font_clear(font);
      return err;
    }
    err = track_block(font, zones, nzones + 1);
    if (err != SF2_OK) {
      free(zones);
      sf2_font_clear(font);
      return err;
    }
#ifndef skipthis
    {
      int z;
      emitHeader((int)phr->pid, (int)phr->bankId, phr->name);
      for (z = 0; z < nzones; z++)
        emitZone((int)phr->pid, zones + z);
    }
#endif
    font->presets[i].program = phr->pid;
    font->presets[i].bank = phr->bankId;
    font->presets[i].header = phr;
    font->presets[i].zones = zones;
    slot = gm_slot((int)phr->pid, (int)phr->bankId);
    if (slot >= 0 && font->gm[slot] == NULL)
      font->gm[slot] = zones;
  }
  return SF2_OK;
}

phdr *sf2_find_preset(const sf2_font *font, int program, int bank) {
  int i;
  int n;
  if (!font)
    return NULL;
  n = font->nphdrs > 0 ? font->nphdrs - 1 : 0;
  for (i = 0; i < n; i++) {
    if ((int)font->phdrs[i].pid == program && (int)font->phdrs[i].bankId == bank)
      return font->phdrs + i;
  }
  return NULL;
}

zone_t *sf2_font_zones(const sf2_font *font, int program, int bank) {
  int i;
  if (!font)
    return NULL;
  for (i = 0; i < font->npresets; i++) {
    if ((int)font->presets[i].program == program &&
        (int)font->presets[i].bank == bank)
      return font->presets[i].zones;
  }
  return NULL;
}

static int zone_accepts(const zone_t *z, int key, int vel) {
  if (vel > 0) {
    unsigned vr = z->VelRange;
    unsigned lo = vr & 0x7fu;
    unsigned hi = (vr >> 8) & 0x7fu;
    if (lo > (unsigned)vel || hi < (unsigned)vel)
      return 0;
  }
  if (key > 0) {
    unsigned kr = z->KeyRange;
    unsigned lo = kr & 0x7fu;
    unsigned hi = (kr >> 8) & 0x7fu;
    if (lo > (unsigned)key || hi < (unsigned)key)
      return 0;
  }
  return 1;
}

zone_t *filterForZone(zone_t *from, uint8_t key, uint8_t vel) {
  int pass;
  /* Drop velocity, then drop key. The last pass is "any zone in THIS list". */
  int keys[3];
  int vels[3];
  if (!from)
    return NULL;
  keys[0] = key;
  vels[0] = vel;
  keys[1] = key;
  vels[1] = 0;
  keys[2] = 0;
  vels[2] = 0;
  for (pass = 0; pass < 3; pass++) {
    zone_t *z;
    int n;
    if (pass == 1 && vel == 0)
      continue;
    if (pass == 2 && key == 0)
      continue;
    for (z = from, n = 0; n < SF2_MAX_ZONES && z->SampleId != -1; z++, n++) {
      if (zone_accepts(z, keys[pass], vels[pass]))
        return z;
    }
  }
  return NULL;
}

static void *watermark(const sf2_font *font, const void *buf, size_t len) {
  uintptr_t hi = (uintptr_t)buf + (uintptr_t)len;
  int i;
  for (i = 0; i < font->nblocks; i++) {
    uintptr_t end =
        (uintptr_t)(font->blocks[i].ptr + font->blocks[i].count);
    if (end > hi)
      hi = end;
  }
  return (void *)hi;
}

void *loadpdta(void *pdtabuffer, unsigned int len) {
  int err;
  if (!pdtabuffer)
    return NULL;
  err = sf2_load_pdta(&g_font, pdtabuffer, (size_t)len);
  if (err != SF2_OK)
    return NULL;
  return watermark(&g_font, pdtabuffer, (size_t)len);
}

void *shdrref(void) { return g_font.shdrs; }

void *presetRef(void) { return g_font.gm; }

void *instRef(int instId) {
  if (instId < 0 || instId >= g_font.ninsts)
    return NULL;
  return g_font.insts + instId;
}

phdr *findPreset(int pid, int bank_id) {
  return sf2_find_preset(&g_font, pid, bank_id);
}

zone_t *sf2_zones_for(int program, int bank) {
  return sf2_font_zones(&g_font, program, bank);
}

zone_t *findPresetZones(phdr *phr, int nregions) {
  zone_t *zones = NULL;
  int n = 0;
  (void)nregions;
  if (collect_zones(&g_font, phr, &zones, &n) != SF2_OK)
    return NULL;
#ifndef skipthis
  if (phr) {
    int z;
    for (z = 0; z < n; z++)
      emitZone((int)phr->pid, zones + z);
  }
#endif
  return zones;
}

int findPresetZonesCount(phdr *phr) {
  zone_t *zones = NULL;
  int n = 0;
  if (collect_zones(&g_font, phr, &zones, &n) != SF2_OK)
    return 0;
  free(zones);
  return n;
}
