#include <stdio.h>

#include "sf2.h"
#define clamp(val, min, max) val > max ? max : val < min ? min : val
static inline float fclamp(float val, float min, float max) {
  return val > max ? max : val < min ? min : val;
}
static inline short add_pbag_val_to_zone(int genop, short ival, short pval) {
  int irange[2], prange[2];
  switch (genop) {
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
      if (irange[1] > prange[1]) irange[1] = prange[1];
      if (irange[0] < prange[0]) irange[0] = prange[0];
      ival = (short)(irange[0] + (irange[1] << 8));
      return ival;
    case CoarseTune:
      return 0;
    case SampleModes:
      // printf("sfmod %hd %hd", ival, ival);
      return ival;
    default:
      return ival;
  }
}