export const HZ_LIST = [31.25, 62.5, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
export const DEF_GAINS = [0.375, 0.375, 0.375, 0.375, 0.375, 0.375, 0, 0, 0, 0];
const convert_wnp_to_db = (k) => 31.5 - (k * 31.5) / 12;

export default class WinampEQ extends AudioWorkletNode {
  static async init(ctx) {
    await ctx.audioWorklet.addModule("./src/winamp-eq-proc.js");
  }
  constructor(ctx, options) {
    const opts = {
      processorOptions: {
        gains: DEF_GAINS,
        bands: HZ_LIST
      },
      ...options
    };
    super(ctx, "eq-proc", opts);
  }
  setGainAtFreq(channel, gain, freq, isDb = true) {
    if (!isDb) gain = convert_wnp_to_db(gain);
    for (let i = 0;i < HZ_LIST.length;i++) {
      if (HZ_LIST[i] < freq) continue;
      HZ_LIST[i] = freq;
      this.port.postMessage({i, freq, gain});
      break;
    }
  }
}