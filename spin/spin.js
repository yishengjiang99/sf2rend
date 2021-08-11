let wasmbin = null;
export class SpinNode extends AudioWorkletNode {
  static async init(ctx) {
    await ctx.audioWorklet.addModule(
      document.location.pathname + "/spin/spin-proc.js"
    );
    if (!wasmbin)
      wasmbin = await fetch(document.location.pathname + "./spin/spin.wasm")
        .then((res) => res.arrayBuffer())
        .then((ab) => new Uint8Array(ab));
  }

  constructor(ctx) {
    super(ctx, "spin-proc", {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      processorOptions: {
        wasm: wasmbin,
      },
    });
  }

  get stride() {
    return this.parameters.get("stride").value;
  }
  get strideParam() {
    return this.parameters.get("stride"); //.value;
  }
  set stride(ratio) {
    this.parameters.get("stride").setValueAtTime(ratio, 0.001);
  }
  set sample({ pcm, loops, zref, shdr, zone }) {
    this._zref = zref;
    this.shdr = shdr;
    this.port.postMessage(
      { pcm: pcm.buffer, loops, zref, shId: zone.SampleId },
      [pcm.buffer]
    );
  }
  get zref() {
    return this._zref;
  }
}
export async function mkspinner(ctx, pcm, loops) {
  const sp = new SpinNode(ctx, pcm, loops);

  sp.connect(ctx.destination);
  return sp;
}
