#include <stdio.h>
#include <stdlib.h>

#include "../lib/tsf.h"

int main() {
  tsf* s = tsf_load_filename("file.sf2");
  struct tsf_region rr = s->presets->regions[0];
  for (int i = 0; i < s->presets[0].regionNum; i++) {
    //  printf("\n%f", s->presets[0].regions[i].ampenv.decay);
  }
  float ff[128];
  tsf_set_output(s, TSF_MONO, 44100, 0);  // sample rate
  tsf_note_on(s, 0, 60, .5f);             // preset 0, middle C
  tsf_render_float(s, ff, 128, 0);
  struct tsf_voice v = s->voices[0];
  for (int i = 0; i < s->voiceNum; i++) {
    printf("%d %f - \n", s->voices[i].ampenv.segment,
           (float)s->voices[0].ampenv.samplesUntilNextSegment / 44100.f);
  }
  return 1;
}

// FilterQ
//        ModLFOFreq(16): -856 14143