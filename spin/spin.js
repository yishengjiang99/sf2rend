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

  constructor(ctx, { zone, pcm, shdr }) {
    const sb = new SharedArrayBuffer(
      Math.max(pcm.byteLength * 2, 1 << 16) + 1024
    );
    super(ctx, "spin-proc", {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      processorOptions: {
        sb,
        wasm: wasmbin,
      },
    });
    this.sb = sb;
    this.shRef = shdr.hdrRef;
    this.zone = zone;
    this.pcm = new Float32Array(sb, 1024);
    this.pcm_meta = new Uint32Array(sb, 0, 4);
    this.pcm_meta.set(
      new Uint32Array([1, shdr.loops[0], shdr.loops[1], pcm.byteLength])
    );
    this.pcm.set(pcm);
    // if(egPortzone.postMessage({});
  }
  reset() {
    this.pcm_meta[0] = 2;
  }
  despose() {
    this.pcm_meta[0] = -1;
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
  set sample({ zone, pcm, shdr }) {
    this.pcm_meta.set(
      new Uint32Array([1, shdr.loops[0], shdr.loops[1], pcm.byteLength])
    );
    this.shRef = shdr.hdrRef;
    this.pcm.set(pcm);
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
