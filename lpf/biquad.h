#ifndef biquad_h
#define biquad_h
#ifndef M_LN2
#define M_LN2 0.69314718055994530942
#endif

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

/* whatever sample type you want */

/* this holds the data required to update samples thru a filter */
typedef struct {
  float a0, a1, a2, a3, a4;
  float x1, x2, y1, y2;
} biquad;

extern float BiQuad(const float sample);
extern biquad *BiQuad_new(const int type, float dbGain, /* gain of filter */
                          const float freq,             /* center frequency */
                          const float srate,            /* sampling rate */
                          const float bandwidth); /* bandwidth in octaves */

/* filter types */
enum FILT_TYPE {
  LPF,   /* low pass filter */
  HPF,   /* High pass filter */
  BPF,   /* band pass filter */
  NOTCH, /* Notch Filter */
  PEQ,   /* Peaking band EQ filter */
  LSH,   /* Low shelf filter */
  HSH    /* High shelf filter */
};

#endif  // biquad_h
