let wasmbin;
export class SpinNode extends AudioWorkletNode {
  static async init(ctx, sb, loopStart, loopEnd) {
    await ctx.audioWorklet.addModule("./spin-proc.js");
    wasmbin = await fetch("spin.wasm")
      .then((res) => res.arrayBuffer())
      .then((ab) => new Uint8Array(ab));
    return new SpinNode(ctx, { sb, loopStart, loopEnd });
  }

  constructor(ctx, { sb, loopStart, loopEnd }) {
    super(ctx, "spin-proc", {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      processorOptions: {
        sb,
        loopStart,
        loopEnd,
        wasm: wasmbin,
      },
    });
    this.sb = sb;
  }
  get stride() {
    return this.parameters.get("stride").value;
  }
  set stride(ratio) {
    this.parameters
      .get("stride")
      .setValueAtTime(
        ratio,
        this.context.currentTime + this.context.baseLatency
      );
  }
  set fl32(fl) {
    new Float32Array(this.sb).set(fl);
    this.port.postMessage("sync");
  }
}
