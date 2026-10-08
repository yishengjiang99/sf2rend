#include "spin.h"

#define MAX_VOICE_CNT 256

float SAMPLE_RATE = 44100.0f;
void set_sample_rate(float sr) {
  if (sr > 0) SAMPLE_RATE = sr;
}

// ghetto malloc all variables
spinner sps[MAX_VOICE_CNT];

pcm_t pcms[4096];
unsigned char midi_cc_vals[nmidiChannels * 128] = {0};
float outputs[MAX_VOICE_CNT * RENDQ * 2];

/* per-channel state */
short ch_gen_offset[nmidiChannels][60] = {{0}};
unsigned char ch_gen_set[nmidiChannels][60] = {{0}};
short ch_bend_cents[nmidiChannels] = {0};
short ch_bend_range[nmidiChannels] = {2, 2, 2, 2, 2, 2, 2, 2,
                                      2, 2, 2, 2, 2, 2, 2, 2};
unsigned char ch_rpn_msb[nmidiChannels] = {0};
unsigned char ch_rpn_lsb[nmidiChannels] = {0};

float silence[440] = {.0f};
float calc_pitch_diff_log(spinner* x, unsigned char key);
int output_arr_len = MAX_VOICE_CNT * RENDQ * 2;
float volEgOut[RENDQ];
float modEgOut[RENDQ];
float lfo1Out[RENDQ];
float lfo2Out[RENDQ];

/* Clamp an overridden generator value to its SF2 range. */
static short clamp_gen(int gen, int v) {
  int lo = -12000, hi = 12000;
  switch (gen) {
    case FilterFc:
      lo = 1500;
      hi = 13500;
      break;
    case FilterQ:
      lo = 0;
      hi = 960;
      break;
    case Pan:
      lo = -500;
      hi = 500;
      break;
    case Attenuation:
      lo = 0;
      hi = 1440;
      break;
    case ChorusSend:
    case ReverbSend:
      lo = 0;
      hi = 1000;
      break;
    case CoarseTune:
      lo = -120;
      hi = 120;
      break;
    case FineTune:
      lo = -99;
      hi = 99;
      break;
    case ScaleTune:
      lo = 0;
      hi = 1200;
      break;
    case ExclusiveClass:
      lo = 0;
      hi = 127;
      break;
    case Keynum:
    case Velocity:
    case OverrideRootKey:
      lo = -1;
      hi = 127;
      break;
    case SampleModes:
      lo = 0;
      hi = 3;
      break;
    case ModEnvSustain:
      lo = 0;
      hi = 1000;
      break;
    case VolEnvSustain:
      lo = 0;
      hi = 1440;
      break;
    default:
      break;
  }
  if (v < lo) v = lo;
  if (v > hi) v = hi;
  return (short)v;
}

/*
 * The zone value plus any per-channel override. Voices always read
 * parameters through here so inspector sliders and zone edits apply to
 * sounding voices, not just new notes.
 */
short effective_gen(spinner* x, int gen) {
  short base = ((short*)x->zone)[gen];
  unsigned char mode = ch_gen_set[x->channelId][gen];
  if (mode == 2) return ch_gen_offset[x->channelId][gen]; /* absolute */
  if (mode == 1)
    return clamp_gen(gen, (int)base + (int)ch_gen_offset[x->channelId][gen]);
  return base;
}

/* Export alias used by the worklet query path. */
short voice_gen(spinner* x, int gen) { return effective_gen(x, gen); }

void sp_wipe_output_tab() {
  for (int i = 0; i < output_arr_len; i++) {
    outputs[i] = 0.0f;
  }
}
spinner* spRef(int idx) { return &sps[idx]; }
pcm_t* pcmRef(int sampleId) { return &pcms[sampleId]; }

/* Most recent active voice per channel (for the query/inspect path). */
spinner* last_voice[nmidiChannels] = {0};
spinner* sp_for_channel(int ch) {
  if (ch < 0 || ch >= nmidiChannels) return 0;
  spinner* x = last_voice[ch];
  return (x && x->active) ? x : 0;
}

/*
 * Voice allocation: prefer a free slot; otherwise steal the quietest
 * (most attenuated) active voice. A returned slot is never still on the
 * render bus, so a voice can never be rendered twice in one block.
 * Each voice renders into its own slice of `outputs`.
 */
spinner* alloc_voice(int ch) {
  int idx = -1;
  for (int i = 0; i < MAX_VOICE_CNT; i++) {
    if (!sps[i].active) {
      idx = i;
      break;
    }
  }
  if (idx < 0) {
    float bestVal = 1e30f;
    idx = 0;
    for (int i = 0; i < MAX_VOICE_CNT; i++) {
      float v = sps[i].voleg.egval;
      if (v < bestVal) {
        bestVal = v;
        idx = i;
      }
    }
  }
  spinner* x = &sps[idx];
  x->outputf = &outputs[idx * RENDQ * 2];
  x->inputf = silence;
  x->channelId = (unsigned char)(ch & 0x0f);
  x->active = 1;
  return x;
}
void free_voice(spinner* x) { x->active = 0; }
int sp_active(spinner* x) { return x->active; }

spinner* newSpinner(int ch) { return alloc_voice(ch); }

void silence_all(void) {
  for (int i = 0; i < MAX_VOICE_CNT; i++) {
    if (sps[i].active) {
      _eg_release(&sps[i].voleg);
      _eg_release(&sps[i].modeg);
    }
  }
}

/* Choke other voices on the same channel with the same exclusive class
 * (e.g. hi-hats). Called from trigger_attack. */
static void choke_exclusive(spinner* self) {
  int ec = self->exclusiveClass;
  if (!ec) return;
  for (int i = 0; i < MAX_VOICE_CNT; i++) {
    spinner* o = &sps[i];
    if (o == self || !o->active) continue;
    if (o->channelId != self->channelId) continue;
    if (o->exclusiveClass != ec) continue;
    if (o->voleg.stage == release || o->voleg.stage == done) continue;
    trigger_release(o);
  }
}

void trigger_release(spinner* x) {
  _eg_release(&x->voleg);
  _eg_release(&x->modeg);
  if (effective_gen(x, SampleModes) > 1) {
    x->is_looping = 0;
  }
}
void reset(spinner* x) {
  x->position = 0;
  x->stride = .0f;
  x->fract = 0.0f;
  x->modeg.stage = inactive;
  x->modeg.egval = 0.0f;
  x->modeg.egIncrement = 0;
  x->voleg.egval = MAX_EG;
  x->voleg.stage = inactive;
  x->voleg.egIncrement = 0;
  x->voleg.hasReleased = 0;
  x->modeg.hasReleased = 0;
  x->lpf.z1 = 0;
  x->lpf.z2 = 0;
  x->active_dynamics_flag = 0;
  x->active = 0;
}

/* Full table reset: called on `{cmd:"reset"}` (SoundFont switch). Clears
 * sample headers, voice slots and per-channel overrides. */
void reset_tables(void) {
  for (int i = 0; i < 4096; i++) {
    pcms[i].data = 0;
    pcms[i].length = 0;
  }
  for (int i = 0; i < MAX_VOICE_CNT; i++) {
    sps[i].active = 0;
    sps[i].voleg.stage = done;
    sps[i].modeg.stage = done;
  }
  for (int c = 0; c < nmidiChannels; c++) {
    for (int g = 0; g < 60; g++) {
      ch_gen_set[c][g] = 0;
      ch_gen_offset[c][g] = 0;
    }
    ch_bend_cents[c] = 0;
    ch_bend_range[c] = 2;
    ch_rpn_msb[c] = 0;
    ch_rpn_lsb[c] = 0;
  }
  gm_reset();
}

void set_midi_cc_val(int channel, int metric, int val) {
  if (channel < 0 || channel >= nmidiChannels) return;
  if (metric < 0 || metric >= num_cc_list) return;
  midi_cc_vals[channel * 128 + metric] = (unsigned char)(val & 0x7f);
  /* RPN 0 = pitch-bend range (Data Entry MSB = semitones). */
  if (metric == TML_RPN_MSB)
    ch_rpn_msb[channel] = (unsigned char)(val & 0x7f);
  else if (metric == TML_RPN_LSB)
    ch_rpn_lsb[channel] = (unsigned char)(val & 0x7f);
  else if (metric == TML_DATA_ENTRY_MSB && ch_rpn_msb[channel] == 0 &&
           ch_rpn_lsb[channel] == 0) {
    int r = val & 0x7f;
    if (r > 24) r = 24;
    ch_bend_range[channel] = (short)r;
  }
}

/* 14-bit pitch bend, default +/-2 semitones (RPN 0 sets the range). */
void ch_set_bend(int ch, int msb, int lsb) {
  if (ch < 0 || ch >= nmidiChannels) return;
  int v = ((msb & 0x7f) << 7) | (lsb & 0x7f);
  ch_bend_cents[ch] =
      (short)((v - 8192) * ch_bend_range[ch] * 100 / 8192);
}

static float q_from_cb(short cb) {
  int idx = (int)cb + 1440;
  if (idx < 0) idx = 0;
  if (idx > 2880) idx = 2880;
  float q = (float)p10over200[idx]; /* 10^(cB/200) */
  if (q < 0.1f) q = 0.1f;
  if (q > 24.0f) q = 24.0f;
  return q;
}

/* Absolute cents -> normalized frequency (f / fs), clamped below Nyquist. */
static float filter_norm(float cents) {
  if (cents < -12000) cents = -12000;
  if (cents > 20000) cents = 20000;
  float hz = (float)timecent2hertz((short)cents);
  float cap = SAMPLE_RATE * 0.45f;
  if (hz > cap) hz = cap;
  if (hz < 10.0f) hz = 10.0f;
  return hz / SAMPLE_RATE;
}

float trigger_attack(spinner* x, uint32_t key, uint32_t velocity) {
  x->velocity = (unsigned char)(velocity & 0x7f);
  x->fract = 0.0f;
  x->key = (unsigned char)(key & 0x7f);
  x->active = 1;
  last_voice[x->channelId] = x;
  /* NOTE: x->position keeps the start offset from set_spinner_zone. */

  EG* eg = &x->voleg;
  eg->is_mod = 0;
  eg->delay = effective_gen(x, VolEnvDelay);
  eg->attack = effective_gen(x, VolEnvAttack);
  eg->hold = effective_gen(x, VolEnvHold);
  eg->decay = effective_gen(x, VolEnvDecay);
  eg->sustain = effective_gen(x, VolEnvSustain);
  eg->release = effective_gen(x, VolEnvRelease);
  eg->stage = init;
  eg->nsteps = 0;
  eg->hasReleased = 0;

  eg = &x->modeg;
  eg->is_mod = 1;
  eg->delay = effective_gen(x, ModEnvDelay);
  eg->attack = effective_gen(x, ModEnvAttack);
  eg->hold = effective_gen(x, ModEnvHold);
  eg->decay = effective_gen(x, ModEnvDecay);
  eg->sustain = effective_gen(x, ModEnvSustain);
  eg->release = effective_gen(x, ModEnvRelease);
  eg->stage = init;
  eg->nsteps = 0;
  eg->hasReleased = 0;

  x->exclusiveClass = effective_gen(x, ExclusiveClass);
  choke_exclusive(x);

  x->pitch_dff_log = calc_pitch_diff_log(x, x->key);

  /* LFO / mod-env depths in native units (cents, cB) - no accumulation. */
  x->lfo1_pitch_c = (float)effective_gen(x, ModLFO2Pitch);
  x->lfo1_vol_cb = (float)effective_gen(x, ModLFO2Vol);
  x->lfo2_pitch_c = (float)effective_gen(x, VibLFO2Pitch);
  x->modeg_pitch_c = (float)effective_gen(x, ModEnv2Pitch);
  x->modeg_fc_c = (float)effective_gen(x, ModEnv2FilterFc);
  x->lfo1_fc_c = (float)effective_gen(x, ModLFO2FilterFc);

  /* LFO phase reset on attack; vibrato uses its own delay. */
  x->modlfo.phase = 0;
  x->vibrlfo.phase = 0;
  x->modlfo.delay = timecent2sample(effective_gen(x, ModLFODelay));
  x->vibrlfo.delay = timecent2sample(effective_gen(x, VibLFODelay));
  set_frequency(&x->modlfo, effective_gen(x, ModLFOFreq));
  set_frequency(&x->vibrlfo, effective_gen(x, VibLFOFreq));

  x->filter_fc_cents = (float)effective_gen(x, FilterFc);
  x->filter_q_linear = q_from_cb(effective_gen(x, FilterQ));
  x->lpf.z1 = 0;
  x->lpf.z2 = 0;
  new_lpf(&x->lpf, filter_norm(x->filter_fc_cents), x->filter_q_linear);

  x->is_looping = effective_gen(x, SampleModes) > 0;

  advanceStage(&x->voleg);
  advanceStage(&x->modeg);

  x->stride = 1.0f;
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

/*
 * Pitch difference in cents between the played key and the sample root.
 * Honors ScaleTune, CoarseTune/FineTune, the shdr pitchCorrection, and the
 * correct logarithmic sample-rate correction.
 */
float calc_pitch_diff_log(spinner* x, unsigned char key) {
  zone_t* z = x->zone;
  pcm_t* pcm = x->pcm;
  short rt = effective_gen(x, OverrideRootKey) > -1
                 ? effective_gen(x, OverrideRootKey)
                 : (short)pcm->originalPitch;
  float st = (float)effective_gen(x, ScaleTune) / 100.0f;
  if (st < 0) st = 0;
  if (st > 12) st = 12;
  float scaledKey = (float)rt + ((float)key - (float)rt) * st;
  float diff = (float)key * 100.0f - scaledKey * 100.0f +
               (float)effective_gen(x, CoarseTune) * 100.0f +
               (float)effective_gen(x, FineTune) +
               (float)pcm->pitchCorrection;
  if (pcm->sampleRate > 0) {
    diff += 1200.0f * log2f((float)pcm->sampleRate / SAMPLE_RATE);
  }
  return diff;
}

/*
 * Point the voice at a zone owned by the worklet (presetRefs memory).
 * All four SF2 address offsets are signed and additive per the spec.
 */
void set_spinner_zone(spinner* x, zone_t* z) {
  if (!z || z->SampleId < 0 || z->SampleId >= 4096) return;
  pcm_t* pcm = &pcms[z->SampleId];
  x->pcm = pcm;
  x->zone = z;
  x->inputf = pcm->data;

  int sOfs = (int)z->StartAddrOfs + ((int)z->StartAddrCoarseOfs << 15);
  int eOfs = (int)z->EndAddrOfs + ((int)z->EndAddrCoarseOfs << 15);
  int slOfs = (int)z->StartLoopAddrOfs + ((int)z->StartLoopAddrCoarseOfs << 15);
  int elOfs = (int)z->EndLoopAddrOfs + ((int)z->EndLoopAddrCoarseOfs << 15);

  int pos = sOfs;
  int nls = (int)pcm->loopstart + slOfs;
  int nle = (int)pcm->loopend + elOfs;
  int nsl = (int)pcm->length + eOfs;
  if (nsl < 0) nsl = 0;
  if (pos < 0) pos = 0;
  if (pos > nsl) pos = nsl;
  if (nls < 0) nls = 0;
  if (nle < 0) nle = 0;
  if (nle > nsl) nle = nsl;
  if (nls > nle) nls = nle;

  x->position = (uint32_t)pos;
  x->loopStart = (uint32_t)nls;
  x->loopEnd = (uint32_t)nle;
  x->sampleLength = (uint32_t)nsl;
  x->is_looping = effective_gen(x, SampleModes) > 0;
}

/* Recompute a live voice's envelope increment/nsteps after a generator
 * override, keeping the current egval so held notes change smoothly. */
static void vol_eg_retarget(EG* eg) {
  if (eg->stage == decay) {
    int full = timecent2sample(eg->decay);
    if (full < 1) full = 1;
    float susAtt = (float)eg->sustain;
    if (susAtt < 0) susAtt = 0;
    if (susAtt > 1440) susAtt = 1440;
    float target = -susAtt;
    float remaining = (eg->egval - target) / MAX_EG; /* both <= 0 */
    if (remaining < 0) remaining = 0;
    if (remaining > 1) remaining = 1;
    eg->nsteps = (int)(full * remaining);
    eg->egIncrement =
        eg->nsteps > 0 ? (target - eg->egval) / (float)eg->nsteps : 0.0f;
  } else if (eg->stage == release) {
    int full = timecent2sample(eg->release);
    if (full < 1) full = 1;
    float cur = eg->egval;
    if (cur > 0) cur = 0;
    if (cur < MAX_EG) cur = MAX_EG;
    eg->nsteps = (int)(full * (1.0f - cur / MAX_EG));
    eg->egIncrement =
        eg->nsteps > 0 ? (MAX_EG - cur) / (float)eg->nsteps : 0.0f;
  }
}

static void mod_eg_retarget(EG* eg) {
  if (eg->stage == decay) {
    int full = timecent2sample(eg->decay);
    if (full < 1) full = 1;
    float sus = eg->sustain / 1000.0f;
    if (sus < 0) sus = 0;
    if (sus > 1) sus = 1;
    float remaining = eg->egval - sus;
    if (remaining < 0) remaining = 0;
    if (remaining > 1) remaining = 1;
    eg->nsteps = (int)(full * remaining);
    eg->egIncrement =
        eg->nsteps > 0 ? (sus - eg->egval) / (float)eg->nsteps : 0.0f;
  } else if (eg->stage == release) {
    int full = timecent2sample(eg->release);
    if (full < 1) full = 1;
    float cur = eg->egval;
    if (cur < 0) cur = 0;
    if (cur > 1) cur = 1;
    eg->nsteps = (int)(full * cur);
    eg->egIncrement = eg->nsteps > 0 ? -cur / (float)eg->nsteps : 0.0f;
  }
}

/* Glide a sustaining voice toward a new sustain level over ~10 ms. */
static void eg_glide_to(EG* eg, float target) {
  eg->egIncrement = (target - eg->egval) / 441.0f;
  eg->nsteps = 441;
}

/*
 * Apply a generator override to one live voice. Envelope time changes
 * retarget the current stage; sustain changes glide; filter changes
 * recompute coefficients without clearing z1/z2; tuning/pan/attenuation
 * are picked up on the next block via effective_gen.
 */
static void apply_gen_to_voice(spinner* x, int gen, short value) {
  (void)value;
  switch (gen) {
    case VolEnvAttack:
      x->voleg.attack = effective_gen(x, VolEnvAttack);
      break;
    case VolEnvDecay:
      x->voleg.decay = effective_gen(x, VolEnvDecay);
      vol_eg_retarget(&x->voleg);
      break;
    case VolEnvRelease:
      x->voleg.release = effective_gen(x, VolEnvRelease);
      vol_eg_retarget(&x->voleg);
      break;
    case VolEnvSustain: {
      x->voleg.sustain = effective_gen(x, VolEnvSustain);
      if (x->voleg.stage == sustain) {
        float susAtt = (float)x->voleg.sustain;
        if (susAtt < 0) susAtt = 0;
        if (susAtt > 1440) susAtt = 1440;
        eg_glide_to(&x->voleg, -susAtt);
      }
      break;
    }
    case VolEnvDelay:
      x->voleg.delay = effective_gen(x, VolEnvDelay);
      break;
    case VolEnvHold:
      x->voleg.hold = effective_gen(x, VolEnvHold);
      break;
    case ModEnvAttack:
      x->modeg.attack = effective_gen(x, ModEnvAttack);
      break;
    case ModEnvDecay:
      x->modeg.decay = effective_gen(x, ModEnvDecay);
      mod_eg_retarget(&x->modeg);
      break;
    case ModEnvRelease:
      x->modeg.release = effective_gen(x, ModEnvRelease);
      mod_eg_retarget(&x->modeg);
      break;
    case ModEnvSustain: {
      x->modeg.sustain = effective_gen(x, ModEnvSustain);
      if (x->modeg.stage == sustain) {
        float sus = x->modeg.sustain / 1000.0f;
        if (sus < 0) sus = 0;
        if (sus > 1) sus = 1;
        eg_glide_to(&x->modeg, sus);
      }
      break;
    }
    case ModEnvDelay:
      x->modeg.delay = effective_gen(x, ModEnvDelay);
      break;
    case ModEnvHold:
      x->modeg.hold = effective_gen(x, ModEnvHold);
      break;
    case FilterFc:
      x->filter_fc_cents = (float)effective_gen(x, FilterFc);
      new_lpf(&x->lpf, filter_norm(x->filter_fc_cents), x->filter_q_linear);
      break;
    case FilterQ:
      x->filter_q_linear = q_from_cb(effective_gen(x, FilterQ));
      new_lpf(&x->lpf, filter_norm(x->filter_fc_cents), x->filter_q_linear);
      break;
    case ModLFO2Pitch:
      x->lfo1_pitch_c = (float)effective_gen(x, ModLFO2Pitch);
      break;
    case ModLFO2Vol:
      x->lfo1_vol_cb = (float)effective_gen(x, ModLFO2Vol);
      break;
    case VibLFO2Pitch:
      x->lfo2_pitch_c = (float)effective_gen(x, VibLFO2Pitch);
      break;
    case ModEnv2Pitch:
      x->modeg_pitch_c = (float)effective_gen(x, ModEnv2Pitch);
      break;
    case ModEnv2FilterFc:
      x->modeg_fc_c = (float)effective_gen(x, ModEnv2FilterFc);
      break;
    case ModLFO2FilterFc:
      x->lfo1_fc_c = (float)effective_gen(x, ModLFO2FilterFc);
      break;
    case ModLFODelay:
      break; /* delay only applies at attack */
    case VibLFODelay:
      break;
    case ModLFOFreq:
      set_frequency(&x->modlfo, effective_gen(x, ModLFOFreq));
      break;
    case VibLFOFreq:
      set_frequency(&x->vibrlfo, effective_gen(x, VibLFOFreq));
      break;
    case CoarseTune:
    case FineTune:
    case ScaleTune:
    case OverrideRootKey:
      x->pitch_dff_log = calc_pitch_diff_log(x, x->key);
      break;
    case SampleModes:
      x->is_looping = effective_gen(x, SampleModes) > 0;
      break;
    case ExclusiveClass:
      x->exclusiveClass = effective_gen(x, ExclusiveClass);
      break;
    case Pan:
    case Attenuation:
      break; /* read per-block via effective_gen */
    default:
      break;
  }
}

/* Re-derive all of a live voice's cached state from its (possibly edited)
 * zone memory: envelope gens retarget from the current egval, sustain
 * levels glide, filter coefficients recompute without clearing z1/z2. */
void voice_refresh_zone(spinner* x) {
  for (int g = 0; g < 60; g++) apply_gen_to_voice(x, g, 0);
}

void set_channel_gen(int ch, int gen, short value) {  if (ch < 0 || ch >= nmidiChannels || gen < 0 || gen >= 60) return;
  ch_gen_offset[ch][gen] = clamp_gen(gen, value);
  ch_gen_set[ch][gen] = 2; /* absolute override */
  for (int i = 0; i < MAX_VOICE_CNT; i++) {
    spinner* x = &sps[i];
    if (!x->active || x->channelId != ch) continue;
    apply_gen_to_voice(x, gen, value);
  }
}

void clear_channel_gen(int ch, int gen) {
  if (ch < 0 || ch >= nmidiChannels || gen < 0 || gen >= 60) return;
  ch_gen_set[ch][gen] = 0;
  ch_gen_offset[ch][gen] = 0;
  for (int i = 0; i < MAX_VOICE_CNT; i++) {
    spinner* x = &sps[i];
    if (!x->active || x->channelId != ch) continue;
    apply_gen_to_voice(x, gen, 0);
  }
}

void _spinblock(spinner* x, int n, int blockOffset) {
  float* output_L = &x->outputf[blockOffset];
  float* output_R = &x->outputf[RENDQ + blockOffset];
  if (!x->inputf || x->sampleLength == 0) {
    /* No sample data (unshipped SampleId): silence and end the voice. */
    for (int i = 0; i < n; i++) output_L[i] = output_R[i] = 0.0f;
    x->voleg.stage = done;
    return;
  }
  eg_roll(&x->modeg, n, modEgOut);
  eg_roll(&x->voleg, n, volEgOut);
  LFO_roll_out(&x->modlfo, n, lfo1Out);
  LFO_roll_out(&x->vibrlfo, n, lfo2Out);

  unsigned int position = x->position;
  float fract = x->fract;
  unsigned int nsamples = x->sampleLength;
  unsigned int looplen =
      (x->loopEnd > x->loopStart) ? x->loopEnd - x->loopStart : 0;

  /* Velocity attenuation applies for the whole voice lifetime. */
  float kRateCB = (float)effective_gen(x, Attenuation);
  kRateCB += (float)midi_volume_log10(midi_cc_vals[x->channelId * 128 +
                                                   TML_VOLUME_MSB]);
  kRateCB += (float)midi_volume_log10(
      midi_cc_vals[x->channelId * 128 + TML_EXPRESSION_MSB]);
  kRateCB += (float)midi_volume_log10(x->velocity);

  /* Zone Pan (-500..500) combined with CC10 pan. */
  int ccPan = midi_cc_vals[x->channelId * 128 + TML_PAN_MSB];
  int effPan = ccPan + (effective_gen(x, Pan) * 64) / 500;
  if (effPan < 0) effPan = 0;
  if (effPan > 127) effPan = 127;
  short panL = (short)panleftLUT[effPan];
  short panR = (short)panrightLUT[effPan];

  /* Pitch: recomputed per sample from the base, never accumulated. */
  float basePdiff =
      x->pitch_dff_log + (float)ch_bend_cents[x->channelId];
  float lfo1p = x->lfo1_pitch_c;
  float lfo2p = x->lfo2_pitch_c;
  float mgp = x->modeg_pitch_c;
  float lfo1v = x->lfo1_vol_cb;
  float mgfc = x->modeg_fc_c;
  float lfo1fc = x->lfo1_fc_c;
  int doFilterMod = (mgfc != 0.0f || lfo1fc != 0.0f);

  Biquad lpf = x->lpf;
  float fcCents = x->filter_fc_cents;
  float qLin = x->filter_q_linear;
  int filtCountdown = 0;
  int isLooping = x->is_looping;

  for (int i = 0; i < n; i++) {
    float vol = volEgOut[i] + lfo1v * lfo1Out[i];
    float pd =
        basePdiff + lfo1Out[i] * lfo1p + modEgOut[i] * mgp + lfo2Out[i] * lfo2p;

    float stride = calcp2over1200(pd);

    fract = fract + stride;
    while (fract >= 1.0f) {
      position++;
      fract -= 1.0f;
    }
    if (isLooping && looplen > 0 && position >= x->loopEnd) position -= looplen;

    float outputf;
    if (position + 1 < nsamples) {
      outputf = lerp(x->inputf[position], x->inputf[position + 1], fract);
    } else if (position < nsamples) {
      outputf = x->inputf[position];
    } else {
      outputf = 0.0f;
      if (!isLooping) {
        /* Ran past the end of a one-shot sample: end the voice. */
        x->voleg.stage = done;
      }
    }
    outputf = applyCentible(outputf, (short)(vol + kRateCB));

    if (doFilterMod) {
      if (filtCountdown <= 0) {
        float tfc = fcCents + mgfc * modEgOut[i] + lfo1fc * lfo1Out[i];
        new_lpf(&lpf, filter_norm(tfc), qLin);
        filtCountdown = 32;
      }
      filtCountdown--;
    }
    outputf = calc_lpf(&lpf, outputf);

    output_L[i] = applyCentible(outputf, panL);
    output_R[i] = applyCentible(outputf, panR);
  }
  x->position = position;
  x->fract = fract;
  x->stride = calcp2over1200(basePdiff);
  x->lpf = lpf; /* write back filter state */
}

int spin(spinner* x, int n) {
  _spinblock(x, 64, 0);

  _spinblock(x, 64, 64);

  if (x->voleg.stage == done) {
    x->active = 0;
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
    ch_bend_cents[idx] = 0;
  }
  for (int i = 0; i < nchannels; i++) reset(&sps[i]);
}
