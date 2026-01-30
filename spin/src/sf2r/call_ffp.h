#include <stdio.h>

FILE *ffp(int ac, int ar) {
  char cmd[1024];

  sprintf(cmd, "ffplay -loglevel debug -i pipe:0 -f f32le -ac %d -ar %d", ac,
          ar);
  FILE *ffplay = popen(cmd, "w");

  if (!ffplay) perror("cmd fail");
  return ffplay;
}

FILE *wavepic(char *png_name) {
  char cmd[1024];
  sprintf(cmd,
          "ffmpeg -hide_banner -loglevel panic -y -f f32le -ac 2 -ar 48000 -i "
          "pipe:0 -filter_complex 'showwavespic=s=640x120' -frames:v 1 %s",
          png_name);  // ac, ar);
  FILE *ffwavepic = popen(cmd, "w");
  if (!ffwavepic) perror("cmd fail");
  return ffwavepic;
}

FILE *formatpcm(char *format, char *filename) {
  char cmd[1024];
  sprintf(cmd, "ffmpeg -y -f f32le -i pipe:0 -ac 2 -ar 48000 -f %s %s", format,
          filename);  // png_name); // ac, ar);
  FILE *pipel = popen(cmd, "w");
  if (!pipel) perror("cmd fail");
  return pipel;
}
// popen("ffmpeg -y -f f32le -i pipe:0 -ac 2 -ar 48000 -f WAV o.wav", "w")
