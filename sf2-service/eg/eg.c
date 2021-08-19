#define sampleRate 48000
#define log_2_10 3.321928094887362
#include <math.h>
float powf(float b, float exp);
float db, dbinc;
double db1 = -960.0f;

float input[128];
void setAtt(int atttime) {
  db = -960;
  dbinc = 960 * powf(2, -1 * atttime / 1200.f) / 48000;
}

int FloatTo23Bits(float x) {
  float y = x + 1.f;
  return (*(unsigned long*)&y) & 0x7FFFFF;  // last 23 bits
}
#include <stdio.h>

void proc(float* input, int n) {
  while (n--) {
    if (db1 < 0 && dbinc > 0) {
      double nff = log_2_10 * db1 / 200.0f;
      unsigned long matissa = FloatTo23Bits(.4f);
      while (nff < -1.0) {
        matissa = matissa >> 2;
        nff++;
      }
      db1 += dbinc;
      input++;
    }
  }
}
int main() {
  setAtt(-5555);
  printf("%f", dbinc);
  proc(input, 128);
}