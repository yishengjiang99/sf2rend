static double errsum = 0;
const int n = 5;
const int N = 1 << n;
static double* barset1;

static double* barset2;
static double errorWeighting[N / 2];
static double lerp_tolerance;

int nframes;
void reset() {
  nframes = 0;
  barset1 = 0;
  barset2 = 0;
  for (int i = 0; i < N / 2; i++) {
    errorWeighting[i] = 0;
  }
  for (int i = 10; i < 255; i++) {
    errorWeighting[i] = 1;
  }
  lerp_tolerance = 255 / 2 * 10;
}
double inputbars(double* bars) {
  double errsum = 0;

  if (!barset1)
    barset1 = bars;
  else if (!barset2) {
    barset2 = bars;
    nframes = 1;
  } else {
    for (int i = 0; i < N / 2; i++) {
      double projection = (barset2[i] - barset1[i]) / nframes * (nframes + 1);
      double err = bars[i] - projection;
      errsum += err;
    }
    if (errsum < lerp_tolerance) {
      barset2 = bars;
      nframes++;
    } else {
      barset1 = barset2;
      barset2 = bars;
      nframes = 1;
    }
  }
  return errsum;
}

// #include <stdio.h>
// #include <stdlib.h>
// #include <string.h>

// int main() {
//   for (int i = 0; i < N / 2; i++) {
//     errorWeighting[i] = 1;
//   }
//   lerp_tolerance = 10;

//   double test[32];
//   double x = 0;
//   for (int i = 0; i < 12; i++) {
//     double arr[32];
//     arr[0] = x += .1;
//     memcpy(arr, test, 32 * sizeof(double));
//     printf("\nerrsum %f %d	", inputbars(arr), nframes);
//   }
// }