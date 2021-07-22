#include <stdio.h>
#include <stdlib.h>

#include "sf2.h"
void loadpdta(void *b);
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

int main() {
  printf("5d %lu", sizeof(shdr));
  FILE *fd = fopen("GeneralUserGS.sf2", "rb");
  header2_t *rrff = (header2_t *)malloc(sizeof(rrff));
  fseek(fd, 8, SEEK_CUR);
  fread(rrff, sizeof(header2_t), 1, fd);

  //  header2_t *rrff = (header2_t *)malloc(sizeof(header2_t));
  fread(rrff, sizeof(rrff), 1, fd);

  info = (char *)malloc(rrff->size);
  fread(info, sizeof(rrff->size), 1, fd);
  // for (int i = 0; i < rrff->size; i++)
  //   (*info)++ = (fgetc(fd) & 0x7f);  // reall don't feel like parsing this so
  //                                    // just asci-masking the readable str.

  fread(rrff, sizeof(header2_t), 1, fd);
  nsamples = rrff->size / sizeof(short);
  sdtastart = ftell(fd);

  fseek(fd, rrff->size + 4, SEEK_CUR);
  fread(rrff, sizeof(header2_t), 1, fd);
  printf("%lu", ftell(fd));
  char b[rrff->size];
  fread(b, 1, rrff->size, fd);
  loadpdta(b);
}
#define read(section)                         \
  sh = (section_header *)pdtabuffer;          \
  pdtabuffer += 8;                            \
  n##section##s = sh->size / sizeof(section); \
  section##s = (section *)pdtabuffer;         \
  pdtabuffer += sh->size;

void loadpdta(void *pdtabuffer) {
  section_header *sh;

  read(phdr);
  read(pbag);
  read(pmod);
  read(pgen);
  read(inst);
  read(ibag);
  read(imod);
  read(igen);
  // read(shdr);
  sh = (section_header *)pdtabuffer;
  pdtabuffer += 8;
  printf("%u", sh->size);
}
