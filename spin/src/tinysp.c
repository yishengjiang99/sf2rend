#include "spin.h"

#define RENDQ 128
#define nchannels 4
float sample_data[1024 * 10];
typedef struct {
  int sampleRate, frequency, length;
  float* data;
} smpl_info;

void set_smpl_frames(float* fl, int cnt, float sr, float smpl_freq) {}
int main() { smpl_info info = {44100, 440, 1982}; }

// pcm_t pcms[100];

// spinner sps[1];
// EG eg[2];
// LFO lfos[2];
// pcm_t pcms[1];
// zone_t zones[1];
// float outputs[nchannels * RENDQ * 2];
// float mod_eg_output[RENDQ];
// float LFO_1_Outputs[RENDQ];
// float LFO_2_Outputs[RENDQ];
// char midi_cc_vals[128];
// float silence[440] = {.0f};
// float eps = .00001;

// spinner* newSpinner(int idx) {
//   spinner* x = &sps[idx];
//   x->outputf = &outputs[idx * RENDQ * 2];
//   x->inputf = silence;
//   x->fract = 0.0f;
//   x->voleg = &eg[idx * 2];
//   x->modeg = &eg[idx * 2 + 1];
//   x->modlfo = &lfos[idx * 2];
//   x->vibrlfo = &lfos[idx * 2 + 1];
//   x->modeg->egval = -960.0f;
//   x->modeg->egIncrement = 0.0f;
//   x->voleg->egval = -960.0f;
//   x->voleg->stage = init;
//   x->voleg->egIncrement = 0.0f;
//   x->channelId = idx;
//   x->voleg->stage = inactive;
//   return x;
// }
// void gm_reset() {
//   midi_cc_vals[TML_VOLUME_MSB] = 100;
//   midi_cc_vals[TML_PAN_MSB] = 64;
//   midi_cc_vals[TML_EXPRESSION_MSB] = 127;
//   for (int i = 0; i < nchannels; i++) reset(&sps[i]);
// }
// void trigger_release() {
//   spinner* x = sps;
//   _eg_release(x->voleg);
//   _eg_release(x->modeg);
// }
// void reset(spinner* x) {
//   x->position = 0;
//   x->stride = .0f;
//   x->fract = 0.0f;
//   x->modeg->stage = inactive;
//   x->modeg->egval = -960.0f;
//   x->modeg->egIncrement = 0;
//   x->voleg->egval = -960.0f;
//   x->voleg->stage = inactive;
//   x->voleg->egIncrement = 0;
//   x->voleg->hasReleased = 0;
//   x->modeg->hasReleased = 0;
// }

// void set_midi_cc_val(int channel, int metric, int val) {
//   midi_cc_vals[channel * 128 + metric] = (char)(val & 0x7f);
// }

// float trigger_attack(spinner* x, float ratio, int velocity) {
//   x->stride = ratio;
//   x->velocity = velocity;
//   x->position = 0;
//   x->fract = 0.0f;
//   x->voleg->stage = init;
//   init_mod_eg(x->modeg, x->zone, x->pcm->sampleRate);
//   init_vol_eg(x->voleg, x->zone, x->pcm->sampleRate);

//   x->modlfo->delay = timecent2sample(x->zone->ModLFODelay);
//   x->vibrlfo->delay = timecent2sample(x->zone->ModLFODelay);
//   set_frequency(x->modlfo, x->zone->ModLFOFreq);
//   set_frequency(x->vibrlfo, x->zone->VibLFOFreq);
//   return x->stride;
// };
// void set_spinner_input(spinner* x, pcm_t* pcm) {
//   x->loopStart = pcm->loopstart;
//   x->loopEnd = pcm->loopend;
//   x->inputf = pcm->data;
//   x->sampleLength = pcm->length;
//   x->pcm = pcm;
//   x->position = 0;
// }
// void set_spinner_zone(spinner* x, zone_t* z) {
//   pcm_t* pcm;
//   pcm = pcms + z->SampleId;

//   set_spinner_input(x, pcm);
//   x->position += z->StartAddrOfs + (z->StartAddrCoarseOfs << 15);
//   x->loopStart += z->StartLoopAddrOfs + (z->StartLoopAddrCoarseOfs << 15);
//   x->loopEnd -= z->EndLoopAddrOfs - (z->EndLoopAddrCoarseOfs << 15);
//   x->sampleLength -= z->EndAddrOfs - (z->EndAddrCoarseOfs << 15);

//   x->zone = z;
// }

// float lerp(float f1, float f2, float frac) { return f1 + (f2 - f1) * frac; }

// #define effect_floor(v) v <= -12000 ? 0 : calcp2over200(v)

// void _spinblock(spinner* x, int n, int blockOffset) {
//   double db, dbInc;
//   int ch = (int)(x->channelId / 2);
//   float* modEgOut = &mod_eg_output[ch * RENDQ + blockOffset];
//   float* lfo1Out = &LFO_1_Outputs[ch * RENDQ + blockOffset];
//   float* lfo2Out = &LFO_2_Outputs[ch * RENDQ + blockOffset];
//   eg_roll(x->modeg, n, modEgOut);
//   LFO_roll_out(x->modlfo, 64, lfo1Out);
//   LFO_roll_out(x->vibrlfo, 64, lfo2Out);

//   unsigned int position = x->position;
//   float fract = x->fract;
//   unsigned int nsamples = x->sampleLength;
//   unsigned int looplen = x->loopEnd - x->loopStart;
//   double modEG = p10over200[(short)(clamp(x->modeg->egval, -960, 0) + 960)];

//   if (x->zone->SampleModes == 0 && x->voleg->stage > release) {
//     db = 0.0f;
//     dbInc = 0.0f;
//   } else {
//     db = x->voleg->egval;
//     dbInc = x->voleg->egIncrement;
//   }
//   float stride = x->zone->SampleModes > 0 ? x->stride : 1.0f;

//   float kRateCB = 0.0f;
//   kRateCB -= (float)x->zone->Attenuation;
//   kRateCB += midi_volume_log10(midi_cc_vals[ch * 128 + TML_VOLUME_MSB]);
//   kRateCB += midi_volume_log10(midi_cc_vals[ch * 128 + TML_EXPRESSION_MSB]);
//   kRateCB += midi_volume_log10(x->velocity);

//   double panLeft = panleftLUT[midi_cc_vals[ch * 128 + TML_PAN_MSB]] / 2;
//   panLeft -= panrightLUT[sf2midiPan(x->zone->Pan)];

//   double panRight = panrightLUT[midi_cc_vals[ch * 128 + TML_PAN_MSB]] / 2;
//   panRight += panrightLUT[sf2midiPan(x->zone->Pan)] / 2;

//   short lfo1_pitch = effect_floor(x->zone->ModLFO2Pitch);
//   short lfo2_pitch = effect_floor(x->zone->VibLFO2Pitch);
//   short modeg_pitch = effect_floor(x->zone->ModEnv2Pitch);
//   short modeg_fc = effect_floor(x->zone->ModEnv2FilterFc);
//   short modeg_vol = effect_floor(x->zone->ModEnv2Pitch);

//   for (int i = 0; i < n; i++) {
//     // stride = stride *
//     //          (12.0f + mod_eg_output[i] * modeg_pitch + lfo1Out[i] *
//     //          lfo1_pitch +
//     //           lfo2Out[i] * lfo2_pitch) /
//     //          12.0f;
//     fract = fract + stride;

//     while (fract >= 1.0f) {
//       position++;
//       fract -= 1.0f;
//     }

//     if (position >= x->loopEnd + 1 && x->zone->SampleModes > 0)
//       position -= looplen;

//     float outputf = lerp(x->inputf[position], x->inputf[position + 1],
//     fract);

//     if (position >= nsamples - 1) {
//       position = 0;
//       outputf = 0.0;
//       x->voleg->stage = done;
//     }
//     x->outputf[i * 2 + blockOffset * 2] =
//         applyCentible(outputf, (short)(db + kRateCB + panLeft));
//     x->outputf[i * 2 + blockOffset * 2 + 1] =
//         applyCentible(outputf, (short)(db + kRateCB + panRight));
//     db += dbInc;
//   }
//   x->position = position;
//   x->fract = fract;
// }

// int spin(spinner* x, int n) {
//   update_eg(x->voleg, 64);

//   _spinblock(x, 64, 0);

//   update_eg(x->voleg, 64);

//   _spinblock(x, 64, 64);
//   if (x->voleg->stage == done) {
//     return 0;
//   }
//   return x->voleg->egval * 100;
// }

// unsigned int sp_byte_len() { return sizeof(spinner); }

// EG* get_vol_eg(spinner* x) { return x->voleg; }