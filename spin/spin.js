import { requestDownload } from "../fetch-drop-ship/fetch-drop-ship.js";
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
    await ctx.audioWorklet.addModule(basename() + "spin/spin-proc.js");
  }
  static alloc(ctx) {
    if (!k) k = new SpinNode(ctx);
    return k;
  }
  constructor(ctx) {
    super(ctx, "spin-proc", {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    });
  }

  keyOn(channel, zone, key, vel) {
    this.port.postMessage([
      0x0090,
      channel,
      zone.ref,
      zone.calcPitchRatio(key, this.context.sampleRate),
      vel,
    ]);
  }
  keyOff(channel, key, vel) {
    this.port.postMessage([0x80, channel, key, vel]);
  }

  async shipProgram(sf2program, presetId) {
    await requestDownload(sf2program, this.port);
    await this.postZoneAttributes(sf2program, presetId);
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
}
