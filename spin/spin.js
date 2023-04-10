let k;
export class SpinNode extends AudioWorkletNode {
  static async init(ctx) {
    try {
      await ctx.audioWorklet.addModule("spin/spin-proc.js");

    } catch (e) {
      try {

        const spurl = URL.createObjectURL(new Blob([document.querySelector("script[type=worklet]").textContent], {type: "text/javascript"}));
        await ctx.audioWorklet.addModule(spurl);

      } catch (e) {
        console.log(e);
        try {
          await ctx.audioWorklet.addModule("spin/spin-proc.js");

        } catch (e) {
          console.trace(e)
        }
      }
    }
  }
  static alloc(ctx) {
    if (!k) k = new SpinNode(ctx);
    return k;
  }
  constructor(ctx) {
    super(ctx, "spin-proc", {
      numberOfInputs: 1,
      numberOfOutputs: 3,
      outputChannelCount: [2, 1, 1]
    });
    this.port.onmessageerror = (e) => alert("adfasfd", e.message); // e; // e.message;
  }

  keyOn(channel, zone, key, vel) {
    this.port.postMessage([
      0x90,
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
