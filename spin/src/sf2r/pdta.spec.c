
#include <assert.h>
#include <stdio.h>

#include "ffmpeg_test_tool.c"
#include "sf2.c"
void ffp(shdrcast *sh);
#define WAVETABLE_SIZE 4096
float hermite4(float frac_pos, float xm1, float x0, float x1, float x2) {
  const float c = (x1 - xm1) * 0.5f;
  const float v = x0 - x1;
  const float w = c + v;
  const float a = w + v + (x2 - x0) * 0.5f;
  const float b_neg = w + a;

  return ((((a * frac_pos) - b_neg) * frac_pos + c) * frac_pos + x0);
}
float sdta4lerp(float *sdta, int p, float frac) {
  float fm1 = *(sdta + p - 1);
  float f1 = *(sdta + p);
  float f2 = *(sdta + p + 1);
  float f3 = *(sdta + p + 2);
  return hermite4(frac, fm1, f1, f2, f3);
}

int main() {
  char *filename = "assets/file.sf2";

  FILE *fd = fopen(filename, "r");
  readsf(fd);
  read_sdta(fd);
  zone_t *z = filterForZone(presets[0], 65, 44);
  zone_t *z2 = filterForZone(z, 65, 44);
  shdrcast *sh = (shdrcast *)&shdrs[z2->SampleId];

  printf("%hd", z->Attenuation);
  printf("%20s\n ", sh->name);

  float ratio = (float)sh->sampleRate /
                (powf(2, (sample_cent(z, sh) - 6900) / 1200) * 440.0f) /
                WAVETABLE_SIZE;

  int p = sh->start;
  float fr = 0.0f;
  for (int i = 0; i < WAVETABLE_SIZE; i++) {
    float f = sdta4lerp(sdta, p, fr);
    fr += ratio;
    if (fr > 1.0) {
      fr -= 1.0;
      p++;
    }
  }

  return 0;
}

void ffp(shdrcast *sh) {
  outfile = popen("ffplay  -loglevel debug -i pipe:0 -f wav", "w");
  put_wav_header(sh->sampleRate, 1, sh->end - sh->start + 1);
  float i2;
  float r = powf(2, .5);
  int i = sh->start;
  i2 = (float)sh->start;
  for (; i <= sh->end; i++) {
    if (i2 >= sh->endloop) {
      i2 = sh->startloop;
    }
    i2 += r;
    put16(data[i]);
  }
  pclose(outfile);
}