import {wasmbin} from "./spin.wasm.js";
import {downloadData} from "./download.js";
const range = (x, y) =>
  Array.from(
    (function* _(x, y) {
      while (x < y) yield x++;
    })(x, y)
  );
export function mkSpinnerBYOW({instance, malloc, memory}) {
  const exports = instance.exports;
  const heap = memory.buffer;
  const pcmRef = (idx) => instance.exports.pcmRef(idx);
  const spRef = (idx) => exports.spRef(idx);
  const zoneRef = (k) => exports.zoneRef(k);
  const zoneArray = (k) => new Int16Array(heap, zoneRef(k), 60);
  const spinners = range(0, 32)
    .map((i) => spRef(i))
    .map((ptr) => new DataView(heap, ptr, exports.sp_byte_len()));

  const sampleHeader = (sampleId) => new Uint32Array(heap, pcmRef(sampleId), 6);
  return {
    ...instance.exports,
    instance,
    malloc,
    memory,
    spinners,
    sampleHeader,
    setZoneAttribute(index, attr, value) {
      const register = new DataView(heap, exports.zoneRef(index), attr * 20, 2);
      register.setInt16(0, value, true);
    },
    getZone(index) {
      return zoneArray(index);
    },
    setZone(index, zone) {
      zoneArray(index).set(zone);
    },

    zoneRef,
    ccvals: new Uint8Array(
      memory.buffer,
      instance.exports.midi_cc_vals.value,
      128 * 16
    ),
    loadSampleData: function ({header, segments, data, stream}) {
      header = header || segments; //backword compatiblity
      const {nSamples, loops, originalPitch, sr} = header;
      const offset = this.malloc(4 * nSamples);
      const floatArray = new Float32Array(heap, offset, nSamples);
      if (data) floatArray.set(data);
      else if (stream) downloadData(data, floatArray);
      const sampleHeader = sampleHeader(header.sampleId);
      sampleHeader.set(
        new Uint32Array([
          loops[0],
          loops[1],
          nSamples,
          sr,
          originalPitch,
          offset,
        ])
      );
      return header.sampleId;
    },
  };
}
export async function mkspinner() {
  return mkSpinnerBYOW(await mkWasm());
}

export async function mkWasm() {
  const memory = new WebAssembly.Memory({
    maximum: 1024,
    initial: 1024,
  });
  const mod = await WebAssembly.compile(wasmbin);
  const instance = await WebAssembly.instantiate(mod, {
    env: {
      memory,
      tanf: Math.tan,
      logf: console.log,
      consolef: (f) => console.log("--->", f),
    }
  });
  let brk = 0x30000;
  function malloc(len) {
    const ret = brk;
    brk += len;
    if (brk > memory.buffer.byteLength) throw "no mem";
    return ret;
  }
  return {instance, malloc, memory};
}
