#include "sf2.h"
float calcratio(zone_t *z, shdrcast *sh, int midi) {
  short rt = z->OverrideRootKey > -1 ? z->OverrideRootKey : sh->originalPitch;
  return rt * 100.0f + z->CoarseTune * 100.0f + (float)z->FineTune;
}
