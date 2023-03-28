import saturate from "../saturation/index.js";
import { wasmbin } from "./spin.wasm.js";
import { egStruct, spRef2json } from "./spin-structs.js";
async function downloadData(stream, fl) {
  for (let v of fl) v = 0;
  const reader = stream.getReader();
  let writeOffset = 0;
  let leftover;
  const decode = function (s1, s2) {
    const int = s1 + (s2 << 8);
    return int > 0x8000 ? -(0x10000 - int) / 0x8000 : int / 0x7fff;
  };
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      await stream.closed;
      break;
    }
    if (!value) continue;
    let readIndex = 0;

    if (leftover != null) {
      fl[writeOffset++] = decode(leftover, value[readIndex++]);
      leftover = null;
    }
    const n = ~~value.length;
    while (readIndex < n - 2) {
      fl[writeOffset++] = decode(value[readIndex++], value[readIndex++]);
    }
    if (readIndex < value.length - 1) leftover = value[value.length - 1];
    console.assert(readIndex + 1 == value.length || leftover != null);
  }
}
class SpinProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    this.setup_wasm();
    this.inst.exports.gm_reset();
    this.sampleIdRefs = [];
    this.presetRefs = [];
    this.port.onmessage = this.handleMsg.bind(this);
    this.spinners = [];
    this.outputs = [];
    this.dv = [];
    this.midiccRef = new Uint8Array(
      this.memory.buffer,
      this.inst.exports.midi_cc_vals,
      128 * 16
    );
    this.outputfff = new Float32Array(
      this.memory.buffer,
      this.inst.exports.outputs.value,
      128 * 32
    );
    this.spState = new Array(32);
    this.port.postMessage({ init: 1 });
    this.eg_vol_stag = new Array(32).fill(0);
  }
  sdtaRef(sampleId) {
    return new Uint32Array(
      this.memory.buffer,
      this.inst.exports.pcms.value +
        sampleId * 6 * Float32Array.BYTES_PER_ELEMENT
    );
  }

  setup_wasm() {
    this.memory = new WebAssembly.Memory({
      maximum: 1024 * 4,
      initial: 1024 * 4,
    });
    let lastfl;
    const imports = {
      memory: this.memory,
      debugFL: (fl) => {
        if (!lastfl || fl != lastfl) {
          lastfl = fl;
        }
      },
    };
    this.inst = new WebAssembly.Instance(new WebAssembly.Module(wasmbin), {
      env: imports,
    });
    this.brk = this.inst.exports.__heap_base;
    this.malololc = (len) => {
      const ret = this.brk;
      this.brk += len;
      if (this.brk > this.memory.buffer.byteLength) throw "no mem";
      return ret;
    };
  }

  ch_occupied(ch) {
    return this.eg_vol_stag[ch] && this.eg_vol_stag[ch] < 99;
  }
  async handleMsg(e) {
    const { data } = e;
    if (data.stream && data.segments) {
      await this.loadsdta(data);
      this.port.postMessage({ zack: 2 });
    } else if (data.zArr && data.presetId !== null) {
      for (const { arr, ref } of data.zArr) {
        this.setZone(ref, arr, data.presetId); //.set
      }
      this.port.postMessage({ zack: 1 });
    } else if (data.cmd) {
      switch (data.cmd) {
        case "reset":
          this.brk = this.inst.exports.__heap_base;
        //fallthrough
        case "panic":
          this.inst.exports.silence_all();
          break;
        case "newZone":
          this.setZone(data.zone.ref, data.zone.arr);
          this.port.postMessage({ ack: 1 });

          break;
      }
    } else if (data.query) {
      const ref = this.inst.exports.spRef(parseInt(data.query));
      const spinfo = spRef2json(this.memory.buffer, ref);
      const egInfo = egStruct(
        this.memory.buffer,
        this.inst.exports.get_vol_eg(ref)
      );
      this.port.postMessage({
        queryResponse: {
          spinfo,
          egInfo,
        },
      });
    } else {
      const [cmd, channel, ...args] = data;
      const [metric, value] = args;
      switch (cmd) {
        case 0xb0:
        case 0x00b0:
          this.inst.exports.set_midi_cc_val(channel, metric, value);
          break;
        case 0x80:
        case 0x0080:
          this.inst.exports.trigger_release(channel);
          this.port.postMessage({ ack: [0x80, channel] });
          break;
        case 1:
        case 0x0090:
          {
            const [ratio, velocity, [presetId, zoneRef]] = args;
            const zonePtr = this.presetRefs[presetId]?.[zoneRef];
            if (!zonePtr) {
              console.error("cannot find present zoneref", presetId, zoneRef);
              return;
            }
            if (!this.spinners[channel]) {
              this.instantiate(channel);
            }
            let ch = channel;
            this.inst.exports.reset(this.spinners[ch]);
            this.inst.exports.set_spinner_zone(this.spinners[ch], zonePtr);
            this.inst.exports.trigger_attack(
              this.spinners[ch],
              ratio,
              velocity
            );
          }
          break;
        default:
          break;
      }
    }
  }
  setZone(ref, arr, presetId) {
    const ptr = this.malololc(120);
    if (!this.presetRefs[presetId]) {
      this.presetRefs[presetId] = {};
    }
    this.presetRefs[presetId][ref] = ptr;
    new Int16Array(this.memory.buffer, ptr, 60).set(new Int16Array(arr, 0, 60));
  }

  async loadsdta(data) {
    const {
      segments: { sampleId, nSamples, loops, originalPitch, sampleRate: sr },
      stream,
    } = data;
    const offset = this.malololc(4 * nSamples);
    const fl = new Float32Array(this.memory.buffer, offset, nSamples);
    await downloadData(stream, fl);
    this.sdtaRef(sampleId).set(
      new Uint32Array([loops[0], loops[1], nSamples, sr, originalPitch, offset])
    );
  }

  instantiate(i) {
    this.spinners[i] = this.inst.exports.newSpinner(i);
    const spIO = new Uint32Array(this.memory.buffer, this.spinners[i], 3);
    this.spState[i] = new Uint32Array(
      this.memory.buffer,
      this.spinners[i] + 12,
      4
    );
    this.spinners[i];
    // this.dv[i] = new DataView(
    //   this.memory.buffer,
    //   this.spinners[i],
    //   this.inst.exports.sp_byte_len
    // );
    //console.log(this.dv[i]);

    //queueMicrotask(() => this.port.postMessage({ sp: i, dv: this.dv[i] }));

    this.outputs[i] = new Float32Array(this.memory.buffer, spIO[1], 128 * 2);
    return this.spinners[i];
  }

  process(inputs, outputs, parameters) {
    for (let i = 0; i < 32; i++) {
      const chid = Math.floor(i / 2);
      if (!this.spinners[i]) continue;
      if (!this.outputs[i]) continue;
      for (let j = 0; j < 128 * 2; j++) {
        this.outputs[i][j] = 0;
      }
      this.eg_vol_stag[i] = this.inst.exports.spin(this.spinners[i], 128);
      if (this.eg_vol_stag[i] == 99) delete this.spinners[i];
      for (let j = 0; j < 128; j++) {
        outputs[chid][0][j] += saturate(this.outputs[i][2 * j]);
        outputs[chid][1][j] += saturate(this.outputs[i][2 * j + 1]);
      }
    }
    if (!this.lastReport || globalThis.currentTime - this.lastReport > 0.2) {
      new Promise((r) => r()).then(() => {
        this.lastReport = globalThis.currentTime;
        const ref = this.inst.exports.spRef(0);
        const spinfo = spRef2json(this.memory.buffer, ref);
        const egInfo = egStruct(
          this.memory.buffer,
          this.inst.exports.get_vol_eg(ref)
        );
        this.port.postMessage({
          queryResponse: {
            now: now(),
            spinfo,
            egInfo,
            egStags: this.eg_vol_stag,
          },
        });
      });
    }
    return true;
  }
}
registerProcessor("spin-proc", SpinProcessor);
function now() {
  return globalThis.currentTime;
}
