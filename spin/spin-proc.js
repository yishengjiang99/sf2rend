import { downloadData } from "../fetch-drop-ship/download.js";
import saturate from "../saturation/index.js";
import { wasmbin } from "./spin.wasm.js";
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
    } else if (data.zArr) {
      for (const { arr, ref } of data.zArr) {
        this.setZone(ref, arr); //.set
      }
      this.port.postMessage({ zack: 1 });
    } else if (data.cmd) {
      switch (data.cmd) {
        case "reset":
          this.brk = this.inst.exports.__heap_base;
        //fallthrough
        case "panic":
          this.inst.exports.gm_reset();
          break;
        case "newZone":
          this.setZone(data.zone.ref, data.zone.arr);
          this.port.postMessage({ ack: 1 });

          break;
      }
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
          this.inst.exports.eg_release(channel);
          this.port.postMessage({ ack: [0x80, channel] });
          break;
        case 1:
        case 0x0090:
          {
            const [zoneRef, ratio, velocity] = args;
            if (!this.presetRefs[zoneRef]) {
              return;
            }
            if (!this.spinners[channel]) {
              this.instantiate(channel);
            }
            let ch = channel;
            this.eg_vol_stag[ch] = 1;
            this.inst.exports.reset(this.spinners[ch]);
            this.inst.exports.trigger_attack(
              this.spinners[ch],
              this.presetRefs[zoneRef],
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
  setZone(ref, arr) {
    const ptr = this.malololc(120);
    this.presetRefs[ref] = ptr;
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
    console.log("instant sp", i);
    this.spinners[i] = this.inst.exports.newSpinner(i);
    const spIO = new Uint32Array(this.memory.buffer, this.spinners[i], 3);
    this.spState[i] = new Uint32Array(
      this.memory.buffer,
      this.spinners[i] + 12,
      4
    );

    this.outputs[i] = new Float32Array(this.memory.buffer, spIO[1], 128 * 2);
    return this.spinners[i];
  }

  process(inputs, outputs, parameters) {
    for (let i = 0; i < 32; i++) {
      const chid = Math.floor(i / 2);
      // if (this.eg_vol_stag[i] === 9999) continue;
      if (!this.spinners[i]) continue;
      if (!this.outputs[i]) continue;

      this.eg_vol_stag[i] = this.inst.exports.spin(this.spinners[i], 128);
      for (let j = 0; j < 128; j++) {
        outputs[chid][0][j] += saturate(this.outputs[i][2 * j]);
        outputs[chid][1][j] += saturate(this.outputs[i][2 * j + 1]);
      }
    }
    new Promise((r) => r()).then(() => {
      this.port.postMessage({ egStages: this.eg_vol_stag });
    });
    return true;
  }
}
registerProcessor("spin-proc", SpinProcessor);
