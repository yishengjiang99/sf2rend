typedef unsigned int uint32_t;

#define RENDQ 128
#define nchannels 16
#define n_ch_voices 4

extern void* malloc(unsigned int len);

float outputs[RENDQ * nchannels * 2];
float silence[440];

typedef struct {
  float *input1, *input2, *output;
  int channelId, key, velocity;
  uint32_t phase;
  int phase_inc;
  float fade, fadeInd;

  uint32_t channelId, key, velocity;
  uint32_t position, loopStart, loopEnd;
  float fract, stride, pitch_dff_log;
  zone_t* zone;
  EG *voleg, *modeg;
  LFO *modlfo, *vibrlfo;
  pcm_t* pcm;
  uint32_t sampleLength;
} spinner;

spinner* newSpinner(int chid) {
  spinner* x = (spinner*)malloc(sizeof(spinner*));
  x->channelId = chid;
  x->outputf = &outputs[chid * RENDQ * 2];
  x->fract = 0.0f;
  x->position = 0;
  x->inputf1 = silence;
  x->inputf2 return x;
}