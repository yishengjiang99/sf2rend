function init_wasm(wasmBinary) {
  const mem = new WebAssembly.Memory({ initial: 180, maximum: 180 });
  let heap = new Uint8Array(mem.buffer);
  const table = new WebAssembly.Table({ element: "anyfunc", initial: 10 });
  const importObj = {
    env: {
      memory: mem,
      sinf: (x) => Math.sin(x),
      powf: (base, exp) => Math.pow(base, exp),
      table,
    },
  };
  const mod = new WebAssembly.Module(wasmBinary);
  const instance = new WebAssembly.Instance(mod, importObj);
  return init_ctx({ heap, instance });
}
class Osc {
  constructor(heap, ref) {
    this.struct = new DataView(heap.buffer, ref, 80);
    this.ref = ref;
    this.output_arr = new Float32Array(
      heap.buffer,
      this.struct.getUint32(0, true),
      128
    );
  }

  get output() {
    return this.output_arr;
  }
  get phase() {
    return this.struct.getUint32(8, true);
  }
  set phase(fl) {
    this.struct.setUint32(8, fl, true);
  }
  get phaseIncrement() {
    return this.struct.getInt32(12, true);
  }
  set phaseIncrement(fl) {
    this.struct.setInt32(12, fl, true);
  }
  set midi(m) {
    this.phaseIncrement =
      (0xfffffffe / 48000) * 440 * Math.pow(2, (m - 69) / 12);
  }
  get phaseVelocity() {
    return this.struct.getInt32(16, true);
  }
  set phaseVelocity(fl) {
    this.struct.setInt32(16, fl, true);
  }
  get fadeDim1() {
    return this.struct.getFloat32(32, true);
  }
  set fadeDim1(fl) {
    this.struct.setFloat32(32, fl, true);
  }
  get fadeDim1Increment() {
    return this.struct.getFloat32(36, true);
  }
  set fadeDim1Increment(fl) {
    this.struct.setFloat32(36, fl, true);
  }
  get fadeDim2() {
    return this.struct.getFloat32(40, true);
  }
  set fadeDim2(fl) {
    this.struct.setFloat32(40, fl, true);
  }
  set fadeDim2Increment(fl) {
    this.struct.setFloat32(40, fl, true);
  }
  get fadeDim3() {
    return this.struct.getFloat32(44, true);
  }
  set fadeDim3Increment(fl) {
    this.struct.setFloat32(44, fl, true);
  }

  //these are pointers to float array. hence the uint32's
  get wave000() {
    return this.struct.getUint32(48, true);
  }
  get wave001() {
    return this.struct.getUint32(52, true);
  }
  get wave010() {
    return this.struct.getUint32(56, true);
  }
  get wave011() {
    return this.struct.getUint32(60, true);
  }
  get wave100() {
    return this.struct.getUint32(64, true);
  }
  get wave101() {
    return this.struct.getUint32(68, true);
  }
  get wave110() {
    return this.struct.getUint32(72, true);
  }
  get wave111() {
    return this.struct.getUint32(76, true);
  }
  set wave000(ref) {
    this.struct.setUint32(48, ref, true);
  }
  set wave001(ref) {
    this.struct.setUint32(52, ref, true);
  }
  set wave010(ref) {
    this.struct.setUint32(56, ref, true);
  }
  set wave011(ref) {
    this.struct.setUint32(60, ref, true);
  }
  set wave100(ref) {
    this.struct.setUint32(64, ref, true);
  }
  set wave101(ref) {
    this.struct.setUint32(68, ref, true);
  }
  set wave110(ref) {
    this.struct.setUint32(72, ref, true);
  }
  set wave111(ref) {
    this.struct.setUint32(76, ref, true);
  }
}

function init_ctx({ heap, instance }) {
  const osc_ref = instance.exports.init_oscillators();
  const osc_struct_size = instance.exports.wavetable_struct_size();
  const oscs = [];
  const chref = (ch) => osc_ref + osc_struct_size * ch;
  for (let i = 0; i < 16; i++) {
    oscs.push(new Osc(heap, chref(i)));
  }
  return {
    instance,
    heap,
    spin: instance.exports.spin,
    sampleTableRef: instance.exports.sampleTableRef,
    setWaveTable: (flarr, tableIndex) => {
      heap.set(flarr, instance.exports.sampleTableRef(tableIndex));
    },
    oscs,
  };
}

class RendProc extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    const { zone, wasmBinary } = options.processorOptions;

    this.channelMidiState = new Uint8Array(zone, 0, 16 * 8);
    this.updated = new Int32Array(zone, 16 * 8, 2);
    this.oscState = new Uint8Array(zone, 100, 16 * 80);
    const { oscs, instance, sampleTableRef } = init_wasm(wasmBinary);
    this.oscs = oscs;
    this.instance = instance;
    //this.watchUpdate()
  }
  watchUpdate() {
    while (Atomics.wait(this.updated, 0, -1) == "ok") {
      const ch = Atomics.exchange(this.updated, 0, 0);
      this.oscs[ch].midi = this.channelMidiState[8 * ch];
      this.oscs[ch].fadeDim1 = this.channelMidiState[8 * ch + 1];
      //this.oscs[ch].wave000 = this.
    }
  }
  process(inputs, outputs) {
    for (let i = 0; i < 1; i++) {
      const midistate = this.channelMidiState[8 * i];

      this.oscs[i].midi = this.channelMidiState[8 * i];
      this.oscs[i].fadeDim1 = this.channelMidiState[8 * i + 1];
      //	this.oscs[i].fadeDim2 = midistate[2]/128;
    }
    this.instance.exports.spin();

    for (let i = 0; i < 1; i++) {
      outputs[i][0].set(this.oscs[i].output);
      outputs[i][1].set(this.oscs[i].output);
      this.oscState[i].set(this.oscs[i].struct);
    }

    return true;
  }
}

registerProcessor("rendproc", RendProc);
