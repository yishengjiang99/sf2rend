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

  constructor(ctx, { ref, pcm, loops }) {
    const sb = new SharedArrayBuffer(pcm.byteLength * 2 + 1024);
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
    this._zref = ref;
    this.pcm = new Float32Array(sb, 4 * Float32Array.BYTES_PER_ELEMENT);
    this.pcm_meta = new Uint32Array(sb, 0, 4);
    this.pcm_meta.set(new Uint32Array([1, loops[0], loops[1], pcm.byteLength]));
    this.port.postMessage({ pcm: pcm.buffer, loops }, [pcm.buffer]);
    console.log(this.pcm.length, "vs", pcm.length);
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
  set sample({ pcm, loops, zref }) {
    this._zref = zref;

    this.port.postMessage({ pcm: pcm.buffer }, [pcm.buffer]);
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
