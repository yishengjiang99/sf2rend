let wasmbin = null,
  workletADded = false;

export class SpinNode extends AudioWorkletNode {
  static async init(ctx, sb, loopStart, loopEnd) {
    if (wasmbin && workletADded)
      return new SpinNode(ctx, { sb, loopStart, loopEnd });
    await ctx.audioWorklet.addModule("./spin/spin-proc.js");
    workletADded = true;
    wasmbin = await fetch("./spin/spin.wasm")
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
export async function mkspinner(ctx, fl32, preroll) {
  const sb = new SharedArrayBuffer(
    fl32.byteLength + preroll.byteLength + 16 * 4
  );
  const sdta = new Float32Array(sb);
  sdta.set(fl32, 0, fl32.length);
  sdta.set(preroll);

  const sp = await SpinNode.init(
    ctx,
    sb,
    preroll.length,
    preroll.length + fl32.length
  ); //then((sp) => {
  sp.connect(ctx.destination);
  return sp;
}
