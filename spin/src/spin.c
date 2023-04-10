
#include "spin.h"

// ghetto malloc all variables
spinner sps[nchannels];
// envelope generators
EG eg[nchannels * 2];
// LFOS
LFO lfos[nchannels * 2];
// midi ccs
char midi_cc_vals[nmidiChannels * 128];

float outputs[nchannels * RENDQ * 2];
float mod_eg_output[nchannels * RENDQ];
float LFO_1_Outputs[nchannels * RENDQ];
float LFO_2_Outputs[nchannels * RENDQ];
float vol_eg_output[nchannels * RENDQ];

float* get_mod_eg(int channel) { return &mod_eg_output[channel * RENDQ]; }
float* get_LFO_1(int channel) { return &LFO_1_Outputs[channel * RENDQ]; }
float* get_LFO_2(int channel) { return &LFO_2_Outputs[channel * RENDQ]; }

float silence[440];

char spsIndx = 0;
pcm_t pcms[2222];
zone_t zones[2222];
zone_t df[1];
pcm_t defP[4];
float squared[1024];
float sine[1024];
float calc_pitch_diff_log(zone_t* z, pcm_t* pcm, int key);
spinner* spRef(int idx) { return &sps[idx]; }
pcm_t* pcmRef(int idx) { return &pcms[idx]; }
zone_t* zoneRef(int idx) { return &zones[idx]; }

void sp_reflect(float* paper) {
  for (int j = 0, i = 0; i < 32; i++) {
    paper[j++] = (sps + i)->position;
    paper[j++] = (sps + i)->voleg->stage;
    paper[j++] = (sps + i)->voleg->egval;
    paper[j++] = (sps + i)->voleg->nsteps;
  }
}
spinner* newSpinner(int idx) {
  spinner* x = &sps[idx];
  x->outputf = &outputs[idx * RENDQ * 2];
  x->inputf = silence;
  x->fract = 0.0f;
  x->voleg = &eg[idx * 2];
  x->modeg = &eg[idx * 2 + 1];
  x->modlfo = &lfos[idx * 2];
  x->vibrlfo = &lfos[idx * 2 + 1];
  x->modeg->egval = -960.0f;
  x->modeg->egIncrement = 0.0f;
  x->voleg->egval = -960.0f;
  x->voleg->stage = init;
  x->voleg->egIncrement = 0.0f;
  x->channelId = idx;
  x->voleg->stage = inactive;

  return x;
}
void gm_reset() {
  for (int idx = 0; idx < 128; idx++) {
    midi_cc_vals[idx * nmidiChannels + TML_VOLUME_MSB] = 100;
    midi_cc_vals[idx * nmidiChannels + TML_PAN_MSB] = 64;
    midi_cc_vals[idx * nmidiChannels + TML_EXPRESSION_MSB] = 127;
  }
  for (int i = 0; i < nchannels; i++) reset(&sps[i]);
}
void trigger_release(int channel_id) {
  spinner* x = spRef(channel_id);
  _eg_release(x->voleg);
  _eg_release(x->modeg);
}
void reset(spinner* x) {
  x->position = 0;
  x->stride = .0f;
  x->fract = 0.0f;
  x->modeg->stage = inactive;
  x->modeg->egval = -960.0f;
  x->modeg->egIncrement = 0;
  x->voleg->egval = -960.0f;
  x->voleg->stage = inactive;
  x->voleg->egIncrement = 0;
  x->voleg->hasReleased = 0;
  x->modeg->hasReleased = 0;
}

void set_midi_cc_val(int channel, int metric, int val) {
  midi_cc_vals[channel * 128 + metric] = (char)(val & 0x7f);
}

float trigger_attack(spinner* x, int key, int velocity) {
  x->velocity = velocity;
  x->position = 0;
  x->fract = 0.0f;
  x->voleg->stage = init;
  x->key = (int)key;
  init_mod_eg(x->modeg, x->zone, x->pcm->sampleRate);
  init_vol_eg(x->voleg, x->zone, x->pcm->sampleRate);
  x->pitch_dff_log = calc_pitch_diff_log(x->zone, x->pcm, key);
  x->stride = calcp2over200(x->pitch_dff_log);
  advanceStage(x->voleg);
  x->modlfo->delay = timecent2sample(x->zone->ModLFODelay);
  x->vibrlfo->delay = timecent2sample(x->zone->ModLFODelay);
  set_frequency(x->modlfo, x->zone->ModLFOFreq);
  set_frequency(x->vibrlfo, x->zone->VibLFOFreq);
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
  pcm_t* pcm;
  if (z->SampleModes >= 1024) {
    pcm = defP + z->SampleId;
    z->SampleModes = z->SampleModes - 1024;
  } else {
    pcm = pcms + z->SampleId;
  }
  set_spinner_input(x, pcm);
  x->zone = z;

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
  float* volEgOut = &vol_eg_output[ch * RENDQ + blockOffset];
  float* modEgOut = &mod_eg_output[ch * RENDQ + blockOffset];
  float* lfo1Out = &LFO_1_Outputs[ch * RENDQ + blockOffset];
  float* lfo2Out = &LFO_2_Outputs[ch * RENDQ + blockOffset];
  eg_roll(x->modeg, n, modEgOut);
  eg_roll(x->voleg, n, volEgOut);
  LFO_roll_out(x->modlfo, 64, lfo1Out);
  LFO_roll_out(x->vibrlfo, 64, lfo2Out);
  int m_ch = (int)(x->channelId / 2);

  unsigned int position = x->position;
  float fract = x->fract;
  unsigned int nsamples = x->sampleLength;
  unsigned int looplen = x->loopEnd - x->loopStart;
  double modEG = p10over200[(short)(clamp(x->modeg->egval, -960, 0) + 960)];

  if (x->zone->SampleModes == 0 && x->voleg->stage > release) {
    db = 0.0f;
    dbInc = 0.0f;
  } else {
    db = x->voleg->egval;
    dbInc = x->voleg->egIncrement;
  }
  int should_skip_blocks = x->zone->SampleModes > 0 ? 1 : 0;

  float kRateCB = 0.0f;
  kRateCB -= (float)x->zone->Attenuation;
  kRateCB += midi_volume_log10(midi_cc_vals[ch * 128 + TML_VOLUME_MSB]);
  kRateCB += midi_volume_log10(midi_cc_vals[ch * 128 + TML_EXPRESSION_MSB]);
  kRateCB += midi_volume_log10(x->velocity);

  double panLeft = panleftLUT[midi_cc_vals[ch * 128 + TML_PAN_MSB]] / 2;
  // panLeft += panleftLUT[sf2midiPan(x->zone->Pan)] / 2;

  double panRight = panrightLUT[midi_cc_vals[ch * 128 + TML_PAN_MSB]] / 2;
  // panRight += panrightLUT[sf2midiPan(x->zone->Pan)] / 2;

  short lfo1_pitch = effect_floor(x->zone->ModLFO2Pitch);
  short lfo2_pitch = effect_floor(x->zone->VibLFO2Pitch);
  short modeg_pitch = effect_floor(x->zone->ModEnv2Pitch);
  short modeg_fc = effect_floor(x->zone->ModEnv2FilterFc);
  short modeg_vol = effect_floor(x->zone->ModEnv2Pitch);
  int isLooping = x->zone->SampleModes > 0;
  for (int i = 0; i < n; i++) {
    db = vol_eg_output[i];

    stride = calcp2over200(pdiff + lfo1Out[i] * lfo1_pitch +
                           lfo2Out[i] * lfo2_pitch);
    fract = fract + stride;
    while (fract >= 1.0f) {
      position++;
      fract -= 1.0f;
    }
    if (position >= x->loopEnd + 1 && isLooping > 0) position -= looplen;

    float outputf = lerp(x->inputf[position], x->inputf[position + 1], fract);

    if (position >= nsamples) {
      position = 0;
      outputf = 0.0;
      x->voleg->stage = done;
    }
    x->outputf[i * 2 + blockOffset * 2] =
        applyCentible(outputf, (short)(db / 10 + kRateCB + panLeft));
    x->outputf[i * 2 + blockOffset * 2 + 1] =
        applyCentible(outputf, (short)(db / 10 + kRateCB + panRight));
  }
  x->position = position;
  x->fract = fract;
  x->stride = stride;
}

int spin(spinner* x, int n) {
  _spinblock(x, 64, 0);

  _spinblock(x, 64, 64);

  if (x->voleg->egval < -2000.f) {
    x->voleg->stage = done;
    return 0;
  }
  if (x->voleg->stage == done) {
    return 0;
  }
  return 1;
}

unsigned int sp_byte_len() { return sizeof(spinner); }

EG* get_vol_eg(spinner* x) { return x->voleg; }