import { Osc } from "./osc.js";
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
    const { oscs, instance, setWaveTable, sampleTableRef } =
      init_wasm(wasmBinary);
    this.oscs = oscs;
    this.instance = instance;
    this.setWaveTable = setWaveTable;
    this.port.onmessage = this.onmsg.bind(this);
    //this.watchUpdate()
  }
  onmsg({ data: { wavetable, shdrId } }) {
    if (wavetable && shdrId) {
      this.setWaveTable(wavetable, shdrId);
    }
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
