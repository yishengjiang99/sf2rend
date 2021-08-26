import { downloadData } from "../fetch-drop-ship/download.js";
import { SharedRiffPipe } from "../srp/shared-riff-pipe.js";
import { spRef2json } from "./spin-struct.js";
const CH_META_LEN = 24;
const nchannels = 32;
const REND_BLOCK = 128;

/* eslint-disable no-unused-vars */
class SpinProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    const {
      processorOptions: { rendSb, statusBuffer, wasm },
    } = options;
    this.pipe = new SharedRiffPipe(statusBuffer);
    this.outputSnap = new Float32Array(rendSb);
    this.memory = new WebAssembly.Memory({
      maximum: 1024,
      initial: 1024,
      shared: true,
    });
    this.inst = new WebAssembly.Instance(new WebAssembly.Module(wasm), {
      env: { memory: this.memory },
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
          spId * 4 * Float32Array.BYTES_PER_ELEMENT,
        4
      );

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
    } else if (data.egRelease) {
      const { channel } = data.egRelease;
      this.inst.exports.eg_release(this.spinners[channel]);
    }
  }
  async loadsdta(data) {
    const {
      segments: { sampleId, nSamples, loops },
      stream,
    } = data;
    const offset = this.malololc(4 * nSamples);
    const fl = new Float32Array(this.memory.buffer, offset, nSamples);
    await downloadData(stream, fl);
    this.sdtaRef(sampleId).set(
      new Uint32Array([loops[0], loops[1], nSamples, offset])
    );
  }

  instantiate(zone, i) {
    this.spinners[i] = this.inst.exports.newSpinner(zone, i);
    const spIO = new Uint32Array(this.memory.buffer, this.spinners[i], 12);
    this.outputs[i] = new Float32Array(this.memory.buffer, spIO[1], 128 * 2);
    return this.spinners[i];
  }
  checkmsgs() {
    if (this.pipe.hasMsg) {
      this.pipe.read().forEach((msg) => {
        switch (msg.fourcc) {
          case 0xb0:
          case 0x00b0: {
            const [channel, metric, value] = msg.chunk;
            this.inst.exports.set_midi_cc_val(channel, metric, value);

            break;
          }
          case 0x0080: {
            const [channel] = msg.chunk;
            this.inst.exports.eg_release(this.spinners[channel]);
            break;
          }
          case 1:
          case 0x0090:
            {
              const [channel, zoneRef, ratio, velocity] = msg.chunk;
              if (!this.presetRefs[zoneRef]) {
                console.error("preset not found zoneref " + zoneRef);
                return;
              }
              if (!this.spinners[channel]) {
                this.instantiate(this.presetRefs[zoneRef], channel);
              }
              this.inst.exports.trigger_attack(
                this.spinners[channel],
                this.presetRefs[zoneRef],
                ratio / 0x00ff,
                velocity
              );
            }
            break;
          default:
            break;
        }
      });
    }
  }
  process(inputs, o, parameters) {
    this.checkmsgs();
    for (let i = 0; i < nchannels; i++) {
      // const volegstage = this.egstates(i)[0];
      //if (volegstage < 1 || volegstage > 5) continue;

      if (!this.spinners[i]) continue;
      if (!this.outputs[i]) continue;
      // if (!o[i]) continue;
      for (let j = 0; j < 128 * 2; j++) this.outputs[i][j] = 0;
      this.inst.exports.spin(this.spinners[i], 128);
      const multiplier = i == 9 ? 1 : 1;
      for (let j = 0; j < 128; j++) {
        o[0][0][j] += this.outputs[i][2 * j] * multiplier;
        o[0][1][j] += this.outputs[i][2 * j + 1] * multiplier;
      }
      new Promise((r) => r()).then(() => {
        this.outputSnap.set(
          this.outputs[i].filter((v, b) => b % 2 == 1),
          i * REND_BLOCK,
          REND_BLOCK
        );
      });
    }
    return true;
  }
}
registerProcessor("spin-proc", SpinProcessor);
