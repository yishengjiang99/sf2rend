export class SpinNode extends AudioWorkletNode {
  static async init(ctx) {
    console.log(document.location);
    try {
      await ctx.audioWorklet.addModule("spin-proc.js");
    } catch (e) {
      await ctx.audioWorklet.addModule("sp2/spin-proc.js");
    }
  }
  constructor(ctx) {
    super(ctx, "spin-proc2", {
      numberOfInputs: 0,
      numberOfOutputs: 16,
      outputChannelCount: new Array(16).fill(2),
    });
  }
  async loadSample(url, shdr) {
    const res = await fetch(url, {
      headers: {
        Range: `bytes=${shdr.range.join("-")}`,
      },
    }).catch(console.error);
    this.port.postMessage(
      {
        segments: {
          originalPitch: shdr.originalPitch,
          sampleId: shdr.SampleId,
          nSamples: (shdr.range[1] + 1 - shdr.range[0]) / 2,
          loops: shdr.loops,
          sampleRate: shdr.sampleRate,
        },
        stream: res.body,
      },
      [res.body]
    );
    await res.closed;
  }
  async shipProgram(program, presetId) {
    await Promise.all(
      Object.values(program.shdrMap).map(async (shdr) =>
        this.loadSample(program.url, shdr)
      )
    );
    await this.postZoneAttributes(program, presetId);
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
}
