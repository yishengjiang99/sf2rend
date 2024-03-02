#include <stdio.h>
#include <stdlib.h>

#include "pdta.c"
#include "pdta_extern_adapt.c"

void readsf(FILE *fd) {
  sheader_t *header = (sheader_t *)malloc(sizeof(sheader_t));
  header2_t *h2 = (header2_t *)malloc(sizeof(header2_t));
  fread(header, sizeof(sheader_t), 1, fd);
  printf("%.4s %.4s %.4s %u", header->name, header->sfbk, header->list,
         header->size);
  fread(h2, sizeof(header2_t), 1, fd);
  printf("\n%.4s %u", h2->name, h2->size);
  fseek(fd, h2->size, SEEK_CUR);
  fread(h2, sizeof(header2_t), 1, fd);
  printf("\n%.4s %u", h2->name, h2->size);
  nsamples = h2->size / sizeof(short);
  sdtastart = ftell(fd);

  fseek(fd, h2->size, SEEK_CUR);
  //  fseek(fd, h2->size, SEEK_CUR);
  // printf("\n%.4s %u", h2->name, h2->size);

  fread(h2, sizeof(header2_t), 1, fd);
  printf("\n%.4s %u", h2->name, h2->size);
  char *pdtabuffer = malloc(h2->size);
  fread(pdtabuffer, h2->size, h2->size, fd);

  loadpdta(pdtabuffer);
}
void read_sdta(FILE *fd) {
  if (sdtastart) {
    fseek(fd, sdtastart, SEEK_SET);
    data = (short *)malloc(nsamples * sizeof(short));
    sdta = (float *)malloc(nsamples * sizeof(float));
    float *trace = sdta;
    5 fread(data, sizeof(short), nsamples, fd);
    for (int i = 0; i < nsamples; i++) {
      *trace++ = *(data + i) / 32767.0f;
    }
  }
}
float sample_cent(zone_t *z, shdrcast *sh) {
  short rt = z->OverrideRootKey > -1 ? z->OverrideRootKey : sh->originalPitch;
  return rt * 100.0f + z->CoarseTune * 100.0f + (float)z->FineTune;
}