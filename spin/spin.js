import { requestDownload } from "../fetch-drop-ship/fetch-drop-ship.js";
let k;

export class SpinNode extends AudioWorkletNode {
  static async init(ctx) {
    await ctx.audioWorklet.addModule("spin/spin-proc.js");
  }
  static alloc(ctx) {
    if (!k) k = new SpinNode(ctx);
    return k;
  }
  constructor(ctx, numberOfOutputs = 1) {
    super(ctx, "spin-proc", {
      numberOfInputs: 0,
      numberOfOutputs,
      outputChannelCount: new Array(16).fill(2),
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
