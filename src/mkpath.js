import FFTNode from "../fft-64bit/fft-node.js";
import { LowPassFilterNode } from "../lpf/lpf.js";
import SF2Service from "../sf2-service/sf2.js";
import { SpinNode } from "../spin/spin.js";
import { midi_ch_cmds, midi_effects } from "./constants.js";
import { anti_denom_dither, delay } from "./misc.js";

let initialized = false;
const sf2Cache = new Map();

export async function mkpath(ctx, eventPipe) {
  const audioContext = ctx ?? new AudioContext();
  return mkpath2(audioContext, {
    midi_input: eventPipe ?? { postMessage() {} },
  });
}

export async function mkpath2(ctx, { midi_input = { postMessage() {} }, sf2File } = {}) {
  if (!initialized) {
    await SpinNode.init(ctx).catch(console.trace);
    await FFTNode.init(ctx).catch(console.trace);
    await LowPassFilterNode.init(ctx).catch(console.trace);
    initialized = true;
  }

  const channelIds = Array.from({ length: 16 }, (_, index) => index);
  const spinner = new SpinNode(ctx);
  const lpfs = channelIds.map(() => new LowPassFilterNode(ctx));
  const mastGain = new GainNode(ctx, { gain: 1 });
  const whitenoise = anti_denom_dither(ctx);
  const observers = new Set();
  const pending = new Set();
  const channelState = channelIds.map((id) => ({ id }));
  let fft = null;

  const emptyAnalysis = new Float64Array(0);

  whitenoise.connect(spinner);
  whitenoise.start();

  for (const channelId of channelIds) {
    spinner.connect(lpfs[channelId], channelId);
    lpfs[channelId].connect(mastGain);
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

  async function ensureSf2Loaded() {
    if (!sf2File) {
      return null;
    }
    if (!sf2Cache.has(sf2File)) {
      const sf2 = new SF2Service(sf2File);
      await sf2.load();
      sf2Cache.set(sf2File, sf2);
    }
    return sf2Cache.get(sf2File);
  }

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
    async loadProgram(pid, bankId) {
      const sf2 = await ensureSf2Loaded();
      if (!sf2) {
        return null;
      }
      const program = sf2.loadProgram(pid, bankId);
      await spinner.shipProgram(program, pid | bankId);
      return program;
    },
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
    setMasterGain(value) {
      mastGain.gain.linearRampToValueAtTime(value, ctx.currentTime + 0.05);
    },
    lowPassFilter_set_q(channelId, q) {
      lpfs[channelId].parameters
        .get("FilterQ_Cb")
        .linearRampToValueAtTime(q, ctx.currentTime + 0.05);
    },
    lowPassFilter_set_fc(channelId, fc) {
      lpfs[channelId].parameters
        .get("FilterFC")
        .linearRampToValueAtTime(fc, ctx.currentTime + 0.05);
    },
    silenceAll() {
      mastGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
    },
    async mute(channelId, muted) {
      await this.startAudio();
      const ramp = muted ? [80, 40, 0] : [40, 80, 110];
      while (ramp.length) {
        midi_input.postMessage([
          midi_ch_cmds.continuous_change | channelId,
          midi_effects.volumecoarse,
          ramp.shift(),
        ]);
        await delay(8);
      }
    },
    async startAudio() {
      if (ctx.state !== "running") {
        await ctx.resume();
      }
    },
  };
}
