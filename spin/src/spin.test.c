
#include "spin.h"

#include <assert.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>

#include "sf2.c"

#define printvoleg(x)                                               \
  {                                                                 \
    printf("=>increment %f, egval:%f\t nsteps: %d\t stag: %d %d\n", \
           x->voleg.egIncrement, x->voleg.egval, x->voleg.nsteps,   \
           x->voleg.stage, x->position);                            \
  }

int main() {
  FILE *f = fopen("assets/file.sf2", "rb");
  char c;
  while ((c = fgetc(f)) != EOF) {
    putchar(c);
  }

  FILE *fd = fopen(filename, "r");
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
  fseek(fd, h2->size, SEEK_CUR);
  fread(h2, sizeof(header2_t), 1, fd);
  printf("\n%.4s %u", h2->name, h2->size);
  char *pdtabuffer = malloc(h2->size);
  fread(pdtabuffer, h2->size, h2->size, fd);
  readpdta(pdtabuffer);
  int i = 0, j = 0;
  phdr *p = phdrs;
  pbag *pb = pbags;
  pgen *pg = pgens;
  printf("\n%s", p->name);

  for (; i < npgens; i++, pg++) {
    if (i >= (pb + 1)->pgen_id) {
      pb++;
      printf("\n");
      j++;
    }

    if (j > (p + 1)->pbagNdx) {
      p++;
      printf("\n%s", p->name);
    }
    printf("\n\t- %s %hd", generator[pg->genid], pg->val);
  }
  return 1;
}
