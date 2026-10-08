let k, lpfmod;
/* global __BUILD_ID__ */
export class SpinNode extends AudioWorkletNode {
  static lpfmod;
  static async init(ctx) {
    try {
      await ctx.audioWorklet.addModule(`./spin/spin-proc.js?v=${__BUILD_ID__}`);
    } catch (e) {
      console.trace(e);
    }
  }
  static alloc(ctx) {
    if (!k) k = new SpinNode(ctx);
    return k;
  }
  constructor(ctx) {
    super(ctx, "spin-proc", {
      numberOfInputs: 1,
      numberOfOutputs: 16,
      outputChannelCount: Array(16).fill(2),
    });
    // Shipped-sample / zone caches, keyed per SoundFont URL so program
    // changes don't re-download what the worklet already holds.
    this._sf2url = null;
    this._sampleCache = new Map(); // url -> Set(sampleId)
    this._zoneCache = new Map(); // url -> Set("presetId:ref")
    this.port.onmessageerror = (e) => {
      const message = `[spin] worklet message error: ${e?.message ?? e}`;
      console.error(message);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("sf2rend-log", { detail: message })
        );
      }
    };
  }
  async shipProgram(sf2program, presetId) {
    const url = sf2program.url;
    if (this._sf2url !== url) {
      // New SoundFont: reset the worklet and drop ship caches.
      this.port.postMessage({ cmd: "reset" });
      this._sf2url = url;
    }
    let shippedSamples = this._sampleCache.get(url);
    if (!shippedSamples) {
      shippedSamples = new Set();
      this._sampleCache.set(url, shippedSamples);
    }
    let shippedZones = this._zoneCache.get(url);
    if (!shippedZones) {
      shippedZones = new Set();
      this._zoneCache.set(url, shippedZones);
    }
    const skipSampleIds = new Set(
      [...sf2program.sampleSet].filter((id) => shippedSamples.has(id))
    );
    await sf2program.fetch_drop_ship_to(this.port, { skipSampleIds });
    for (const id of sf2program.sampleSet) shippedSamples.add(id);
    await this.postZoneAttributes(sf2program, presetId, shippedZones);
  }
  async postZoneAttributes(sf2program, presetId, shippedZones) {
    const fresh = sf2program.zMap.filter(
      (z) => !shippedZones.has(presetId + ":" + z.ref)
    );
    if (!fresh.length) return;
    this.port.postMessage({
      presetId,
      zArr: fresh.map((z) => {
        const shz = new Int16Array(60);
        shz.set(z.arr);
        return {
          arr: shz.buffer,
          ref: z.ref,
        };
      }),
    });
    for (const z of fresh) shippedZones.add(presetId + ":" + z.ref);
  }
  handleMsg(e) {
    console.log(e.data);
  }
}
