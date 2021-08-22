import {
  getWorker,
  requestDownload,
} from "../fetch-drop-ship/fetch-drop-ship.js";
import { SharedRiffPipe } from "../srp/shared-riff-pipe.js";
let wasm = null;
const CH_META_LEN = 24;
const RENDER_BLOCK = 128;
const N_CHANNELS = 32;
let k;
function basename() {
  const root = document.location.pathname.split("/sf2rend")[0];
  return root + "/sf2rend/";
}
export class SpinNode extends AudioWorkletNode {
  static async init(ctx) {
    console.log(basename() + "spin/spin-proc.js");

    await ctx.audioWorklet.addModule(basename() + "spin/spin-proc.js");
    if (!wasm) {
      const res = await fetch(basename() + "spin/spin.wasm");
      const ab = await res.arrayBuffer();
      wasm = new Uint8Array(ab);
    }
  }
  static alloc(ctx) {
    if (!k) k = new SpinNode(ctx);
    return k;
  }
  constructor(ctx) {
    const rendSb = new SharedArrayBuffer(
      RENDER_BLOCK * N_CHANNELS * Float32Array.BYTES_PER_ELEMENT
    );
    const pipe = new SharedRiffPipe(1 << 12);

    super(ctx, "spin-proc", {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      processorOptions: {
        rendSb,
        wasm,
        statusBuffer: pipe.array.buffer,
      },
    });
    this.rendSb = rendSb;
    this.pipe = pipe;
  }

  keyOn(channel, zone, key, vel) {
    this.pipe.send(
      0x0090,
      new Uint32Array([
        channel,
        zone.SampleId,
        zone.shdr.loops[0],
        zone.shdr.loops[1],
        zone.ref,
        zone.calcPitchRatio(key, this.context.sampleRate) * 0xffff,
      ]).buffer
    );
  }
  keyOff(channel, key, vel) {
    this.pipe.send(0x0080, new Uint32Array([channel]).buffer);
  }

  async shipProgram(sf2program, presetId) {
    await requestDownload(sf2program, this.port);
    console.log("resolve dl");
    await this.postZoneAttributes(sf2program, presetId);
    console.log("resolve st");
  }
  async postZoneAttributes(sf2program, presetId) {
    this.port.postMessage({
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
