import FFTNode from "../fft-64bit/fft-node.js";
import { SpinNode } from "../spin/spin.js";
import { midi_ch_cmds, midi_effects } from "./constants.js";
import { anti_denom_dither, delay } from "./misc.js";

// audioWorklet.addModule is per AudioContext: track initialized contexts,
// not a module-level boolean (StrictMode remount / HMR / re-init after
// close would otherwise fail with "node name not defined").
const initializedContexts = new WeakSet();

export async function mkpath(ctx, eventPipe) {
  const audioContext = ctx ?? new AudioContext();
  return mkpath2(audioContext, {
    midi_input: eventPipe ?? { postMessage() {} },
  });
}

function rampParam(ctx, param, value, timeConstant = 0.03) {
  const now = ctx.currentTime;
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.linearRampToValueAtTime(value, now + timeConstant);
}

export async function mkpath2(ctx, { midi_input = { postMessage() {} } } = {}) {
  if (!initializedContexts.has(ctx)) {
    await SpinNode.init(ctx).catch(console.trace);
    await FFTNode.init(ctx).catch(console.trace);
    initializedContexts.add(ctx);
    // Debug hook for the smoke test (tools/smoke-test.mjs): there is no API
    // to list registered AudioWorklet processors, so record the expected set.
    globalThis.__sf2rendWorklets = ["spin-proc", "lpf-proc", "proc-fft"];
  }

  const channelIds = Array.from({ length: 16 }, (_, index) => index);
  const spinner = new SpinNode(ctx);
  // Per-channel mute gain (mute/solo live here, never by ramping CC7).
  const muteGains = channelIds.map(() => new GainNode(ctx, { gain: 1 }));
  const mastGain = new GainNode(ctx, { gain: 1 });
  const whitenoise = anti_denom_dither(ctx);
  const observers = new Set();
  const pending = new Set();
  const channelState = channelIds.map((id) => ({ id }));
  let fft = null;

  const emptyAnalysis = new Float64Array(0);

  whitenoise.connect(spinner);
  whitenoise.start();

  // Per-voice SF2 filtering happens inside the worklet; no post-mix LPF.
  for (const channelId of channelIds) {
    spinner.connect(muteGains[channelId], channelId);
    muteGains[channelId].connect(mastGain);
  }

  try {
    fft = new FFTNode(ctx);
    mastGain.connect(fft).connect(ctx.destination);
  } catch (error) {
    console.warn("FFT analysis unavailable; falling back to direct output.", error);
    mastGain.connect(ctx.destination);
  }

  spinner.port.onmessage = ({ data }) => {
    for (const watch of Array.from(pending)) {
      if (watch.predicate(data)) {
        clearTimeout(watch.timeoutId);
        pending.delete(watch);
        watch.resolve(data);
      }
    }
    observers.forEach((observer) => observer(data));
  };

  function waitFor(predicate, timeoutMs = 2000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        pending.delete(watch);
        reject(new Error("Timed out waiting for synth response."));
      }, timeoutMs);
      const watch = { predicate, resolve, timeoutId };
      pending.add(watch);
    });
  }

  return {
    spinner,
    channelState,
    connect(destination, outputNumber, destinationInputNumber) {
      spinner.connect(destination, outputNumber, destinationInputNumber);
    },
    get msgPort() {
      return spinner.port;
    },
    get analysis() {
      return {
        get waveForm() {
          return fft?.getWaveForm() ?? emptyAnalysis;
        },
        get frequencyBins() {
          return fft?.getFloatFrequencyData() ?? emptyAnalysis;
        },
      };
    },
    observeMessages(observer) {
      observers.add(observer);
      return () => observers.delete(observer);
    },
    async querySpState(channelId) {
      spinner.port.postMessage({ query: channelId });
      return waitFor((data) => Boolean(data.queryResponse), 500);
    },
    async subscribeNextMsg(predicate) {
      return waitFor(predicate);
    },
    /** Per-channel generator override (inspector sliders); absolute mode. */
    setChannelGen(channelId, gen, value) {
      spinner.port.postMessage({ cmd: "setGen", channel: channelId, gen, value });
      return waitFor(
        (data) =>
          data.ack === "setGen" &&
          data.channel === channelId &&
          data.gen === gen,
        500
      ).catch(() => null);
    },
    clearChannelGen(channelId, gen) {
      spinner.port.postMessage({ cmd: "clearGen", channel: channelId, gen });
    },
    /** Zone editor write: same WASM memory the voices read. */
    setZone(presetId, ref, arr) {
      spinner.port.postMessage({ cmd: "setZone", presetId, ref, arr });
      return waitFor(
        (data) =>
          data.ack === "setZone" &&
          data.presetId === presetId &&
          data.ref === ref,
        2000
      );
    },
    setMasterGain(value) {
      rampParam(ctx, mastGain.gain, value);
    },
    /** Mute by gain, not by ramping CC7: the volume slider is untouched. */
    setMuted(channelId, muted) {
      rampParam(ctx, muteGains[channelId].gain, muted ? 0 : 1, 0.01);
    },
    silenceAll() {
      rampParam(ctx, mastGain.gain, 0, 0.05);
    },
    async startAudio() {
      if (ctx.state !== "running") {
        await ctx.resume();
      }
    },
  };
}
