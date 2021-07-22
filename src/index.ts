import { load, Sf2Service } from "../sf2-service/read.js";
import { mkui } from "./ui.js";
import { newSFZoneMap } from "../sf2-service/zoneProxy.js";
import { s16ArrayBuffer2f32 } from "../sf2-service/s16tof32.js";
import { chart, mkcanvas } from "../chart/chart.js";

const uicontrols = mkui(document.querySelector("main"));
const [stdout, stderr] = [console.log, console.error];
let sf2service: Sf2Service;
let ctx: AudioContext;
let proc: AudioWorkletNode;
//let dup2: TransformStream;
const num_channels = 16;
const wavetable_size = 0x1000;
const wavetableBuffer = new SharedArrayBuffer(16 * wavetable_size * 8);
const waveTables = new Float32Array(wavetableBuffer);
const wasmURl = "spin-oscillators/build/wavetable_oscillator.wasm";
const procURL = "spin-oscillators/audio-thread.js";
const sf2URL = "./AegeanSymphonicOrchestra-SND.sf2";
function trap_block(target, event) {
  return new Promise((resolve) => target.addEventListener(event, resolve));
}

(async function _() {
  ctx = new AudioContext();

  //load and parse only the indice part of soundfont2 filter
  sf2service = await load(sf2URL);

  // 3d legrangian wasm lerp.
  // binary is loaded on main thread and then passed in the
  // processorOptions of AudioWorkletNode constructor to audio thread
  const wasmBinary = await fetch(wasmURl)
    .then((res) => res.arrayBuffer())
    .then((ab) => new Uint8Array(ab))
    .catch((e) => stderr(e.message + "fetch wasm error"));

  try {
    //coreaudio (or its pagan equivalent ) callback
    await ctx.audioWorklet.addModule(procURL);
  } catch (e) {
    alert("audioworklet error ");
    return;
  }
  stdout("wasmload");

  //16 channel processors
  proc = new AudioWorkletNode(ctx, "rendproc", {
    numberOfInputs: 0,
    numberOfOutputs: 16,
    outputChannelCount: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    processorOptions: {
      wasmBinary,
      wavetableBuffer,
    },
  });

  //wait for processor to signal ready
  // await trap_block(proc.port, "message");

  // proc.port.onmessage = ({ data: { oscState, channel } }) => {
  //   requestAnimationFrame(() => (uicontrols[channel].zone = oscState));
  // };
  // proc.onprocessorerror = (e) => stderr(e.toString());

  // dup2 = new TransformStream();
  // // @ts-ignore
  // proc.port.postMessage(
  //   {
  //     midiSignal: dup2.readable,
  //   },
  //   [dup2.readable]
  // );

  const gains = new Array(16).fill(new GainNode(ctx, { gain: 0 }));
  const mix = new GainNode(ctx);
  for (let i = 0; i < num_channels; i++) {
    proc.connect(gains[i], i, 0).connect(mix);
  }

  loadProgram(0, 44);
  let activeChan = 0;
  window.onkeydown = (e) => {
    const k = keys.indexOf(e.key);
    if (k < 0) return;

    const z = sf2service.noteOn(activeChan, k, 100);
    const releasefn = adsrSignal(gains[0].gain, z);
    addEventListener("keyup", releasefn, { once: true });
  };
})();
const hanning = function (n, points) {
  return 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / (points - 1));
};
type Zone = typeof newSFZoneMap;
async function loadProgram(channel, pid) {
  const wavetable = new SharedArrayBuffer(1024 * 1024);
  const waveTableFloatBuffer = new Float32Array(wavetable);
  let writeOffset = 0;
  const pref = sf2service.setProgram(pid, channel);
  if (!pref) return;
  console.log(pref);
  const r = sf2service.zoneSampleHeaders(pref);
  console.log(r);
  const { shdrMap, zMap } = r;
  if (!shdrMap || !zMap) return;
  for (const k of Object.keys(shdrMap)) {
    const shdr = shdrMap[k];
    if (!shdr) continue;
    aggShdrMap[k] = {};
    aggShdrMap[k].header = shdr;
  }
  let keyMap = {};
  const bufIdx = [];

  const zones: Zone[] = Object.values(zMap);
  while (zones.length) {
    const z = zones.shift();
    const [lo, hi] = [z.KeyRange & 0x007f, z.KeyRange >> 8];
    const [vlo, vhi] = [z.VelRange & 0x007f, z.VelRange >> 8];
    const sample = aggShdrMap[z.SampleId];
    const shdr = sample.header;

    let pcm = await downloadPCM(shdr);
    bufIdx.push({
      index: writeOffset,
      key: (lo + hi) / 2,
      vel: (vlo + vhi) / 2,
    });
    while (pcm.length >= N) {
      const tb = await mktbl(pcm.slice(0, N), shdr);
      console.assert(tb instanceof Float32Array && tb.length == N);
      waveTableFloatBuffer.set(tb, writeOffset);
      writeOffset += N;
      pcm = pcm.slice(3 * N);
    }
  }
  proc.port.postMessage({
    keyMap,
    wavetable,
  });
}
async function downloadPCM(shdr) {
  return fetch(shdr.url, { headers: { Range: shdr.range } })
    .then((res) => res.arrayBuffer())
    .then((ab) => s16ArrayBuffer2f32(ab));
}
async function mktbl(fl, shdr) {
  fl = fl.map((v, i) => hanning(i, N) * v);
  const c = new OfflineAudioContext(1, fl.length, shdr.sampleRate);
  const ab = ctx.createBuffer(1, fl.length, shdr.sampleRate);
  ab.getChannelData(0).set(fl.slice(0));
  const node = new AudioBufferSourceNode(c, {
    buffer: ab,
  });
  const waveform = new Float32Array(4096);
  const spectrum = new Float32Array(4096);

  const analy = new AnalyserNode(c, { fftSize: N });
  node.connect(analy).connect(c.destination);
  node.start();
  await c.startRendering();
  waveform.map((v, i) => hanning(i, N) * v);
  analy.getFloatTimeDomainData(waveform);
  analy.getFloatFrequencyData(spectrum);
  const c2 = new OfflineAudioContext(1, N, N);
  const osc = new OscillatorNode(c2, {
    frequency: 1,
    type: "custom",
    periodicWave: new PeriodicWave(c2, {
      imag: spectrum.slice(N / 2),
      real: waveform.slice(N / 2),
    }),
  });
  osc.connect(c2.destination);
  osc.start();
  return (await c2.startRendering()).getChannelData(0);
}
function adsrSignal(signal: AudioParam, zone: typeof newSFZoneMap) {
  const peak = 2 * Math.pow(10, zone.Attenuation * -0.05);
  const hold = Math.pow(2, zone.VolEnvHold / 1200);
  const delay = Math.pow(2, zone.VolEnvDelay / 1200);
  const attack = Math.pow(2, zone.VolEnvAttack / 1200);
  const decay = Math.pow(2, zone.VolEnvDecay / 1200);
  const sustain = Math.pow(10, (-1 * zone.VolEnvSustain) / 200);
  const releaset = Math.pow(10, (-1 * zone.VolRelease) / 200);

  signal.linearRampToValueAtTime(peak, ctx.currentTime + attack + delay);
  signal.setTargetAtTime(
    sustain,
    ctx.currentTime + attack + delay + hold + decay,
    0.5
  );
  return function release() {
    signal.exponentialRampToValueAtTime(
      0.000001,
      releaset + ctx.currentTime + 0.05
    );
  };
}
const n = 12,
  N = 4096;
let zoneInfoMap = {};
let channelZones = {};
let aggShdrMap = {};
function setProgram(pid, channel) {
  stdout("set program preset " + pid + " for ch: " + channel);
  const pref = sf2service.setProgram(pid, channel);
  channelZones[channel] = pref;
  if (!pref) return;
}
function stageNotes() {
  sf2service.getFont(0, 0, 55, 33);
}

export const keys = [
  "a",
  "w",
  "s",
  "e",
  "d",
  "f",
  "t",
  "g",
  "y",
  "h",
  "u",
  "j",
];

export const keyboardToFreq = (key) => {
  const idx = keys.indexOf(key);
  if (idx < 0) return null;
  const midi = 44 + idx;
  return midi; //  const midi = 44 + notesOfIndex[idx];
};
