import {
  getWorker,
  requestDownload,
} from "../fetch-drop-ship/fetch-drop-ship.js";

let wasmbin = null;
const CH_META_LEN = 12;
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
    const sb = new SharedArrayBuffer(CH_META_LEN * 16 * 4);
    super(ctx, "spin-proc", {
      numberOfInputs: 0,
      numberOfOutputs: 16,
      outputChannelCount: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      processorOptions: {
        sb,
        wasm: wasmbin,
      },
    });
    this.sb = sb;
    this.f32view = new Float32Array(this.sb);
    this.u32view = new Uint32Array(this.sb);
    this.fetchWorker = getWorker(this.port);
    // if(egPortzone.postMessage({});
  }
  reset() {
    this.pcm_meta[0] = 2;
  }
  despose() {
    this.pcm_meta[0] = -1;
  }

  keyOn(channel, zone, key, vel) {
    let updateOffset = 0;
    const pcmMeta = this.u32view;
    console.log(pcmMeta);
    while (pcmMeta[updateOffset] != 0) updateOffset += CH_META_LEN;
    let loops = zone.shdr.loops;
    if (!(zone.SampleModes == 1 && loops[1] - loops[0] > 255)) {
      loops = [-1, zone.shdr.byteLength / 2];
    }
    pcmMeta.set(
      new Uint32Array([1, channel, zone.SampleId, loops[0], loops[1]])
    );
    this.f32view.set(
      new Float32Array([
        zone.calcPitchRatio(key, this.context.sampleRate),
        0,
        0.1,
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
  set sample({ channel, shdr, stride }) {
    this.pcm_meta.set(
      new Int32Array([stride, shdr.loops[0], shdr.loops[1], shdr.hdrRef]),
      channel * CH_META_LEN
    );
    this.shRef = shdr.hdrRef;
  }
  get shref() {
    return this.shRef;
  }
  get flsize() {
    return this.pcm.byteLength;
  }
}
export async function mkspinner(ctx, pcm, loops) {
  const sp = new SpinNode(ctx, pcm, loops);

  sp.connect(ctx.destination);
  return sp;
}
