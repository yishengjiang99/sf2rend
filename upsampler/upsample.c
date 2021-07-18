#define wavetable_size 4096
typedef struct _iterate {
  float *sample;
  int sampleLength;
  int output_sample_block, pos;
  float ratio, frac;
  float *output;
} sampler_iterator;
extern float powf(float base, float exp); 


static sampler_iterator iterators[1];
static float output[wavetable_size];

sampler_iterator* init(float* outputptr,float*sample, int len) {
  iterators->output_sample_block = wavetable_size;
  iterators->sample = sample;
  iterators->output = outputptr;
  iterators->sampleLength=len;
  return &iterators[0];
}
float setRatio(sampler_iterator* iterators, float sampleRate, float inputFreq){
  iterators->ratio =  (float)iterators->output_sample_block   / (float)sampleRate;
                     return  iterators->ratio;
}
float hermite4(float frac_pos, float xm1, float x0, float x1, float x2) {
  const float c = (x1 - xm1) * 0.5f;
  const float v = x0 - x1;
  const float w = c + v;
  const float a = w + v + (x2 - x0) * 0.5f;
  const float b_neg = w + a;
  return ((((a * frac_pos) - b_neg) * frac_pos + c) * frac_pos + x0);
}

int upsample_wave_table(sampler_iterator *v) {
  v->frac = 0.0f;
  v->pos = 0;
  for (int i =0; v->pos<v->sampleLength-2 && i< v->output_sample_block; i++) {
    float fm1 = *(v->sample + v->pos - 1);
    float f1 = *(v->sample + v->pos);
    float f2 = *(v->sample + v->pos + 1);
    float f3 = *(v->sample + v->pos + 2);
    v->output[i] = hermite4(v->frac, fm1, f1, f2, f3);
    v->frac += v->ratio;
    if (v->frac >= 1.0f) {
      v->frac--;
      v->pos++;
    }

  }
  if(v->pos <v->sampleLength-3){
    return 0;
  }else return 1;
}
