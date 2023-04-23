
#include "spin.h"
#define MAX_VOICE_CNT 256
// ghetto malloc all variables
int sp_idx = 0;
spinner sps[MAX_VOICE_CNT];
pcm_t pcms[4096];
// midi ccs
char midi_cc_vals[nmidiChannels * 128];
float outputs[MAX_VOICE_CNT * RENDQ * 2];

float silence[440] = {.0f};
float calc_pitch_diff_log(zone_t* z, pcm_t* pcm, int key);
int output_arr_len = MAX_VOICE_CNT * RENDQ * 2;

void sp_wipe_output_tab() {
  for (int i = 0; i < output_arr_len; i++) {
    outputs[i] = 0.0f;
  }
}
spinner* spRef(int idx) { return &sps[idx]; }
pcm_t* pcmRef(int sampleId) { return &pcms[sampleId]; }
spinner* allocate_sp() {
  // dangerously rotating between 1024 pre-allocated
  // structs to avoid calling malloc on audio thread
  spinner* x = &sps[sp_idx % MAX_VOICE_CNT];
  x->outputf = &outputs[sp_idx * RENDQ * 2];
  sp_idx++;
  return x;
}

void sp_reflect(float* paper) {
  for (int j = 0, i = sp_idx; i > 0 && j < 32; i--) {
    paper[j++] = (sps + i)->channelId;
    paper[j++] = (sps + i)->voleg.stage;
    paper[j++] = (sps + i)->voleg.egval;
    paper[j++] = (sps + i)->position;
  }
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
  if (x->zone->SampleModes == 3) {
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
  x->active_dynamics_flag = 0;
}

void set_midi_cc_val(int channel, int metric, int val) {
  midi_cc_vals[channel * 128 + metric] = (char)(val & 0x7f);
}

float trigger_attack(spinner* x, int key, int velocity) {
  x->velocity = velocity;
  x->position = 0;
  x->fract = 0.0f;
  x->voleg.stage = init;
  x->key = (int)key;
  init_mod_eg(&x->modeg, x->zone, x->pcm->sampleRate);
  init_vol_eg(&x->voleg, x->zone, x->pcm->sampleRate);
  x->pitch_dff_log = calc_pitch_diff_log(x->zone, x->pcm, key);
  x->stride = 1.0f;
  advanceStage(&x->voleg);
  x->modlfo.delay = timecent2sample(x->zone->ModLFODelay);
  x->vibrlfo.delay = timecent2sample(x->zone->ModLFODelay);
  set_frequency(&x->modlfo, x->zone->ModLFOFreq);
  set_frequency(&x->vibrlfo, x->zone->VibLFOFreq);
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

float calc_pitch_diff_log(zone_t* z, pcm_t* pcm, int key) {
  short rt = z->OverrideRootKey > -1 ? z->OverrideRootKey : pcm->originalPitch;
  float smpl_rate = rt * 100.0f + z->CoarseTune * 100.0f + (float)z->FineTune;
  float diff = key * 100.0f - smpl_rate + .0001f;
  diff += ((pcm->sampleRate - SAMPLE_RATE) / 4096.f * 100.f);
  return diff;
}
void set_spinner_zone(spinner* x, zone_t* z) {
  pcm_t* pcm = &pcms[z->SampleId];
  set_spinner_input(x, pcm);
  x->zone = z;

  x->is_looping = z->SampleModes > 0 && x->channelId != 10 ? 1 : 0;
  x->position += (unsigned short)z->StartAddrOfs +
                 (unsigned short)(z->StartAddrCoarseOfs << 15);
  x->loopStart += (unsigned short)z->StartLoopAddrOfs +
                  (unsigned short)(z->StartLoopAddrCoarseOfs << 15);
  x->loopEnd -= (unsigned short)z->EndLoopAddrOfs -
                (unsigned short)(z->EndLoopAddrCoarseOfs << 15);
  x->sampleLength -= z->EndAddrOfs - (z->EndAddrCoarseOfs << 15);
}

float lerp(float f1, float f2, float frac) { return f1 + (f2 - f1) * frac; }

#define effect_floor(v) v <= -12000 ? 0 : calcp2over200(v)

void _spinblock(spinner* x, int n, int blockOffset) {
  double db, dbInc;
  float stride = 1.0f;
  float pdiff = x->pitch_dff_log;

  int ch = x->channelId;
  float* output_L = &x->outputf[blockOffset];
  float* output_R = &x->outputf[RENDQ + blockOffset];

  // compute a-rate generators
  float volEgOut[n];
  float modEgOut[n];
  float lfo1Out[n];
  float lfo2Out[n];
  eg_roll(&x->modeg, n, modEgOut);
  eg_roll(&x->voleg, n, volEgOut);
  LFO_roll_out(&x->modlfo, 64, lfo1Out);
  LFO_roll_out(&x->vibrlfo, 64, lfo2Out);

  unsigned int position = x->position;
  float fract = x->fract;
  unsigned int nsamples = x->sampleLength;
  unsigned int looplen = x->loopEnd - x->loopStart;
  int should_skip_blocks = x->zone->SampleModes > 0 ? 1 : 0;

  float kRateCB = 0.0f;
  kRateCB -= (float)x->zone->Attenuation;
  kRateCB += midi_volume_log10(midi_cc_vals[ch * 128 + TML_VOLUME_MSB]);
  if (x->voleg.stage < decay)
    kRateCB += midi_volume_log10(midi_cc_vals[ch * 128 + TML_EXPRESSION_MSB]);
  kRateCB += midi_volume_log10(x->velocity);

  double panLeft = panleftLUT[midi_cc_vals[ch * 128 + TML_PAN_MSB]];

  double panRight = panrightLUT[midi_cc_vals[ch * 128 + TML_PAN_MSB]];

  short lfo1_pitch = effect_floor(x->zone->ModLFO2Pitch);
  short lfo2_pitch = effect_floor(x->zone->VibLFO2Pitch);
  short modeg_pitch = effect_floor(x->zone->ModEnv2Pitch);
  short modeg_fc = effect_floor(x->zone->ModEnv2FilterFc);
  short modeg_vol = effect_floor(x->zone->ModEnv2Pitch);
  int isLooping = x->is_looping;
  for (int i = 0; i < n; i++) {
    db = volEgOut[i];
    float outputf = lerp(x->inputf[position], x->inputf[position + 1], fract);

    stride = calcp2over200(pdiff + lfo1Out[i] * lfo1_pitch +
                           lfo2Out[i] * lfo2_pitch);
    fract = fract + stride;
    while (fract >= 1.0f) {
      position++;
      fract -= 1.0f;
    }
    if (position >= x->loopEnd && isLooping > 0) position -= looplen;

    if (position >= nsamples) {
      position = 0;
      outputf = 0.0;
      x->voleg.stage = done;
    }
    output_L[i] = applyCentible(outputf, (short)(db / 3.0 + kRateCB + panLeft));
    output_R[i] =
        applyCentible(outputf, (short)(db / 3.0 + kRateCB + panRight));
  }
  x->position = position;
  x->fract = fract;
  x->stride = stride;
  // // x->active_dynamics_flag ^ filter_active;
  // if (x->active_dynamics_flag & filter_active) {
  //   lpf_process(ch, output_L, n);
  //   lpf_process(ch, output_R, n);
  // }
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
float* get_sp_output(spinner* x) { return x->outputf; }

void gm_reset() {
  for (int idx = 0; idx < 128; idx++) {
    midi_cc_vals[idx * nmidiChannels + TML_VOLUME_MSB] = 100;
    midi_cc_vals[idx * nmidiChannels + TML_PAN_MSB] = 64;
    midi_cc_vals[idx * nmidiChannels + TML_EXPRESSION_MSB] = 127;
  }
  for (int i = 0; i < nchannels; i++) reset(&sps[i]);
}
