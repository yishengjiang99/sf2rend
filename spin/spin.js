
let k, lpfmod;
export class SpinNode extends AudioWorkletNode {
  static lpfmod;
  static async init(ctx) {
    try {
      await ctx.audioWorklet.addModule("./spin/spin-proc.js");
      //lpfmod = await WebAssembly.compile(lpfModule.wasmbin);
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
      numberOfOutputs: 20,
      outputChannelCount: [...Array(18).fill(2), 1, 1]
    });
    this.port.onmessageerror = (e) => alert("adfasfd", e.message); // e; // e.message;
  }
  async shipProgram(sf2program, presetId) {
    await sf2program.fetch_drop_ship_to(this.port);
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
