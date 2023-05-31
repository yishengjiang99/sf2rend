

#include "spin.h"

#define MAX_VOICE_CNT 256

// ghetto malloc all variables
int sp_idx = 0;
spinner sps[MAX_VOICE_CNT];

pcm_t pcms[4096];
extern void consolef(float ff);
unsigned char midi_cc_vals[nmidiChannels * 128] = {0};
float outputs[MAX_VOICE_CNT * RENDQ * 2];

float silence[440] = {.0f};
float calc_pitch_diff_log(zone_t* z, pcm_t* pcm, unsigned char key);
int output_arr_len = MAX_VOICE_CNT * RENDQ * 2;
float volEgOut[RENDQ];
float modEgOut[RENDQ];
float lfo1Out[RENDQ];
float lfo2Out[RENDQ];
#define effect_floor(v) v <= -12000 ? 0 : calcp2over1200(v)

void sp_wipe_output_tab() {
  for (int i = 0; i < output_arr_len; i++) {
    outputs[i] = 0.0f;
  }
}
spinner* spRef(int idx) { return &sps[idx]; }
pcm_t* pcmRef(int sampleId) { return &pcms[sampleId]; }
spinner* allocate_sp() {
  spinner* x = &sps[sp_idx % MAX_VOICE_CNT];
  x->outputf = &outputs[sp_idx * RENDQ * 2];
  sp_idx++;
  return x;
}

spinner* newSpinner(int ch) {
  spinner* x = allocate_sp();
  x->outputf = &outputs[ch * RENDQ * 2];
  x->inputf = silence;
  x->channelId = ch;
  return x;
}
void trigger_release(spinner* x) {
  _eg_release(&x->voleg);
  _eg_release(&x->modeg);
  if (x->zone->SampleModes > 0) {
    x->is_looping = 0;
  }
}
void reset(spinner* x) {
  x->position = 0;
  x->stride = .0f;
  x->fract = 0.0f;
  x->modeg.stage = inactive;
  x->modeg.egval = -960.0f;
  x->modeg.egIncrement = 0;
  x->voleg.egval = -960.0f;
  x->voleg.stage = inactive;
  x->voleg.egIncrement = 0;
  x->voleg.hasReleased = 0;
  x->modeg.hasReleased = 0;
  x->lpf.z1 = 0;
  x->lpf.z2 = 0;
  x->active_dynamics_flag = 0;
}

void set_midi_cc_val(int channel, int metric, int val) {
  midi_cc_vals[channel * 128 + metric] = (char)(val & 0x7f);
}

float trigger_attack(spinner* x, uint32_t key, uint32_t velocity) {
#define ccval(eff) midi_cc_vals[x->channelId * 128 + eff]

  x->velocity = (unsigned char)velocity;
  x->position = 0;
  x->fract = 0.0f;
  x->voleg.stage = init;
  x->key = (unsigned char)(key & 0x7f);
  EG* eg = &x->voleg;
  float scaleFactor = SAMPLE_RATE / (float)x->pcm->sampleRate;
  zone_t* z = x->zone;
  eg->attack = (ccval(VCA_ATTACK_TIME) > 0)
                   ? midi_p1200[ccval(VCA_ATTACK_TIME) | 0]
                   : z->VolEnvAttack * scaleFactor;
  eg->decay = (ccval(VCA_DECAY_TIME) > 0)
                  ? midi_p1200[ccval(VCA_DECAY_TIME) | 0]
                  : z->VolEnvDecay * scaleFactor;
  eg->release = (ccval(VCA_RELEASE_TIME) > 0)
                    ? midi_p1200[ccval(VCA_RELEASE_TIME) | 0]
                    : z->VolEnvRelease * scaleFactor;
  eg->sustain = (ccval(VCA_SUSTAIN_LEVEL) > 0)
                    ? (short)(ccval(VCA_SUSTAIN_LEVEL) / 128.f * 1000.f)
                    : z->VolEnvRelease * scaleFactor;

  eg->delay = z->VolEnvDelay * scaleFactor;
  eg->hold = z->VolEnvHold * scaleFactor;
  eg->stage = init;
  eg->nsteps = 0;

  eg = &x->modeg;
  eg->stage = init;
  if (ccval(TML_BANK_SELECT_MSB) > 0) {
    x->is_looping = 0;
  }

  eg->delay = z->ModEnvDecay * scaleFactor;
  eg->hold = z->ModEnvHold * scaleFactor;
  eg->attack = (ccval(VCF_ATTACK_TIME) > 0)
                   ? midi_p1200[ccval(VCF_ATTACK_TIME) | 0]
                   : z->ModEnvAttack * scaleFactor;
  eg->decay = (ccval(VCF_DECAY_TIME) > 0)
                  ? midi_p1200[ccval(VCF_DECAY_TIME) | 0]
                  : z->ModEnvDecay * scaleFactor;
  eg->release = (ccval(VCF_RELEASE_TIME) > 0)
                    ? midi_p1200[ccval(VCF_RELEASE_TIME) | 0]
                    : z->ModEnvRelease * scaleFactor;
  eg->sustain = (ccval(VCF_SUSTAIN_LEVEL) > 0)
                    ? (short)(ccval(VCF_SUSTAIN_LEVEL) / 128.f * 1000.f)
                    : z->ModEnvRelease * scaleFactor;

  x->pitch_dff_log = calc_pitch_diff_log(x->zone, x->pcm, x->key);

  x->stride = 1.0f;
  advanceStage(&x->voleg);
  advanceStage(&x->modeg);

  x->lfo1_pitch = effect_floor(x->zone->ModLFO2Pitch);
  x->lfo1_volume = effect_floor(x->zone->ModLFO2Vol);
  x->lfo2_pitch = effect_floor(x->zone->VibLFO2Pitch);
  x->modeg_pitch = effect_floor(x->zone->ModEnv2Pitch);
  x->modeg_fc = effect_floor(x->zone->ModEnv2FilterFc);
  x->lfo1_fc = effect_floor(x->zone->ModLFO2FilterFc);

  x->modlfo.delay = timecent2sample(x->zone->ModLFODelay);
  x->vibrlfo.delay = timecent2sample(x->zone->ModLFODelay);
  set_frequency(&x->modlfo, x->zone->ModLFOFreq);
  set_frequency(&x->vibrlfo, x->zone->VibLFOFreq);
  x->initialFc = x->zone->FilterFc;
  x->initialQ = p10over200[x->zone->FilterQ + 1400];
  consolef(x->initialQ);

  new_lpf(&x->lpf, x->zone->FilterFc / SAMPLE_RATE, x->initialQ);

  return x->stride;
};
void set_spinner_input(spinner* x, pcm_t* pcm) {
  x->loopStart = pcm->loopstart;
  x->loopEnd = pcm->loopend;
  x->inputf = pcm->data;
  x->sampleLength = pcm->length;
  x->pcm = pcm;
  x->position = 0;
}

float calc_pitch_diff_log(zone_t* z, pcm_t* pcm, unsigned char key) {
  short rt = z->OverrideRootKey > -1 ? z->OverrideRootKey : pcm->originalPitch;
  float smpl_rate = rt * 100.f + z->CoarseTune * 100.f + z->FineTune;
  float diff = key * 100.f - smpl_rate;
  diff += ((pcm->sampleRate - SAMPLE_RATE) / 40.96f);
  return diff;
}
void set_spinner_zone(spinner* x, zone_t* z) {
  pcm_t* pcm = &pcms[z->SampleId];
  set_spinner_input(x, pcm);
  x->zone = z;

  x->is_looping = z->SampleModes == 1;
  x->position += (unsigned short)z->StartAddrOfs +
                 (unsigned short)(z->StartAddrCoarseOfs << 15);
  x->loopStart += (unsigned short)z->StartLoopAddrOfs +
                  (unsigned short)(z->StartLoopAddrCoarseOfs << 15);
  x->loopEnd -= (unsigned short)z->EndLoopAddrOfs -
                (unsigned short)(z->EndLoopAddrCoarseOfs << 15);
  x->sampleLength -= z->EndAddrOfs - (z->EndAddrCoarseOfs << 15);
}

void _spinblock(spinner* x, int n, int blockOffset) {
#define ccval(eff) midi_cc_vals[x->channelId * 128 + eff]

  double db, dbInc;
  float stride = 1.0f;
  float pdiff = x->pitch_dff_log;

  int ch = x->channelId;
  float* output_L = &x->outputf[blockOffset];
  float* output_R = &x->outputf[RENDQ + blockOffset];
  eg_roll(&x->modeg, n, modEgOut);
  eg_roll(&x->voleg, n, volEgOut);
  LFO_roll_out(&x->modlfo, n, lfo1Out);
  LFO_roll_out(&x->vibrlfo, n, lfo2Out);

  unsigned int position = x->position;
  float fract = x->fract;
  unsigned int nsamples = x->sampleLength;
  unsigned int looplen = x->loopEnd - x->loopStart;
  int should_skip_blocks = x->zone->SampleModes > 0 ? 1 : 0;

  float kRateCB = 0.0f;
  kRateCB += (float)x->zone->Attenuation;
  kRateCB += midi_volume_log10(ccval(TML_VOLUME_MSB));
  kRateCB += midi_volume_log10(midi_cc_vals[ch * 128 + TML_EXPRESSION_MSB]);
  if (x->voleg.stage < decay) kRateCB += midi_volume_log10(x->velocity);

  double panLeft = panleftLUT[midi_cc_vals[ch * 128 + TML_PAN_MSB]];

  double panRight = panrightLUT[midi_cc_vals[ch * 128 + TML_PAN_MSB]];

  int isLooping = x->is_looping;
  short lfo1_volume, lfo1_pitch, modeg_pitch, lfo2_pitch, modeg_fc;
  lfo1_volume = x->lfo1_volume;
  modeg_fc = x->modeg_fc;
  lfo1_pitch = x->lfo1_pitch;
  modeg_pitch = x->modeg_pitch;
  lfo2_pitch = x->lfo2_pitch;
  Biquad lpf = x->lpf;
  float tfc, outputf, fchertz;
  float Q = x->initialQ;
  short initFc = x->initialFc;

  for (int i = 0; i < n; i++) {
    db = volEgOut[i] + lfo1_volume * lfo1Out[i];
    pdiff += lfo1Out[i] * lfo1_pitch + modEgOut[i] * modeg_pitch +
             lfo2Out[i] * lfo2_pitch;

    stride = calcp2over1200(pdiff);

    fract = fract + stride;
    while (fract >= 1.0f) {
      position++;
      fract -= 1.0f;
    }
    if (position >= x->loopEnd && isLooping > 0) position -= looplen;

    outputf = lerp(x->inputf[position], x->inputf[position + 1], fract);
    tfc = initFc + modeg_fc * modEgOut[i] + x->lfo1_fc * lfo1Out[i];

    if (position >= nsamples) {
      position = 0;
      outputf = 0.0;
      x->voleg.stage = done;
    }
    outputf = applyCentible(outputf, (short)(db + kRateCB));

    if (tfc > .5) {
      fchertz = timecent2hertz(tfc) / SAMPLE_RATE;
      new_lpf(&lpf, fchertz, Q);
      outputf = calc_lpf(&lpf, outputf);
    }
    output_L[i] = applyCentible(outputf, panLeft);
    output_R[i] = applyCentible(outputf, panRight);
  }
  x->position = position;
  x->fract = fract;
  x->stride = stride;
}

int spin(spinner* x, int n) {
  _spinblock(x, 64, 0);

  _spinblock(x, 64, 64);

  if (x->voleg.egval < -1440.f) {
    x->voleg.stage = done;
    return 0;
  }
  if (x->voleg.stage == done) {
    return 0;
  }
  return 1;
}

unsigned int sp_byte_len() { return sizeof(spinner); }
EG* get_vol_eg(spinner* x) { return &x->voleg; }
EG* get_mod_eg(spinner* x) { return &x->modeg; }

float* get_sp_output(spinner* x) { return x->outputf; }
int get_sp_channel_id(spinner* x) { return x->channelId; }

void gm_reset() {
  for (int idx = 0; idx < nmidiChannels; idx++) {
    midi_cc_vals[idx * num_cc_list + TML_VOLUME_MSB] = 100;
    midi_cc_vals[idx * num_cc_list + TML_PAN_MSB] = 64;
    midi_cc_vals[idx * num_cc_list + TML_EXPRESSION_MSB] = 127;
    if (idx == 9) midi_cc_vals[idx * num_cc_list + TML_BANK_SELECT_MSB] = 128;
  }
  for (int i = 0; i < nchannels; i++) reset(&sps[i]);
}
// #include <math.h>
// #include <stdio.h>
// #include <stdlib.h>

// int main() {
// FILE* fd = fopen("/dev/stdout", "rb");
// FILE* fo = fopen("ggg.pcm", "w");
//   float* f;
//   float* o;
//   if (!fd) return 1;
//   float Q = .50f;
//   new_lpf(b, .5f, .50f);

//   while (!feof(fd)) {
//     fread(f, sizeof(float), 1, fd);
//     *o = calc_lpf(b, *f);
//     fwrite(o, sizeof(float), 1, fo);
//   }

//   return 0;
// }