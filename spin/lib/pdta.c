#include <math.h>
#include <stdlib.h>
#include <string.h>

#ifndef skipthis
extern void emitHeader(int pid, int bid, void *p);
extern void emitZone(int pid, void *ref);
extern void emitSample(int id, int pid, void *p);
extern void emitFilter(int type, uint8_t lo, uint8_t hi);
#endif

#include <stdio.h>

#define clamp(val, min, max) val > max ? max : val < min ? min \
                                                         : val
static inline float fclamp(float val, float min, float max)
{
    return val > max ? max : val < min ? min
                                       : val;
}
static inline short add_pbag_val_to_zone(int genop, short ival, short pval)
{
    int irange[2], prange[2];
    switch (genop)
    {
    case StartAddrOfs:
    case EndAddrOfs:
    case StartLoopAddrOfs:
    case EndLoopAddrOfs:
    case StartAddrCoarseOfs:
    case EndAddrCoarseOfs:
    case StartLoopAddrCoarseOfs:
    case EndLoopAddrCoarseOfs:
        return ival;
    case ModLFODelay:
    case VibLFODelay:
    case ModEnvDelay:
    case VolEnvDelay:
    case VolEnvHold:
    case ModEnvHold:
        return clamp(ival + pval, -12000, 5000);
    case ModEnvAttack:
    case ModEnvDecay:
    case ModEnvRelease:
    case VolEnvAttack:
    case VolEnvDecay:
    case VolEnvRelease:
        return clamp(ival + pval, -12000, 8000);
    case Key2ModEnvHold:
    case Key2ModEnvDecay:
    case Key2VolEnvHold:
    case Key2VolEnvDecay:
        return (short)clamp(ival + pval, -12000, 1200);
    case Pan:
        return (short)fclamp((float)ival + (float)pval * 0.001f, -.5f, .5f);
    case Attenuation:
        return (short)fclamp((float)ival + (float)pval, 0.0f, 1440.0f);
    case ModEnvSustain:
        return (short)clamp(ival + pval, 0, 1000);
    case VolEnvSustain:
        return (short)fclamp((float)ival + (float)pval, 0, 1400.0f);
    case ModLFO2Pitch:
    case VibLFO2Pitch:
    case ModLFO2FilterFc:
    case ModEnv2FilterFc:
    case ModLFO2Vol:
    case ModEnv2Pitch:
        return (short)clamp(ival + pval, -12000, 12000);
    case FilterFc:
        return (short)clamp(ival + pval, 1500, 13500);
    case FilterQ:
        return (short)clamp(ival + pval, 0, 960);
    case VibLFOFreq:
    case ModLFOFreq:
        return (short)clamp(ival + pval, -16000, 4500);
    case Instrument:
        return pval;
    case KeyRange:
    case VelRange:
        irange[0] = ival & 0x007f;
        irange[1] = ival >> 8;
        prange[0] = pval & 0x007f;
        prange[1] = pval >> 8;
        if (irange[1] > prange[1])
            irange[1] = prange[1];
        if (irange[0] < prange[0])
            irange[0] = prange[0];
        ival = (short)(irange[0] + (irange[1] << 8));
        return ival;
    case CoarseTune:
        printf("\n\t coarse %hd %hd", ival, pval);

        return 0;
    case SampleModes:
        printf("\nsfmod %hd %hd", ival, pval);
        return ival;
    default:
        return ival;
    }
}
phdr *findPreset(int pid, int bank_id);
zone_t *findPresetZones(phdr *phr, int n);
int findPresetZonesCount(phdr *phr);

// phdr *presetHeaders[128];
// phdr *phdrRoot = 0;
// phdr drumHeaders[128];
// zone_t *presetZones;
// zone_t *root;
// zone_t *presets[0xff];

void *readpdta(void *pdtabuffer)
{

#define srr(section)                            \
    sh = (section_header *)pdtabuffer;          \
    pdtabuffer += 8;                            \
    n##section##s = sh->size / sizeof(section); \
    section##s = (section *)pdtabuffer;         \
    pdtabuffer += sh->size;
    section_header *sh;

    srr(phdr);
    srr(pbag);
    srr(pmod);
    srr(pgen);
    srr(inst);
    srr(ibag);
    srr(imod);
    srr(igen);
    srr(shdr);
    return malloc(4);
}
void *loadpdta(void *pdtabuffer)
{
    readpdta(pdtabuffer);
    for (uint16_t i = 0; i < 128; i++)
    {
        phdr *phr = findPreset(i, 0x00);

        // printf("[%u %u] %s \n", phr->pid, phr->bankId,phr->name);
        if (phr)
        {
            int n = findPresetZonesCount(phr);
            // printf("\t num %d\n",n);
            presets[(uint32_t)i] = findPresetZones(phr, n);
            emitHeader(phr->pid, phr->bankId, phr->name);
        }
        phr = findPreset(i, 128);

        // printf("[%u %u] %s \n", phr->pid, phr->bankId,phr->name);
        if (phr)
        {
            int n = findPresetZonesCount(phr);
            presets[(uint32_t)i + 128] = findPresetZones(phr, n);
            emitHeader(phr->pid, phr->bankId, phr->name);
        }
    }
    // get mem end;
    return malloc(4);
}

phdr *findPreset(int pid, int bank_id)
{
    for (int i = 0; i < nphdrs; i++)
    {
        if (phdrs[i].pid == pid && phdrs[i].bankId == bank_id)
        {
            return &phdrs[i];
        }
    }
    return (void *)0;
}

#define filter_zone(g, ig)                      \
    if (g->val.ranges.lo > ig->val.ranges.hi || \
        g->val.ranges.hi < ig->val.ranges.lo || \
        ig->val.ranges.lo == ig->val.ranges.hi) \
        continue;

int findPresetZonesCount(phdr *phr)
{
    int nregions = 0;
    int instID = -1, lastSampId = -1;
    for (int j = phr->pbagNdx; j < (phr + 1)->pbagNdx; j++)
    {
        pbag *pg = pbags + j;
        pgen_t *lastg = pgens + pg[j + 1].pgen_id;
        int pgenId = pg->pgen_id;
        instID = -1;
        int lastPgenId = j < npbags - 1 ? pbags[j + 1].pgen_id : npgens - 1;
        unsigned char plokey = 0, phikey = 127, plovel = 0, phivel = 127;
        for (int k = pgenId; k < lastPgenId; k++)
        {
            pgen *g = pgens + k;
            if (k == VelRange)
            {
                plovel = g->val.ranges.lo;
                phivel = g->val.ranges.hi;
                continue;
            }
            if (k == KeyRange)
            {
                plokey = g->val.ranges.lo;
                phikey = g->val.ranges.hi;
                continue;
            }
            if (plokey == phikey)
                continue;
            if (g->genid == Instrument)
            {
                instID = g->val.uAmount;
                inst *ihead = insts + instID;
                int ibgId = ihead->ibagNdx;
                int lastibg = (ihead + 1)->ibagNdx;
                for (int ibg = ibgId; ibg < lastibg; ibg++)
                {
                    ibag *ibgg = ibags + ibg;
                    pgen_t *lastig = ibg < nibags - 1 ? igens + (ibgg + 1)->igen_id
                                                      : igens + nigens - 1;
                    unsigned char ilokey = 0, ihikey = 127, ilovel = 0, ihivel = 127;

                    for (pgen_t *g = igens + ibgg->igen_id; g->genid != 60 && g != lastig;
                         g++)
                    {
                        if (g->genid == KeyRange)
                        {
                            ilokey = g->val.ranges.lo;
                            ihikey = g->val.ranges.hi;
                            continue;
                        }
                        if (g->genid == VelRange)
                        {
                            ilovel = g->val.ranges.lo;
                            ihivel = g->val.ranges.hi;
                            continue;
                        }
                        if (k == VelRange || k == KeyRange)
                        {
                            if (g->val.ranges.lo == g->val.ranges.hi)
                                break;
                        }
                        if (g->genid == SampleId)
                        {
                            if (g->val.uAmount >= nshdrs)
                                break;
                            nregions++;
                            break;
                        }
                    }
                }
            }
        }
    }
    return nregions;
}

zone_t *findPresetZones(phdr *phr, int nregions)
{
    // generator attributes
    short presetDefault[60] = {0};
    short pbagLegion[60] = {0};
    presetDefault[VelRange] = 127 << 8;
    presetDefault[KeyRange] = 127 << 8;

    zone_t *zones = (zone_t *)malloc((nregions + 1) * sizeof(zone_t));
    int found = 0;
    int instID = -1;
    int lastbag = (phr + 1)->pbagNdx;
    for (int j = phr->pbagNdx; j < (phr + 1)->pbagNdx; j++)
    {
        pbag *pg = pbags + j;
        pgen_t *lastg = pgens + pg[j + 1].pgen_id;
        int pgenId = pg->pgen_id;
        int lastPgenId = j < npbags - 1 ? pbags[j + 1].pgen_id : npgens - 1;
        memcpy(pbagLegion, presetDefault, 120);
        pbagLegion[Instrument] = -1;
        pbagLegion[PBagId] = j;
        for (int k = pgenId; k < lastPgenId; k++)
        {
            pgen *g = pgens + k;
            pbagLegion[g->genid] = g->val.shAmount;
            if (g->genid == Instrument)
            {
                inst *instptr = insts + pbagLegion[Instrument];
                int ibgId = instptr->ibagNdx;
                int lastibg = (instptr + 1)->ibagNdx;
                short instDefault[60] = defattrs;
                short instZone[60] = {0};
                for (int ibg = ibgId; ibg < lastibg; ibg++)
                {
                    memcpy(instZone, instDefault, 120);
                    ibag *ibgg = ibags + ibg;
                    pgen_t *lastig = igens + (ibgg + 1)->igen_id;
                    for (pgen_t *ig = igens + ibgg->igen_id; ig != lastig; ig++)
                    {
                        instZone[ig->genid] = ig->val.shAmount;
                    }
                    if (instZone[SampleId] == -1)
                    {
                        memcpy(instDefault, instZone, 120);
                    }
                    else
                    {
                        for (int i = 0; i < 60; i++)
                        {
                            instZone[i] = add_pbag_val_to_zone(i, instZone[i], pbagLegion[i]);
                        }
                        instZone[IBAGID] = ibg;
                        instZone[PBagId] = j;
                        memcpy(zones + found, instZone, 120);
                        emitZone(phr->pid, zones + found);
                        found++;
                    }
                }
            }
        }
        if (pbagLegion[Instrument] == -1)
        {
            memcpy(presetDefault, pbagLegion, 120);
        }
    }
    zone_t *dummy = zones + found;
    dummy->SampleId = -1;
    return zones;
}

zone_t *filterForZone(zone_t *from, uint8_t key, uint8_t vel)
{
    for (zone_t *z = from; z; z++)
    {
        if (z == 0 || z->SampleId == (short)-1)
            break;
        if (vel > 0 && (z->VelRange.lo > vel || z->VelRange.hi < vel))
            continue;
        if (key > 0 && (z->KeyRange.lo > key || z->KeyRange.hi < key))
            continue;
        return z;
    }
    if (vel > 0)
        return filterForZone(from, key, 0);
    if (key > 0)
        return filterForZone(from, 0, vel);
    return &presetZones[0];
}

void *shdrref() { return shdrs; }
void *presetRef() { return presets; }
void *instRef(int instId) { return insts + instId; }