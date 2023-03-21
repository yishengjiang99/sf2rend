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
    this.port.postMessage({ init: 1 });
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
    const mdoule = new WebAssembly.Module(wasmbin)
    this.inst = new WebAssembly.Instance(mdoule,{env:imports});
    this.brk = 0x30000;
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
        const ptr = this.malololc(120);
        this.presetRefs[ref] = ptr;
        new Int16Array(this.memory.buffer, ptr, 60).set(
          new Int16Array(arr, 0, 60)
        );
      }
      this.port.postMessage({ zack: 1 });
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
          break;
        case 1:
        case 0x0090:
          {
            const [zoneRef, ratio, velocity] = args;
            if (!this.presetRefs[zoneRef]) {
              return;
            }
            const spinner = this.inst.exports.get_available_spinner(channel);
            this.active_voices.push([spinner, channel]);
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

  process(inputs, outputs, parameters) {
    let sp_to_run=[];
    for(let i=0; i<this.active_voices.length; i++){
      const [spinner,channel]=this.active_voices[i];
      const eg_stage = this.inst.exports.spin(spinner, 128);
      var rendered = new Float32Array(this.memory.buffer, (spinner+32), 128*2);
      if(eg_stage>=EG_STAGES.DONE){
        this.active_voices.splice(i,1);
        this.inst.exports.set_available(spinner);
      }
      for (let j = 0; j < 128; j++) {
        outputs[channel][0][j] += rendered[2 * j];
        outputs[channel][1][j] += rendered[2 * j + 1];
      }
    }9
    this.active_voices.push(sp_to_run)
    return true;
  }
}
registerProcessor("spin-proc", SpinProcessor);
