/**
 * Generator indices (must match the `grntypes` enum in spin/src/spin.h)
 * and the slider <-> generator conversions from the §3A spec.
 */

// Generator indices
export const GEN = {
  StartAddrOfs: 0,
  EndAddrOfs: 1,
  StartLoopAddrOfs: 2,
  EndLoopAddrOfs: 3,
  StartAddrCoarseOfs: 4,
  ModLFO2Pitch: 5,
  VibLFO2Pitch: 6,
  ModEnv2Pitch: 7,
  FilterFc: 8,
  FilterQ: 9,
  ModLFO2FilterFc: 10,
  ModEnv2FilterFc: 11,
  EndAddrCoarseOfs: 12,
  ModLFO2Vol: 13,
  Unused1: 14,
  ChorusSend: 15,
  ReverbSend: 16,
  Pan: 17,
  Unused2: 18,
  Unused3: 19,
  Unused4: 20,
  ModLFODelay: 21,
  ModLFOFreq: 22,
  VibLFODelay: 23,
  VibLFOFreq: 24,
  ModEnvDelay: 25,
  ModEnvAttack: 26,
  ModEnvHold: 27,
  ModEnvDecay: 28,
  ModEnvSustain: 29,
  ModEnvRelease: 30,
  Key2ModEnvHold: 31,
  Key2ModEnvDecay: 32,
  VolEnvDelay: 33,
  VolEnvAttack: 34,
  VolEnvHold: 35,
  VolEnvDecay: 36,
  VolEnvSustain: 37,
  VolEnvRelease: 38,
  Key2VolEnvHold: 39,
  Key2VolEnvDecay: 40,
  Instrument: 41,
  Reserved1: 42,
  KeyRange: 43,
  VelRange: 44,
  StartLoopAddrCoarseOfs: 45,
  Keynum: 46,
  Velocity: 47,
  Attenuation: 48,
  Reserved2: 49,
  EndLoopAddrCoarseOfs: 50,
  CoarseTune: 51,
  FineTune: 52,
  SampleId: 53,
  SampleModes: 54,
  Reserved3: 55,
  ScaleTune: 56,
  ExclusiveClass: 57,
  OverrideRootKey: 58,
  Dummy: 59,
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const log2 = Math.log2;

// --- unit conversions (slider <-> generator) ---

// timecents <-> milliseconds (log scale, 1ms..20s on the slider)
export const tcToMs = (tc) => 1000 * Math.pow(2, tc / 1200);
export const msToTc = (ms) => 1200 * log2(Math.max(1e-3, ms) / 1000);

// VolEnvSustain is cB attenuation (0..1440); slider is % level, higher=louder
export const cbToPct = (cb) => clamp(100 * Math.pow(10, -cb / 200), 0, 100);
export const pctToCb = (pct) =>
  clamp(-200 * Math.log10(Math.max(1e-6, pct / 100)), 0, 1440);

// ModEnvSustain is 0.1% units; slider is %
export const tenthPctToPct = (v) => clamp(100 - v / 10, 0, 100);
export const pctToTenthPct = (pct) => clamp((100 - pct) * 10, 0, 1000);

// FilterFc is absolute cents; slider is Hz (log 20..20000)
export const absCentsToHz = (tc) => 8.176 * Math.pow(2, tc / 1200);
export const hzToAbsCents = (hz) => 1200 * log2(Math.max(1, hz) / 8.176);

// FilterQ is cB; slider is dB 0..96
export const cbToDb = (cb) => cb / 10;
export const dbToCb = (db) => clamp(db * 10, 0, 960);

// timecents delay/attack display helper
export const tcToDisplayMs = (tc) => {
  const ms = tcToMs(tc);
  return ms < 1000 ? `${ms.toFixed(ms < 10 ? 1 : 0)} ms` : `${(ms / 1000).toFixed(2)} s`;
};

/**
 * Slider definitions. Each slider maps to one generator (absolute override
 * mode); `toGen` converts the slider value to generator units, `fromGen`
 * initializes the slider from a zone value.
 */
export const SLIDERS = {
  vcaAttack: {
    label: "Attack",
    gen: GEN.VolEnvAttack,
    group: "ampEnv",
    min: 1,
    max: 20000,
    log: true,
    unit: "ms",
    toGen: (ms) => Math.round(msToTc(ms)),
    fromGen: (tc) => clamp(tcToMs(tc), 1, 20000),
    format: (ms) => tcToDisplayMs(msToTc(ms)),
  },
  vcaDecay: {
    label: "Decay",
    gen: GEN.VolEnvDecay,
    group: "ampEnv",
    min: 1,
    max: 20000,
    log: true,
    unit: "ms",
    toGen: (ms) => Math.round(msToTc(ms)),
    fromGen: (tc) => clamp(tcToMs(tc), 1, 20000),
    format: (ms) => tcToDisplayMs(msToTc(ms)),
  },
  vcaSustain: {
    label: "Sustain",
    gen: GEN.VolEnvSustain,
    group: "ampEnv",
    min: 0,
    max: 100,
    unit: "%",
    toGen: (pct) => Math.round(pctToCb(pct)),
    fromGen: (cb) => cbToPct(cb),
    format: (pct) => `${pct.toFixed(0)}%`,
  },
  vcaRelease: {
    label: "Release",
    gen: GEN.VolEnvRelease,
    group: "ampEnv",
    min: 1,
    max: 20000,
    log: true,
    unit: "ms",
    toGen: (ms) => Math.round(msToTc(ms)),
    fromGen: (tc) => clamp(tcToMs(tc), 1, 20000),
    format: (ms) => tcToDisplayMs(msToTc(ms)),
  },
  vcfAttack: {
    label: "Attack",
    gen: GEN.ModEnvAttack,
    group: "filterEnv",
    min: 1,
    max: 20000,
    log: true,
    unit: "ms",
    toGen: (ms) => Math.round(msToTc(ms)),
    fromGen: (tc) => clamp(tcToMs(tc), 1, 20000),
    format: (ms) => tcToDisplayMs(msToTc(ms)),
  },
  vcfDecay: {
    label: "Decay",
    gen: GEN.ModEnvDecay,
    group: "filterEnv",
    min: 1,
    max: 20000,
    log: true,
    unit: "ms",
    toGen: (ms) => Math.round(msToTc(ms)),
    fromGen: (tc) => clamp(tcToMs(tc), 1, 20000),
    format: (ms) => tcToDisplayMs(msToTc(ms)),
  },
  vcfSustain: {
    label: "Sustain",
    gen: GEN.ModEnvSustain,
    group: "filterEnv",
    min: 0,
    max: 100,
    unit: "%",
    toGen: (pct) => Math.round(pctToTenthPct(pct)),
    fromGen: (v) => tenthPctToPct(v),
    format: (pct) => `${pct.toFixed(0)}%`,
  },
  vcfRelease: {
    label: "Release",
    gen: GEN.ModEnvRelease,
    group: "filterEnv",
    min: 1,
    max: 20000,
    log: true,
    unit: "ms",
    toGen: (ms) => Math.round(msToTc(ms)),
    fromGen: (tc) => clamp(tcToMs(tc), 1, 20000),
    format: (ms) => tcToDisplayMs(msToTc(ms)),
  },
  vcfAmount: {
    label: "Env Amt",
    gen: GEN.ModEnv2FilterFc,
    group: "filterEnv",
    min: -4,
    max: 4,
    step: 0.05,
    unit: "oct",
    toGen: (oct) => Math.round(oct * 1200),
    fromGen: (cents) => clamp(cents / 1200, -4, 4),
    format: (oct) => `${oct >= 0 ? "+" : ""}${oct.toFixed(2)} oct`,
  },
  filterFc: {
    label: "Cutoff",
    gen: GEN.FilterFc,
    group: "filter",
    min: 20,
    max: 20000,
    log: true,
    unit: "Hz",
    toGen: (hz) => Math.round(hzToAbsCents(hz)),
    fromGen: (tc) => clamp(absCentsToHz(tc), 20, 20000),
    format: (hz) =>
      hz < 1000 ? `${hz.toFixed(0)} Hz` : `${(hz / 1000).toFixed(2)} kHz`,
  },
  filterQ: {
    label: "Reso",
    gen: GEN.FilterQ,
    group: "filter",
    min: 0,
    max: 96,
    unit: "dB",
    toGen: (db) => Math.round(dbToCb(db)),
    fromGen: (cb) => clamp(cbToDb(cb), 0, 96),
    format: (db) => `${db.toFixed(1)} dB`,
  },
};

export const SLIDER_KEYS = Object.keys(SLIDERS);
export const GROUP_GENS = {
  ampEnv: ["vcaAttack", "vcaDecay", "vcaSustain", "vcaRelease"].map(
    (k) => SLIDERS[k].gen
  ),
  filterEnv: ["vcfAttack", "vcfDecay", "vcfSustain", "vcfRelease", "vcfAmount"].map(
    (k) => SLIDERS[k].gen
  ),
  filter: ["filterFc", "filterQ"].map((k) => SLIDERS[k].gen),
};

// Zone editor: generator groups with human-readable names/units.
export const ZONE_GROUPS = [
  {
    name: "Sample / Addressing",
    gens: [
      ["SampleId", "sample"],
      ["StartAddrOfs", "samples"],
      ["EndAddrOfs", "samples"],
      ["StartLoopAddrOfs", "samples"],
      ["EndLoopAddrOfs", "samples"],
      ["StartAddrCoarseOfs", "×32k samples"],
      ["EndAddrCoarseOfs", "×32k samples"],
      ["StartLoopAddrCoarseOfs", "×32k samples"],
      ["EndLoopAddrCoarseOfs", "×32k samples"],
      ["SampleModes", "0-3"],
      ["OverrideRootKey", "MIDI"],
    ],
  },
  {
    name: "Pitch",
    gens: [
      ["CoarseTune", "semitones"],
      ["FineTune", "cents"],
      ["ScaleTune", "%"],
      ["Keynum", "MIDI/-1"],
      ["Velocity", "0-127/-1"],
    ],
  },
  {
    name: "Filter",
    gens: [
      ["FilterFc", "abscents"],
      ["FilterQ", "cB"],
    ],
  },
  {
    name: "Volume Envelope",
    gens: [
      ["VolEnvDelay", "timecents"],
      ["VolEnvAttack", "timecents"],
      ["VolEnvHold", "timecents"],
      ["VolEnvDecay", "timecents"],
      ["VolEnvSustain", "cB"],
      ["VolEnvRelease", "timecents"],
      ["Key2VolEnvHold", "tckey"],
      ["Key2VolEnvDecay", "tckey"],
      ["Attenuation", "cB"],
    ],
  },
  {
    name: "Modulation Envelope",
    gens: [
      ["ModEnvDelay", "timecents"],
      ["ModEnvAttack", "timecents"],
      ["ModEnvHold", "timecents"],
      ["ModEnvDecay", "timecents"],
      ["ModEnvSustain", "0.1%"],
      ["ModEnvRelease", "timecents"],
      ["Key2ModEnvHold", "tckey"],
      ["Key2ModEnvDecay", "tckey"],
      ["ModEnv2Pitch", "cents"],
      ["ModEnv2FilterFc", "cents"],
    ],
  },
  {
    name: "LFOs",
    gens: [
      ["ModLFOFreq", "abscents"],
      ["ModLFODelay", "timecents"],
      ["ModLFO2Pitch", "cents"],
      ["ModLFO2FilterFc", "cents"],
      ["ModLFO2Vol", "cB"],
      ["VibLFOFreq", "abscents"],
      ["VibLFODelay", "timecents"],
      ["VibLFO2Pitch", "cents"],
    ],
  },
  {
    name: "Ranges & Routing",
    gens: [
      ["KeyRange", "lo/hi"],
      ["VelRange", "lo/hi"],
      ["Pan", "-500..500"],
      ["ChorusSend", "0.1%"],
      ["ReverbSend", "0.1%"],
      ["ExclusiveClass", "0-127"],
    ],
  },
];

/** Human-friendly display of a raw generator value. */
export function formatGenValue(genName, value) {
  switch (genName) {
    case "FilterFc":
      return `${absCentsToHz(value) < 1000 ? absCentsToHz(value).toFixed(0) : (absCentsToHz(value) / 1000).toFixed(2) + "k"} Hz`;
    case "FilterQ":
      return `${cbToDb(value).toFixed(1)} dB`;
    case "VolEnvSustain":
    case "Attenuation":
      return `${(value / 10).toFixed(1)} dB`;
    case "ModEnvSustain":
      return `${(value / 10).toFixed(1)}%`;
    case "Pan":
      return value === 0 ? "center" : value < 0 ? `L${-value / 5}%` : `R${value / 5}%`;
    case "KeyRange":
    case "VelRange": {
      const lo = value & 0x7f;
      const hi = (value >> 8) & 0x7f;
      return `${lo}–${hi}`;
    }
    default:
      if (genName.includes("Env") || genName.includes("Delay") || genName === "ModLFOFreq" || genName === "VibLFOFreq") {
        if (genName.endsWith("Freq")) return `${absCentsToHz(value).toFixed(2)} Hz`;
        return tcToDisplayMs(value);
      }
      return String(value);
  }
}
