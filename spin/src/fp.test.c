#include <stdio.h>

#if !defined(fp12)
#define fp12
const int scale = 12;
const int mask_fract = 0xfffffff >> (32 - scale);
const int mask_floor = -1 ^ mask_fract;
#define double_to_fp(x) x *(double)(1 << scale);
#define fp_to_double(x) ((double)x / (double)(1 << scale))
#define int_to_fp(x) (x << scale)
#define fp_to_int(x) (x >> scale)
#define fp_fract(x) (x & mask_fract)
#define fp_floor(x) ((fp_to_int(x)) & mask_floor)

#endif // fp12
int main()
{
  int att = -9000;
  int nsmpl = 444;
  int position = double_to_fp(1.0);
  int inc = double_to_fp(1.1);
  while (nsmpl--)
  {
    position += inc;
    printf("%f \t %d\n", fp_to_double(position), fp_fract(position));
  }
  return 0;
}