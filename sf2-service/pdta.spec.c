#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "sf2.h"

static int g_fails;

static void expect(int cond, const char *msg) {
  if (!cond) {
    fprintf(stderr, "FAIL %s\n", msg);
    g_fails++;
  }
}

typedef struct {
  uint8_t *data;
  size_t len;
  size_t cap;
} buf_t;

static void bpush(buf_t *b, const void *p, size_t n) {
  if (b->len + n > b->cap) {
    size_t nc = b->cap ? b->cap * 2 : 256;
    while (nc < b->len + n)
      nc *= 2;
    b->data = (uint8_t *)realloc(b->data, nc);
    b->cap = nc;
  }
  memcpy(b->data + b->len, p, n);
  b->len += n;
}

static void chunk(buf_t *b, const char *tag, const void *payload, uint32_t sz) {
  uint8_t pad = 0;
  bpush(b, tag, 4);
  bpush(b, &sz, 4);
  if (sz && payload)
    bpush(b, payload, sz);
  if (sz & 1u)
    bpush(b, &pad, 1);
}

static void set_phdr(phdr *p, const char *name, uint16_t pid, uint16_t bank,
                     uint16_t bag) {
  memset(p, 0, sizeof *p);
  strncpy(p->name, name, 19);
  p->pid = pid;
  p->bankId = bank;
  p->pbagNdx = bag;
}

static void set_inst(inst *p, const char *name, uint16_t bag) {
  memset(p, 0, sizeof *p);
  strncpy(p->name, name, 19);
  p->ibagNdx = bag;
}

static void set_shdr(shdr *s, const char *name, uint32_t start, uint32_t end) {
  memset(s, 0, sizeof *s);
  strncpy(s->name, name, 19);
  s->start = start;
  s->end = end;
  s->sampleRate = 44100;
  s->originalPitch = 60;
  s->sampleType = monoSample;
}

static pgen make_gen(unsigned short id, int amount) {
  pgen g;
  memset(&g, 0, sizeof g);
  g.genid = id;
  g.val.shAmount = (short)amount;
  return g;
}

static int zone_count(const zone_t *z) {
  int n = 0;
  if (!z)
    return -1;
  while (n < SF2_MAX_ZONES && z[n].SampleId != -1)
    n++;
  return n;
}

static unsigned range_lo(uint16_t r) { return r & 0x7fu; }
static unsigned range_hi(uint16_t r) { return (r >> 8) & 0x7fu; }

/* Preset bag generators are not required to be last in the chunk.
   Instrument SampleId is the last real igen of a non-terminal bag. */
static buf_t build_merge_font(void) {
  phdr ph[4];
  pbag pb[4];
  pmod pm;
  pgen pg[11];
  inst in[2];
  ibag ib[3];
  imod im;
  igen ig[8];
  shdr sh[2];
  buf_t b;
  memset(&b, 0, sizeof b);
  memset(pb, 0, sizeof pb);
  memset(&pm, 0, sizeof pm);
  memset(ib, 0, sizeof ib);
  memset(&im, 0, sizeof im);
  memset(pg, 0, sizeof pg);
  memset(ig, 0, sizeof ig);

  set_phdr(&ph[0], "Piano", 0, 0, 0);
  set_phdr(&ph[1], "Kit", 5, 128, 1);
  set_phdr(&ph[2], "Pad", 2, 3, 2);
  set_phdr(&ph[3], "EOP", 255, 255, 3);

  pb[0].pgen_id = 0;
  pb[1].pgen_id = 8;
  pb[2].pgen_id = 9;
  pb[3].pgen_id = 10;

  pg[0] = make_gen(KeyRange, 15 | (40 << 8));
  pg[1] = make_gen(CoarseTune, 12);
  pg[2] = make_gen(Pan, 50);
  pg[3] = make_gen(FineTune, -3);
  pg[4] = make_gen(StartAddrOfs, 99);
  pg[5] = make_gen(ChorusSend, 100);
  pg[6] = make_gen(Attenuation, 10);
  pg[7] = make_gen(Instrument, 0);
  pg[8] = make_gen(Instrument, 0);
  pg[9] = make_gen(Instrument, 0);
  pg[10] = make_gen(0, 0);

  set_inst(&in[0], "Piano", 0);
  set_inst(&in[1], "EOI", 2);
  ib[0].igen_id = 0;
  ib[1].igen_id = 3;
  ib[2].igen_id = 7;

  ig[0] = make_gen(CoarseTune, 1);
  ig[1] = make_gen(Pan, -200);
  ig[2] = make_gen(StartAddrOfs, 7);
  ig[3] = make_gen(KeyRange, 10 | (20 << 8));
  ig[4] = make_gen(VelRange, 0 | (127 << 8));
  ig[5] = make_gen(FineTune, 30);
  ig[6] = make_gen(SampleId, 0);
  ig[7] = make_gen(0, 0);

  set_shdr(&sh[0], "Sine", 0, 10);
  set_shdr(&sh[1], "EOS", 0, 0);

  chunk(&b, "phdr", ph, sizeof ph);
  chunk(&b, "pbag", pb, sizeof pb);
  chunk(&b, "pmod", &pm, sizeof pm);
  chunk(&b, "pgen", pg, sizeof pg);
  chunk(&b, "inst", in, sizeof in);
  chunk(&b, "ibag", ib, sizeof ib);
  chunk(&b, "imod", &im, sizeof im);
  chunk(&b, "igen", ig, sizeof ig);
  chunk(&b, "shdr", sh, sizeof sh);
  return b;
}

/* One bag, no terminal generator record. SampleId / Instrument are the
   last words in their chunks and must still be applied. */
static buf_t build_last_gen_font(void) {
  phdr ph[2];
  pbag pb;
  pmod pm;
  pgen pg;
  inst in[2];
  ibag ib;
  imod im;
  igen ig;
  shdr sh[2];
  buf_t b;

  memset(&b, 0, sizeof b);
  memset(&pb, 0, sizeof pb);
  memset(&pm, 0, sizeof pm);
  memset(&ib, 0, sizeof ib);
  memset(&im, 0, sizeof im);

  set_phdr(&ph[0], "Solo", 1, 0, 0);
  set_phdr(&ph[1], "EOP", 255, 255, 1);
  pg = make_gen(Instrument, 0);
  set_inst(&in[0], "Solo", 0);
  set_inst(&in[1], "EOI", 1);
  ig = make_gen(SampleId, 0);
  set_shdr(&sh[0], "S", 0, 4);
  set_shdr(&sh[1], "EOS", 0, 0);

  chunk(&b, "phdr", ph, sizeof ph);
  chunk(&b, "pbag", &pb, sizeof pb);
  chunk(&b, "pmod", &pm, sizeof pm);
  chunk(&b, "pgen", &pg, sizeof pg);
  chunk(&b, "inst", in, sizeof in);
  chunk(&b, "ibag", &ib, sizeof ib);
  chunk(&b, "imod", &im, sizeof im);
  chunk(&b, "igen", &ig, sizeof ig);
  chunk(&b, "shdr", sh, sizeof sh);
  return b;
}

static size_t pdta_off(const uint8_t *sf, size_t n) {
  size_t off = 12;
  while (off + 8 <= n) {
    char tag[5] = {0};
    uint32_t sz;
    memcpy(tag, sf + off, 4);
    memcpy(&sz, sf + off + 4, 4);
    if (memcmp(tag, "LIST", 4) == 0 && off + 12 <= n &&
        memcmp(sf + off + 8, "pdta", 4) == 0)
      return off + 12;
    off += 8u + sz + (sz & 1u);
  }
  return 0;
}

int main(void) {
  buf_t merge = build_merge_font();
  buf_t last = build_last_gen_font();
  sf2_font font, other;
  zone_t *z;
  zone_t *kit;
  zone_t *pad;
  int n;
  /* Vendored: fixtures were duplicates of the repo's static/ SoundFonts. */
  const char *fixpath = "../static/VintageDreamsWaves-v2.sf2";
  FILE *fp;
  uint8_t *file = NULL;
  long flen = 0;

  sf2_font_init(&font);
  sf2_font_init(&other);

  expect(sf2_load_pdta(NULL, merge.data, merge.len) == SF2_ERR_NULL, "null font");
  expect(sf2_load_pdta(&font, NULL, 10) == SF2_ERR_NULL, "null buf");
  expect(sf2_load_pdta(&font, merge.data, 4) == SF2_ERR_TRUNCATED, "truncated");

  {
    uint8_t bad[16];
    memset(bad, 0, sizeof bad);
    memcpy(bad, "XXXX", 4);
    expect(sf2_read_pdta(&font, bad, sizeof bad) == SF2_ERR_BAD_CHUNK, "bad fourcc");
  }
  {
    uint8_t *tweaked = (uint8_t *)malloc(merge.len);
    memcpy(tweaked, merge.data, merge.len);
    memcpy(tweaked + 8 + (uint32_t)sizeof(phdr) * 4, "XXXX", 4);
    expect(sf2_read_pdta(&font, tweaked, merge.len) == SF2_ERR_BAD_CHUNK,
           "swapped chunk");
    free(tweaked);
  }
  {
    uint8_t huge[8] = {'p', 'h', 'd', 'r', 0xf0, 0xff, 0xff, 0x0f};
    expect(sf2_read_pdta(&font, huge, sizeof huge) == SF2_ERR_TRUNCATED,
           "huge chunk size");
  }

  expect(sf2_load_pdta(&font, merge.data, merge.len) == SF2_OK, "load merge");
  expect(font.nphdrs == 4, "phdr count includes EOP");
  expect(font.nshdrs == 2, "shdr count");
  expect(font.shdrs[0].end == 10, "shdr end field");
  expect(font.shdrs[0].originalPitch == 60, "shdr pitch");
  expect(memcmp(font.shdrs[0].name, "Sine", 4) == 0, "shdr name");
  expect(memcmp(font.shdrs[1].name, "EOS", 3) == 0, "eos name");
  expect(sf2_find_preset(&font, 255, 255) == NULL, "terminal phdr skipped");

  z = sf2_font_zones(&font, 0, 0);
  n = zone_count(z);
  expect(n == 1, "one merged zone");
  expect(z[n].SampleId == -1, "sentinel written");
  expect(z[0].CoarseTune == 13, "coarse tune adds");
  expect(z[0].FineTune == 27, "fine tune adds");
  expect(z[0].Pan == -150, "pan stays in 0.1 percent");
  expect(z[0].StartAddrOfs == 7, "address gen is instrument-only");
  expect(z[0].ChorusSend == 100, "chorus preset adds");
  expect(z[0].Attenuation == 10, "attenuation adds");
  expect(z[0].ScaleTune == 100, "unset preset scale does not clobber");
  expect(range_lo(z[0].KeyRange) == 15 && range_hi(z[0].KeyRange) == 20,
         "key range intersection");
  expect(z[0].SampleId == 0, "sample id");
  expect(z[0].Instrument == 0, "instrument index kept from preset");
  expect(filterForZone(NULL, 60, 60) == NULL, "null filter");
  expect(filterForZone(z, 17, 64) == z, "filter hit");
  expect(filterForZone(z + 1, 17, 64) == NULL, "empty list is null");
  {
    zone_t *hit = filterForZone(z, 1, 1);
    expect(hit == z, "fallback stays on this preset");
  }

  kit = sf2_font_zones(&font, 5, 128);
  pad = sf2_font_zones(&font, 2, 3);
  expect(kit != NULL && zone_count(kit) == 1, "drum bank 128");
  expect(pad != NULL && zone_count(pad) == 1, "melodic bank 3");
  expect(font.gm[5] == NULL, "bank 3 is not gm slot 5");
  expect(font.gm[128 + 5] == kit, "drum gm slot");
  expect(sf2_font_zones(&font, 9, 9) == NULL, "missing preset");

  expect(sf2_load_pdta(&other, merge.data, merge.len) == SF2_OK, "second font");
  expect(other.shdrs != font.shdrs || other.presets != font.presets,
         "fonts do not share zone tables");
  sf2_font_clear(&font);
  expect(memcmp(other.shdrs[0].name, "Sine", 4) == 0, "cleared font does not free the other");
  expect(sf2_font_zones(&other, 0, 0)[0].CoarseTune == 13, "other font zones live");

  sf2_font_clear(&other);
  expect(sf2_load_pdta(&font, last.data, last.len) == SF2_OK, "last-gen font");
  z = sf2_font_zones(&font, 1, 0);
  expect(z != NULL && z[0].SampleId == 0, "last generator of last bag kept");
  expect(z[1].SampleId == -1, "last-gen sentinel");

  expect(loadpdta(merge.data, (unsigned)merge.len) != NULL, "legacy loadpdta");
  expect(findPreset(0, 0) != NULL, "legacy findPreset");
  expect(findPresetZonesCount(findPreset(0, 0)) == 1, "count matches fill");
  expect(shdrref() != NULL && presetRef() != NULL, "legacy refs");
  expect(instRef(0) != NULL && instRef(99) == NULL, "inst bounds");
  expect(sf2_zones_for(2, 3) != NULL, "active-font non-gm lookup");
  expect(sf2_zones_for(5, 128) != NULL, "active-font drum lookup");
  {
    zone_t *gm0 = ((zone_t **)presetRef())[0];
    expect(gm0 != NULL && gm0[0].Pan == -150, "gm table preset 0");
  }

  fp = fopen(fixpath, "rb");
  expect(fp != NULL, "open fixture");
  if (fp) {
    sf2_font real;
    int p;
    uint8_t *pdta;
    size_t poff, plen;
    fseek(fp, 0, SEEK_END);
    flen = ftell(fp);
    fseek(fp, 0, SEEK_SET);
    file = (uint8_t *)malloc((size_t)flen);
    expect(file && fread(file, 1, (size_t)flen, fp) == (size_t)flen, "read fixture");
    fclose(fp);
    poff = pdta_off(file, (size_t)flen);
    expect(poff != 0, "pdta list");
    pdta = file + poff;
    plen = (size_t)flen - poff;
    sf2_font_init(&real);
    expect(sf2_load_pdta(&real, pdta, plen) == SF2_OK, "fixture load");
    expect(real.nphdrs == 137, "fixture phdrs");
    expect(real.nshdrs == 125, "fixture shdrs");
    expect(real.shdrs[0].end > real.shdrs[0].start, "fixture sample span");
    expect(memcmp(real.shdrs[real.nshdrs - 1].name, "EOS", 3) == 0, "fixture eos");
    z = sf2_font_zones(&real, 0, 0);
    expect(z != NULL && zone_count(z) > 0, "bank 0 program 0 zones");
    expect(sf2_font_zones(&real, 127, 0) != NULL, "program 127");
    for (p = 0; p < real.npresets; p++) {
      zone_t *pz = real.presets[p].zones;
      int c = zone_count(pz);
      int zi;
      expect(c >= 0 && pz[c].SampleId == -1, "every preset is terminated");
      for (zi = 0; zi < c; zi++) {
        if (pz[zi].SampleId < 0 || pz[zi].SampleId >= real.nshdrs - 1)
          expect(0, "sample id inside shdr");
        if (pz[zi].Pan < SF2_MIN_PAN || pz[zi].Pan > SF2_MAX_PAN)
          expect(0, "pan spec range");
        if (pz[zi].CoarseTune < SF2_MIN_COARSE_TUNE ||
            pz[zi].CoarseTune > SF2_MAX_COARSE_TUNE)
          expect(0, "coarse spec range");
        if (range_lo(pz[zi].KeyRange) > range_hi(pz[zi].KeyRange) && c > 0) {
          /* empty intersection is allowed; just don't walk off the list */
        }
      }
      if (g_fails > 20)
        break;
    }
    if (z) {
      unsigned lo = range_lo(z[0].KeyRange);
      unsigned hi = range_hi(z[0].KeyRange);
      unsigned key = lo <= hi ? lo : 60;
      zone_t *hit = filterForZone(z, (uint8_t)key, 64);
      expect(hit >= z && hit < z + zone_count(z), "fixture filter stays in preset");
    }
    sf2_font_clear(&real);
    free(file);
  }

  free(merge.data);
  free(last.data);
  sf2_font_clear(&font);

  if (g_fails) {
    fprintf(stderr, "%d failure(s)\n", g_fails);
    return 1;
  }
  printf("pdta.spec ok\n");
  return 0;
}
