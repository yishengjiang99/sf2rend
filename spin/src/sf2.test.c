#include "runtime.c"
#include "sf2.c"

#include <assert.h>

int main(int argc, char const *argv[])
{
	readsf(fopen("GeneralUserGS.sf2", "rb"));
	init_ctx();
	setProgram(0, 9);
	printf("\n%d,%d,%d", nshdrs, nsamples, nphdrs);
	for (int i = 0; i < nshdrs; i++)
	{
		shdrcast *sample = (shdrcast *)(shdrs + i);
		printf("\n %s %d %d  %d %d", sample->name, sample->start, sample->end, sample->startloop, sample->endloop);
	}
	short att[60] = defattrs;
	for (int i = 0; i < nigens; i++)
	{
		if (igens[i].genid == VelRange)
		{
			att[VelRange] = igens[i].val.shAmount;
		}
		if (igens[i].genid == KeyRange)
		{
			att[KeyRange] = igens[i].val.shAmount;
		}
		zone_t *z = (zone_t *)att;
		printf("\n%d-%d\n%d-%d", z->VelRange.lo, z->VelRange.hi, z->KeyRange.lo, z->KeyRange.hi);
	}
	noteOn(0, 55, 99, 0);
}
