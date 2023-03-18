import { downloadData } from "../fetch-drop-ship/download.js";
import saturate from "../saturation/index.js";
import { wasmbin } from "./spin.wasm.js";

/* eslint-disable no-unused-vars */
class SpinProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
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
    this.brk = 0x30000;
    this.malololc = (len) => {
      const ret = this.brk;
      this.brk += len;
      if (this.brk > this.memory.buffer.byteLength) throw "no mem";
      return ret;
    };
    this.sdtaRef = (spId) =>
      new Uint32Array(
        this.memory.buffer,
        this.inst.exports.pcms.value +
          spId * 6 * Float32Array.BYTES_PER_ELEMENT,
        6
      );
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
  }
  async handleMsg(e) {
    const { data } = e;
    if (data.stream && data.segments) {
      await this.loadsdta(data);
    } else if (data.zArr) {
      for (const { arr, ref } of data.zArr) {
        const ptr = this.malololc(120);
        this.presetRefs[ref] = ptr;
        new Int16Array(this.memory.buffer, ptr, 60).set(
          new Int16Array(arr, 0, 60)
        ); //.set
      }
      this.port.postMessage({ zack: 1 });
    } else {
      const [cmd, channel, ...args] = data;
      switch (cmd) {
        case 0xb0:
        case 0x00b0:
          const [metric, value] = args;
          this.inst.exports.set_midi_cc_val(channel, metric, value);
          break;
        case 0x80:
        case 0x0080: {
          const [velocity] = args;
          this.inst.exports.eg_release(this.spinners[channel]);
          break;
        }
        case 1:
        case 0x0090:
          {
            const [zoneRef, ratio, velocity] = args;
            if (!this.presetRefs[zoneRef]) {
              return;
            }
            if (!this.spinners[channel]) {
              this.instantiate(this.presetRefs[zoneRef], channel);
            }
            this.inst.exports.reset(this.spinners[channel]);
            this.inst.exports.trigger_attack(
              this.spinners[channel],
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

  instantiate(zone, i) {
    this.spinners[i] = this.inst.exports.newSpinner(i);
    const spIO = new Uint32Array(this.memory.buffer, this.spinners[i], 2);
    this.outputs[i] = new Float32Array(this.memory.buffer, spIO[1], 128 * 2);
    return this.spinners[i];
  }

  process(inputs, outputs, parameters) {
    for (let i = 0; i < outputs.length; i++) {
      if (!this.spinners[i]) continue;
      if (!this.outputs[i]) continue;
      this.inst.exports.spin(this.spinners[i], 128);
      for (let j = 0; j < 128; j++) {
        outputs[i][0][j] = this.outputs[i][2 * j];
        outputs[i][1][j] = this.outputs[i][2 * j + 1];
      }
    }
    // for (let j = 0; j < 128; j++) {
    //   o[0][0][j] = saturate(o[0][0][j]);
    //   o[0][1][j] = saturate(o[0][1][j]);
    // }
    // if (
    //   o[0][0][15] > 0.00000001 ||
    //   o[0][0][44] > 0.00000001 ||
    //   o[0][0][66] > 0.00000001 ||
    //   o[0][0][22] > 0.00000001
    // ) {
    //   const pcmplayback = new Float32Array(128 * 32);
    //   pcmplayback.set(this.outputfff);
    //   //round-about way to async invoke msg port when less verbose method unavailable in audioworklet scope
    //   //thank god for my 21st century laptop for accommodating a horrendously inefficient way to do this
    //   new Promise((r) => r()).then(() =>
    //     this.port.postMessage({ pcmplayback: pcmplayback })
    //   );
    // }
    return true;
  }
}
registerProcessor("spin-proc", SpinProcessor);
