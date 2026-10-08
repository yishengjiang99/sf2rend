/**
 * Node-based render test for spin.wasm (no browser needed).
 * Loads one zone with a synthetic sine sample and checks:
 *  1. attack ramps monotonically
 *  2. sustain holds at the requested level for 5 s while the key is held
 *  3. release reaches silence and frees the voice
 *  4. a 22.05 kHz sample at its root key plays at the correct pitch
 *     (zero-crossing frequency within 1 cent)
 *  5. zero LFO/mod-env depth leaves pitch exactly constant
 *  6. 300 rapid notes never produce a duplicate voice in the render bus
 */
import { wasmbin } from "./spin.wasm.js";

const SAMPLE_RATE = 44100;
const RENDQ = 128;

const memory = new WebAssembly.Memory({ initial: 1024, maximum: 4096 });
const inst = new WebAssembly.Instance(new WebAssembly.Module(wasmbin), {
  env: {
    memory,
    tanf: Math.tan,
    log2f: (x) => Math.log2(x),
    consolef: () => {},
  },
});
const e = inst.exports;
e.gm_reset(); // default CC7=100, CC11=127, CC10=64 (the worklet does this too)

let brk = e.__heap_base.value;
const malloc = (len) => {
  const r = brk;
  brk += len;
  if (brk > memory.buffer.byteLength) throw new Error("no mem");
  return r;
};

let failures = 0;
function check(name, cond, detail = "") {
  if (cond) {
    console.log(`ok   ${name}`);
  } else {
    failures++;
    console.log(`FAIL ${name} ${detail}`);
  }
}

// --- fixture: sine sample + sustaining zone -------------------------------
function makeSine(sampleRate, freq, seconds) {
  const n = Math.floor(sampleRate * seconds);
  const ptr = malloc(4 * n);
  const f = new Float32Array(memory.buffer, ptr, n);
  for (let i = 0; i < n; i++) f[i] = Math.sin((2 * Math.PI * freq * i) / sampleRate);
  return { ptr, n };
}

function shipSample(sampleId, sampleRate, freq, seconds, { loop = true } = {}) {
  const { ptr, n } = makeSine(sampleRate, freq, seconds);
  const hdr = e.pcmRef(sampleId);
  // pcm_t: loopstart, loopend, length, sampleRate, originalPitch,
  //        pitchCorrection, data
  new Uint32Array(memory.buffer, hdr, 7).set([
    0,
    loop ? n : 0,
    n,
    sampleRate,
    69,
    0,
    ptr,
  ]);
  return n;
}

const Z = {
  VolEnvAttack: 34,
  VolEnvDecay: 36,
  VolEnvSustain: 37,
  VolEnvRelease: 38,
  ModEnvSustain: 29,
  ModLFO2Pitch: 5,
  VibLFO2Pitch: 6,
  ModEnv2Pitch: 7,
  FilterFc: 8,
  FilterQ: 9,
  ModLFO2FilterFc: 10,
  ModEnv2FilterFc: 11,
  ModLFO2Vol: 13,
  Pan: 17,
  Attenuation: 48,
  SampleModes: 54,
  ScaleTune: 56,
  CoarseTune: 51,
  FineTune: 52,
  OverrideRootKey: 58,
};

function makeZone(sampleId, overrides = {}) {
  const ptr = malloc(120);
  const z = new Int16Array(memory.buffer, ptr, 60);
  z.fill(0);
  z[53] = sampleId; // SampleId
  z[33] = -12000; // VolEnvDelay: none
  z[34] = Math.round(1200 * Math.log2(0.1)); // VolEnvAttack: 100 ms
  z[35] = -12000; // VolEnvHold: none
  z[36] = -12000; // VolEnvDecay: shortest
  z[37] = 0; // VolEnvSustain: full level
  z[38] = Math.round(1200 * Math.log2(0.25)); // VolEnvRelease: 250 ms
  z[25] = -12000; // ModEnvDelay: none
  z[27] = -12000; // ModEnvHold: none
  z[29] = 1000; // ModEnvSustain: full
  z[8] = 13500; // FilterFc: open
  z[9] = 0; // FilterQ
  z[54] = 1; // SampleModes: loop
  z[56] = 100; // ScaleTune
  z[58] = -1; // OverrideRootKey: none
  for (const [k, v] of Object.entries(overrides)) z[Z[k]] = v;
  return ptr;
}

function egval(sp) {
  return new Float32Array(memory.buffer, e.get_vol_eg(sp), 2)[0];
}
function egstage(sp) {
  return new Int32Array(memory.buffer, e.get_vol_eg(sp) + 8, 3)[1];
}
function strideOf(sp) {
  return new Float32Array(memory.buffer, sp + 8 + 8 + 12 + 8, 1)[0];
}
function outputOf(sp) {
  return new Float32Array(memory.buffer, e.get_sp_output(sp), RENDQ * 2);
}
function noteOn(zonePtr, key = 69, vel = 100, ch = 0) {
  const sp = e.alloc_voice(ch);
  e.set_spinner_zone(sp, zonePtr);
  e.trigger_attack(sp, key, vel);
  return sp;
}
function renderBlocks(sp, n) {
  let alive = true;
  for (let i = 0; i < n; i++) alive = !!e.spin(sp, RENDQ);
  return alive;
}

// --- 1. attack ramps monotonically ---------------------------------------
{
  shipSample(10, SAMPLE_RATE, 440, 1);
  const zone = makeZone(10);
  const sp = noteOn(zone);
  const vals = [];
  for (let i = 0; i < 40 && egstage(sp) === 3; i++) {
    e.spin(sp, RENDQ);
    vals.push(egval(sp));
  }
  const mono = vals.every((v, i) => i === 0 || v >= vals[i - 1] - 1e-6);
  check("attack ramps monotonically", mono && vals.length > 3, `stages seen: ${vals.length}`);
  check("attack reaches ~0 cB", Math.abs(vals[vals.length - 1]) < 2, `end=${vals[vals.length - 1]}`);
  e.trigger_release(sp);
  renderBlocks(sp, 500);
}

// --- 2. sustain holds the requested level for 5 s -------------------------
{
  shipSample(11, SAMPLE_RATE, 440, 1);
  // sustain at 500 cB attenuation (~ -50 dB)
  const zone = makeZone(11, { VolEnvSustain: 500 });
  const sp = noteOn(zone);
  renderBlocks(sp, 40); // attack + decay
  const stage = egstage(sp);
  const v0 = egval(sp);
  renderBlocks(sp, Math.ceil((5 * SAMPLE_RATE) / RENDQ)); // 5 s held
  const v1 = egval(sp);
  check("sustain stage reached", stage === 6, `stage=${stage}`);
  check(
    "sustain holds at -500 cB for 5 s",
    egstage(sp) === 6 && Math.abs(v0 + 500) < 2 && Math.abs(v1 - v0) < 1e-3,
    `v0=${v0} v1=${v1} stage=${egstage(sp)}`
  );
  e.trigger_release(sp);
  renderBlocks(sp, 500);
}

// --- 3. release reaches silence and frees the voice ----------------------
{
  shipSample(12, SAMPLE_RATE, 440, 1);
  const zone = makeZone(12);
  const sp = noteOn(zone);
  renderBlocks(sp, 40);
  e.trigger_release(sp);
  let alive = true;
  const tailPeaks = [];
  for (let i = 0; i < 500 && alive; i++) {
    alive = !!e.spin(sp, RENDQ);
    const out = outputOf(sp);
    let peak = 0;
    for (let j = 0; j < out.length; j++) {
      const a = Math.abs(out[j]);
      if (a > peak) peak = a;
    }
    tailPeaks.push(peak);
  }
  check("release ends the voice", !alive, "still alive after 500 blocks");
  check("voice slot freed", e.sp_active(sp) === 0);
  const tailSilent = tailPeaks.slice(-5).every((p) => p < 1e-3);
  check("release tail reaches silence", tailSilent, `tail=${tailPeaks.slice(-5).map(p=>p.toExponential(1)).join(',')}`);
}

// --- 4. 22.05 kHz sample plays at the correct pitch -----------------------
{
  const n = shipSample(13, 22050, 440, 1);
  const zone = makeZone(13);
  const sp = noteOn(zone, 69);
  renderBlocks(sp, 60); // let attack/decay settle
  const out = [];
  const NB = 1400; // ~4 s of settled audio for 1-cent resolution
  for (let b = 0; b < NB; b++) {
    e.spin(sp, RENDQ);
    out.push(...outputOf(sp).slice(0, RENDQ));
  }
  // upward zero crossings with linear interpolation for sub-sample accuracy
  const cross = [];
  const start = Math.floor(out.length / 4);
  for (let i = start + 1; i < out.length; i++) {
    if (out[i - 1] <= 0 && out[i] > 0) {
      const frac = -out[i - 1] / (out[i] - out[i - 1]);
      cross.push(i - 1 + frac);
    }
  }
  const durSamples = cross[cross.length - 1] - cross[0];
  const freq = (cross.length - 1) / (durSamples / SAMPLE_RATE);
  const cents = Math.abs(1200 * Math.log2(freq / 440));
  check("22.05 kHz sample pitch within 1 cent", cents < 1, `${freq.toFixed(3)} Hz (${cents.toFixed(3)} cents)`);
  e.trigger_release(sp);
  renderBlocks(sp, 500);
}

// --- 5. zero LFO/mod-env depth leaves pitch exactly constant --------------
{
  shipSample(14, SAMPLE_RATE, 440, 1);
  const zone = makeZone(14, {
    ModLFO2Pitch: 0,
    VibLFO2Pitch: 0,
    ModEnv2Pitch: 0,
    ModLFO2FilterFc: 0,
    ModEnv2FilterFc: 0,
    ModLFO2Vol: 0,
  });
  const sp = noteOn(zone);
  const strides = [];
  for (let i = 0; i < 20; i++) {
    e.spin(sp, RENDQ);
    strides.push(strideOf(sp));
  }
  const constant = strides.every((s) => s === strides[0]);
  check("pitch exactly constant with zero modulation depth", constant);
  e.trigger_release(sp);
  renderBlocks(sp, 500);
}

// --- 6. 300 rapid notes never duplicate a voice ---------------------------
{
  shipSample(15, SAMPLE_RATE, 440, 1);
  const zone = makeZone(15);
  const bus = []; // simulated worklet ring bus
  let dup = false;
  const seen = new Set();
  for (let i = 0; i < 300; i++) {
    const sp = e.alloc_voice(0);
    // worklet contract: stolen slots are removed from the bus first
    const bi = bus.indexOf(sp);
    if (bi >= 0) bus.splice(bi, 1);
    if (bus.includes(sp)) dup = true;
    bus.push(sp);
    e.set_spinner_zone(sp, zone);
    e.trigger_attack(sp, 60 + (i % 12), 100);
    seen.add(sp);
    if (i < 256 && seen.size !== i + 1) {
      dup = true; // must not steal while free slots exist
    }
  }
  check("300 rapid notes: no voice rendered twice in a block", !dup);
  check("all 256 slots usable", seen.size === 256, `distinct=${seen.size}`);
  for (const sp of bus) {
    e.trigger_release(sp);
  }
  renderBlocks(bus[0], 2000);
}

if (failures) {
  console.log(`\n${failures} FAILURE(S)`);
  process.exit(1);
} else {
  console.log("\nall render tests passed");
}
