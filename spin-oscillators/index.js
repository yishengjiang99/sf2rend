import { upsampler } from "../upsampler/upsample.js";
import { s16ArrayBuffer2f32 } from "../s16tof32.js";
import { fftmod } from "../fft/FFT.js";
import { initlerpcheck } from "../lerpcheck/lerpcheck.js";
import { mkcanvas, chart, resetCanvas } from "../chart.js";
const n = 12,
  N = 4096;
export async function awncontroller(ctx, sf2service, stdout, stderr) {
  const fft = await fftmod(n);
  const lerpcheck = await initlerpcheck();
  lerpcheck.reset();
  const { upsample, heap } = upsampler();
  const zone = new SharedArrayBuffer(240 + 16 * 80);
  const midistate = new Uint8Array(zone, 0, 16 * 8);
  const [cavas, cavas2, cavas3] = [
    mkcanvas(document.querySelector("aside")),
    mkcanvas(document.querySelector("aside")),
    mkcanvas(document.querySelector("aside")),
  ];
  const oscState = new Uint8Array(zone, 240, 16 * 80);
  chart(cavas, oscState);
  const wasmBinary = new Uint8Array(
    await (
      await fetch("spin-oscillators/build/wavetable_oscillator.wasm")
    ).arrayBuffer()
  );
  try {
    await ctx.audioWorklet.addModule("spin-oscillators/audio-thread.js");
  } catch (e) {
    console.log(e);
    return;
  }
  //const mem = new WebAssembly.Memory({initial:180,maximum:180});
  const proc = new AudioWorkletNode(ctx, "rendproc", {
    numberOfInputs: 0,
    numberOfOutputs: 16,
    outputChannelCount: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    processorOptions: {
      zone: zone,
      wasmBinary,
    },
  });
  const gains = new Array(16).fill(new GainNode(ctx, { gain: 0 }));
  const mix = new GainNode(ctx);
  // proc.onmessage = (e) => stdout(JSON.stringify(e.data));
  proc.onprocessorerror = console.error;
  for (let i = 0; i < 16; i++) proc.connect(gains[i], i, 0).connect(mix);
  mix.connect(ctx.destination);
  const shdrTableIndex = {};
  proc.onmessage = ({ data: { tableIndex, shdrId } }) => {
    if (shdrId && tableIndex) {
      shdrTableIndex[shdrId] = shdrTableIndex[shdrId] || [];

      shdrTableIndex[shdrId].push(tableIndex);
    }
  };
  const { readable, writable } = new TransformStream();
  const renderQueue = [];

  async function renderloop() {
    //console.log(renderQueue.length);
    if (renderQueue.length) {
      resetCanvas(cavas);
      chart(cavas, renderQueue.shift());
    }
    if (renderQueue.length) {
      resetCanvas(cavas2);
      chart(cavas2, renderQueue.shift());
    }
    if (renderQueue.length) {
      resetCanvas(cavas2);
      chart(cavas3, renderQueue.shift());
    }
    requestAnimationFrame(renderloop);
  }

  renderloop();
  async function loadProgram(channel, pid) {
    stdout("set program preset " + pid + " for ch: " + channel);
    const pref = sf2service.setProgram(pid, channel);
    const iter = sf2service.zoneSampleHeaders(pref);
    for (const { shdr, zone } of iter) {
      stderr(zone.SampleId);
      if (shdr != null) {
        // const secondsPerPeriod = shdr.originalPitch, shdr.sampleRate
        await fetch(shdr.url, { headers: { Range: shdr.range } })
          .then((res) => res.arrayBuffer())
          .then((ab) => s16ArrayBuffer2f32(ab))
          .then((fl) => {
            const wvtb = new Float32Array(N);

            const upsample_gen = upsample(
              fl,
              shdr.originalPitch,
              shdr.sampleRate,
              wvtb
            );
            let i = 0;
            let lastfft;

            for (const _ of upsample_gen) {
              fft.inputPCM(wvtb);
              renderQueue.push(wvtb);
              const spec = fft.getFloatFrequencyData()[1].slice(0, 120);
              // console.log(spec.join(",  "));
              renderQueue.push(spec);
              renderQueue.push(fft.getWaveForm());
              proc.port.postMessage({
                wavetable: wvtb,
                shdrId: zone.SampleId,
              });
              renderQueue.push(wvtb);
              wvtb.fill(0);
              console.log(lerpcheck.inputBarFl(spec));
            }
          });
      }
    }
  }

  function keyOn(channel, midi, vel) {
    const zref = sf2service.keyOn(channel, midi, vel);
    const zone = sf2service.zref2Zone(zref);
    const tableIndices = shdrTableIndex[zone.SampleId];
    const peak = Math.pow(10, zone.Attenuation * -0.05);
    const hold = Math.pow(2, zone.VolEnvHold / 1200);
    const delay = Math.pow(2, zone.VolEnvDelay / 1200);
    const attack = Math.pow(2, zone.VolEnvAttack / 1200);
    const decay = Math.pow(2, zone.VolEnvDecay / 1200);
    const sustain = Math.pow(10, (-1 * zone.VolEnvSustain) / 200);
    midistate[channel * 4] = midi;
    midistate[channel * 4 + 1] = vel;
    gains[channel].gain.linearRampToValueAtTime(
      peak,
      ctx.currentTime + attack + delay
    );
    gains[channel].gain.setTargetAtTime(
      sustain,
      ctx.currentTime + attack + delay + hold + decay
    );
  }
  function keyOff(channel) {
    gains[channel].gain.cancelAndHoldAtTime(ctx.currentTime + 0.001);
    gains[channel].gain.setTargetAtTime(0, 0.3);
  }
  return {
    keyOn,
    keyOff,
    oscState,
    loadProgram,
  };
}
