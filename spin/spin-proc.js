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
    this.outputSnap = new Float32Array(rendSb, REND_BLOCK * nchannels * 2);
    this.memory = new WebAssembly.Memory({ maximum: 1024, initial: 1024 });
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
    this.sampleIdRefs = [];
    this.presetRefs = [];
    this.port.onmessage = this.handleMsg.bind(this);
    this.spinners = [];
    this.outputs = [];
    this.strides = [];
    this.egRefs = [];

    this.egstates = (channel) =>
      new Int32Array(this.memory.buffer, this.egRefs[channel], 1);
  }
  async handleMsg(e) {
    const { data } = e;
    if (data.stream && data.segments) {
      // segments: {
      //   sampleId: shdr.SampleId,
      //   nSamples: (shdr.range[1] + 1 - shdr.range[0]) / 2,
      // },
      // stream: res.body,
      const {
        segments: { sampleId, nSamples },
        stream,
      } = data;
      const offset = this.malololc(4 * nSamples);
      const fl = new Float32Array(this.memory.buffer, offset, nSamples);
      await downloadData(stream, fl);
      this.sampleIdRefs[sampleId] = offset;
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
  instantiate(zone, i) {
    this.spinners[i] = this.inst.exports.newSpinner(zone, i);
    const spIO = new Uint32Array(this.memory.buffer, this.spinners[i], 12);
    this.outputs[i] = new Float32Array(this.memory.buffer, spIO[1], 128 * 2);
    this.strides[i] = spIO[6];
    this.egRefs[i] = spIO[11];
    return this.spinners[i];
  }
  process(inputs, o, parameters) {
    if (this.pipe.hasMsg) {
      this.pipe.read().forEach((msg) => {
        switch (msg.fourcc) {
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
              const [channel, sampleId, loopstart, loopend, zoneRef, ratio] =
                msg.chunk;
              if (!this.presetRefs[zoneRef]) {
                console.error("preset not found zoneref " + zoneRef);
                return;
              }
              if (!this.spinners[channel]) {
                this.instantiate(this.presetRefs[zoneRef], channel);
              }

              this.inst.exports.set_attrs(
                this.spinners[channel],
                this.sampleIdRefs[sampleId],
                loopstart,
                loopend,
                this.presetRefs[zoneRef],
                ratio / 0xffff
              );
            }
            break;
          default:
            break;
        }
      });
    }
    for (let i = 0; i < 16; i++) {
      // const volegstage = this.egstates(i)[0];
      //if (volegstage < 1 || volegstage > 5) continue;

      if (!this.spinners[i]) continue;
      if (!this.outputs[i]) continue;
      // if (!o[i]) continue;
      for (let j = 0; j < 128 * 2; j++) this.outputs[i][j] = 0;
      this.inst.exports.spin(this.spinners[i], 128);

      for (let j = 0; j < 128; j++) {
        o[0][0][j] += this.outputs[i][2 * j + 1] / 2;
        o[0][1][j] += this.outputs[i][2 * j + 1] / 2;
      }
      new Promise((r) => r()).then(() => {
        this.outputSnap.set(
          this.outputs[i].filter((v, i) => i % 2 == 0),
          2 * i * REND_BLOCK,
          REND_BLOCK
        );
        this.outputSnap.set(
          this.outputs[i].filter((v, i) => i % 2 == 1),
          2 * i * REND_BLOCK + REND_BLOCK,
          REND_BLOCK
        );
      });
    }
    return true;
  }
}
registerProcessor("spin-proc", SpinProcessor);
