import {
  getWorker,
  requestDownload,
} from "../fetch-drop-ship/fetch-drop-ship.js";

let wasmbin = null;
const CH_META_LEN = 12;
const RENDER_BLOCK = 128;
const N_CHANNELS = 32;
let k;
export class SpinNode extends AudioWorkletNode {
  static async init(ctx) {
    await ctx.audioWorklet.addModule(
      document.location.pathname + "./spin/spin-proc.js"
    );
    if (!wasmbin) {
      wasmbin = await fetch(document.location.pathname + "./spin/spin.wasm")
        .then((res) => res.arrayBuffer())
        .then((ab) => new Uint8Array(ab));
    }
  }
  static alloc(ctx) {
    if (!k) k = new SpinNode(ctx);
    return k;
  }
  constructor(ctx) {
    const sb = new SharedArrayBuffer(
      CH_META_LEN * N_CHANNELS * Uint32Array.BYTES_PER_ELEMENT +
        RENDER_BLOCK * N_CHANNELS * Float32Array.BYTES_PER_ELEMENT
    );
    super(ctx, "spin-proc", {
      numberOfInputs: 16,
      numberOfOutputs: 16,
      outputChannelCount: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      processorOptions: {
        sb,
        wasm: wasmbin,
      },
    });
    this.sb = sb;
    this.f32view = new Float32Array(this.sb, 0, CH_META_LEN * N_CHANNELS);
    this.u32view = new Uint32Array(this.sb, 0, CH_META_LEN * N_CHANNELS);
    const outputSampleStart =
      CH_META_LEN * N_CHANNELS * Uint32Array.BYTES_PER_ELEMENT;
    this.output_floats = new Float32Array(this.sb, outputSampleStart);
    this.fetchWorker = getWorker(this.port);
    // if(egPortzone.postMessage({});
  }

  keyOn(channel, zone, key, vel) {
    let updateOffset = 0;
    const pcmMeta = this.u32view;
    while (pcmMeta[updateOffset] != 0) updateOffset += CH_META_LEN;
    let loops = zone.shdr.loops;
    if (!(zone.SampleModes == 1 && loops[1] - loops[0] > 8)) {
      loops = [0, zone.shdr.byteLength / 2];
    }
    pcmMeta.set(
      new Uint32Array([2, channel, zone.SampleId, loops[0], loops[1]])
    );
    this.f32view.set(
      new Float32Array([
        channel == 9 ? 1 : zone.calcPitchRatio(key, this.context.sampleRate),
        0,
        0.2,
        1 / this.context.sampleRate / Math.pow(2, zone.VolEnvAttack / 1200),
      ]),
      updateOffset + 5
    );
  }
  async shipProgram(sf2program) {
    requestDownload(this.fetchWorker, sf2program, this.port);
    return await new Promise((resolve) => {
      this.fetchWorker.addEventListener(
        "message",
        function ({ data }) {
          if (data.ack) resolve(data.cak);
        },
        { once: true }
      );
    });
  }
  handleMsg(e) {
    console.log(e.data);
  }
  get outputSnapshot() {
    return this.output_floats;
  }
}
export async function mkspinner(ctx, pcm, loops) {
  const sp = new SpinNode(ctx, pcm, loops);

  sp.connect(ctx.destination);
  return sp;
}
