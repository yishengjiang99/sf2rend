import {
  getWorker,
  requestDownload,
} from "../fetch-drop-ship/fetch-drop-ship.js";

let wasm = null;
const CH_META_LEN = 24;
const RENDER_BLOCK = 128;
const N_CHANNELS = 32;
let k;
export class SpinNode extends AudioWorkletNode {
  static async init(ctx) {
    await ctx.audioWorklet.addModule(
      document.location.pathname.replace("/spin", "") + "./spin/spin-proc.js"
    );
    if (!wasm) {
      const res = await fetch(
        document.location.pathname.replace("/spin", "") + "./spin/spin.wasm"
      );
      const ab = await res.arrayBuffer();
      wasm = new Uint8Array(ab);
    }
  }
  static alloc(ctx) {
    if (!k) k = new SpinNode(ctx);
    return k;
  }
  constructor(ctx, presetZones, sampleHeaders) {
    const sb = new SharedArrayBuffer(
      CH_META_LEN * N_CHANNELS * Uint32Array.BYTES_PER_ELEMENT +
        RENDER_BLOCK * N_CHANNELS * Float32Array.BYTES_PER_ELEMENT
    );
    super(ctx, "spin-proc", {
      numberOfInputs: 16,
      numberOfOutputs: 16,
      outputChannelCount: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      processorOptions: { sb, wasm },
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
    if (!(zone.SampleModes == 1)) {
      loops = [0, zone.shdr.byteLength];
    }
    const pitchRatio =
      channel == 9 ? 1 : zone.calcPitchRatio(key, this.context.sampleRate);
    pcmMeta.set(
      new Uint32Array([
        2,
        channel,
        zone.SampleId,
        loops[0],
        loops[1],
        zone.ref,
        pitchRatio * 0xffff,
      ])
    );
  }
  keyOff(channel) {}

  async shipProgram(sf2program, presetId) {
    requestDownload(this.fetchWorker, sf2program, this.port);
    const ack = await new Promise((resolve) => {
      this.fetchWorker.addEventListener("message", function ({ data }) {
        //  console.log("shipping ", presetId, "ack", data);
        if (data.ack) {
          resolve(data.ack);
        }
      });
    });
    await this.postZoneAttributes(sf2program, presetId);
  }
  async postZoneAttributes(sf2program, presetId) {
    this.fetchWorker.postMessage({
      presetId,
      zArr: sf2program.zMap.map((z) => {
        const shz = new Int16Array(60);
        shz.set(z.arr);
        return {
          arr: shz.buffer,
          ref: z.ref,
        };
      }),
    });
    const zAck = await new Promise((resolve) => {
      this.fetchWorker.addEventListener("message", function ({ data }) {
        //  console.log("shipping ", presetId, "ack", data);
        if (data.zack) {
          resolve(data.zack);
        }
      });
    });
    console.assert(this.fetchWorker.onmessage == null);
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
