#include "pdta.c"
#include <assert.h>
#include <stdio.h>
void emitHeader(int pid, int bid, void *p)
{
    phdr *pset = (phdr *)p;
    printf("\n\nheader %s %d %d", pset->name,pid,bid);
}
void emitZone(int pid, void *ref)
{
    zone_t *zone = (zone_t *)ref;
    shdrcast *shdr = (shdrcast *)(shdrs + zone->SampleId);

}
void emitSample(int id, int pid, void* name)
{    
 printf("\n\tsample id: %d pid %d, %s",id, pid,name);
}
void emitFilter(int type, uint8_t lo, uint8_t hi) {}

int main()
{
    printf("hello\n");
    char *filename = "file.sf2";

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
    loadpdta(pdtabuffer);
    zone_t*z = presets[0];
    printf("%hd aaa", z->Attenuation);
    return 1;
}