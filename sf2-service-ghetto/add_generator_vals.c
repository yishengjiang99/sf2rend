#include "sf2.h"
#include <stdio.h>
#define clamp(val, min, max) val > max ? max : val < min ? min : val
static inline float fclamp(float val, float min, float max){
  return val > max ? max : val < min ? min : val;
}
static inline int add_pbag_val_to_zone(int genop, short *zoneAttr, short psetAttr){
  switch (genop)
  { 
      case StartAddrOfs:
      case EndAddrOfs:
      case StartLoopAddrOfs:
      case EndLoopAddrOfs:
        zoneAttr[genop]+= (unsigned int)psetAttr;
        break;
      case StartAddrCoarseOfs:
      case EndAddrCoarseOfs:
      case StartLoopAddrCoarseOfs:
      case EndLoopAddrCoarseOfs:
        // do not add
        break;
      case ModLFODelay:
      case VibLFODelay:
      case ModEnvDelay:
      case VolEnvDelay:
      case VolEnvHold:
      case ModEnvHold:
        zoneAttr[genop]= clamp(zoneAttr[genop]+psetAttr, -12000, 5000);
        break;
      case ModEnvAttack:
      case ModEnvDecay:
      case ModEnvRelease:
      case VolEnvAttack:
      case VolEnvDecay:
      case VolEnvRelease:
         zoneAttr[genop]= clamp(zoneAttr[genop]+psetAttr, -12000, 8000);
          break;
      case Key2ModEnvHold:
      case Key2ModEnvDecay:
      case Key2VolEnvHold:
      case Key2VolEnvDecay:
        zoneAttr[genop]= (short)clamp(zoneAttr[genop]+psetAttr, -12000, 1200);
        break;
      case Pan:
        zoneAttr[genop]=(short)fclamp((float)zoneAttr[genop]+(float)psetAttr*0.001f, -.5f, .5f);
        break;
      case Attenuation:
        zoneAttr[genop]= (short)fclamp((float)zoneAttr[genop]+(float)psetAttr*0.1f, 0.0f, 144.0f);
        break;  
      case ModEnvSustain:
        zoneAttr[genop]= (short)clamp(zoneAttr[genop]+psetAttr, 0, 1000);
        break;
      case VolEnvSustain:
                zoneAttr[genop]= (short)fclamp((float)zoneAttr[genop]+(float)psetAttr, 0, 1400.0f);
        break;
        case ModLFO2Pitch:
        case VibLFO2Pitch:
        case ModLFO2FilterFc:
        case ModEnv2FilterFc:
        case ModLFO2Vol:
          zoneAttr[genop] = (short)clamp(zoneAttr[genop]+psetAttr,-12000,12000);
          break;
        case FilterFc:
          zoneAttr[genop] = (short)clamp(zoneAttr[genop]+psetAttr,1500,13500);
          break;
        case FilterQ:
          zoneAttr[genop] = (short)clamp(zoneAttr[genop]+psetAttr,0,960);
          break;
        case VibLFOFreq:
        case ModLFOFreq:
                  zoneAttr[genop] = (short)clamp(zoneAttr[genop]+psetAttr,-16000,4500);
                  break;
      default:
        break;
   }
   return 1;
}
static inline int combine_pattrs(int genop, short *zoneAttr, short psetAttr){
  float pval, zval;
  int irange[2], prange[2];
  switch (genop)
  {
  case VelRange:
  case KeyRange:
    irange[0] = zoneAttr[genop] & 0x007f;
    irange[1] = zoneAttr[genop] >> 8;
    prange[0] = psetAttr & 0x007f;
    prange[1] = psetAttr >> 8;
    if (irange[1] > prange[1])
      irange[1] = prange[1];
    if (irange[0] < prange[0])
      irange[0] = prange[0];
    zoneAttr[genop] = irange[0] | (irange[1] << 8);
    return 1;
  case StartAddrOfs:
  case EndAddrOfs:
  case StartLoopAddrOfs:
  case EndLoopAddrOfs:
    zoneAttr[genop]+= (unsigned int)psetAttr;
    break;
  case StartAddrCoarseOfs:
  case EndAddrCoarseOfs:
  case StartLoopAddrCoarseOfs:
  case EndLoopAddrCoarseOfs:
      zoneAttr[genop]+=(unsigned int)psetAttr<<15;
    break;
  case ExclusiveClass:
    zoneAttr[genop]=(unsigned int)psetAttr;
  default:
    zoneAttr[genop]=psetAttr;
    break;
  }
  return 1;
}

