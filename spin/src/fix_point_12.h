#if !defined(fp12)
#define fp12
const int scale = 12;
const int fraction_mask = (1 << scale) - 1;
const int whole_mask = -1 ^ fraction_mask;
const double scalar_multiple = (double)(1 << scale);
#define double2fixed(x) (x * scalar_multiple)
#define fixed2double(x) (x / scalar_multiple)
#define int2fixed(x) (x << scale)
#define fixed2int(x) (x >> scale)
#define get_fraction(x) fixed2double((x & fraction_mask))
#define floor(x) fixed2int((x & whole_mask))

#endif  // fp12
