import { downloadData } from "../fetch-drop-ship/download.js";
import saturate from "../saturation/index.js";
import { wasmbin } from "./spin.wasm.js";
const n_midi_channels = 16;
const n_voices = 16 * 4;
const EG_STAGES = {
  INIT: 0,
  DELAY: 1,
  ATTACK: 2,
  HOLD: 3,
  DECAY: 4,
  RELEASE: 5,
  DONE: 99,
};

class SpinProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    this.setup_wasm();

    this.active_voices = [];
    this.inst.exports.gm_reset();
    this.sampleIdRefs = [];
    this.presetRefs = [];
    this.port.onmessage = this.handleMsg.bind(this);
    this.spinners = [];
    this.outputs = [];
    this.midiccRef = new Uint8Array(
      this.memory.buffer,
      this.inst.exports.midi_cc_vals,
      128 * n_midi_channels
    );
    this.outputfff = new Float32Array(
      this.memory.buffer,
      this.inst.exports.outputs.value,
      128 * n_voices
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
    const imports = {
      memory: this.memory,
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
    return this.eg_vol_stag[ch] && this.eg_vol_stag[ch] < 6;
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
            console.log("trr att ", channel, ratio, velocity);
            if (!this.presetRefs[zoneRef]) {
              return;
            }
            if (!this.spinners[channel]) {
              this.instantiate(channel);
            }
            let ch = channel;
            this.inst.exports.reset();
            this.inst.exports.trigger_attack(
              spinner,
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
      if (!this.spinners[i]) continue;
      if (!this.outputs[i]) continue;
      for (let j = 0; j < 128 * 2; j++) {
        this.outputs[i][j] = 0;
      }
      for (let j = 0; j < 128; j++) {
        outputs[chid][0][j] += saturate(this.outputs[i][2 * j]);
        outputs[chid][1][j] += saturate(this.outputs[i][2 * j + 1]);
      }
    }
    new Promise((r) => r()).then(
      this.port.postMessage({ egStages: this.eg_vol_stag })
    );

    // if (
    //   outputs[0][15] > 0.00000001 ||
    //   outputs[0][44] > 0.00000001 ||
    //   outputs[0][66] > 0.00000001 ||
    //   outputs[0][22] > 0.00000001
    // ) {
    //   const pcmplayback = new Float32Array(128 * 32);
    //   pcmplayback.set(this.outputfff);
    //   new Promise((r) => r()).then(() =>
    //     this.port.postMessage({ pcmplayback: pcmplayback })
    //   );
    // }
    return true;
  }
}
registerProcessor("spin-proc", SpinProcessor);
