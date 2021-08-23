import { downloadData } from "../fetch-drop-ship/download.js";
import { SharedRiffPipe } from "../srp/shared-riff-pipe.js";

const CH_META_LEN = 24;
const nchannels = 32;
const REND_BLOCK = 128;
/*
 typedef struct {
  float *inputf, *outputf;
  float fract;
  uint32_t position, loopStart, loopEnd;
  float stride, strideInc;
  lpf_t* lpf;
  zone_t* zone;  EG *voleg, *modeg;

} spinner;
    */
function spRef2json(heap, ref) {
  const [inputRef, outputRef] = new Uint32Array(heap, ref, 2);
  const [fract] = new Float32Array(heap, ref + 8, 1);
  const [position, loopStart, loopEnd] = new Uint32Array(heap, ref + 8 + 4, 3);
  const [stride, strideInc] = new Float32Array(heap, ref + 8 + 4 + 12, 2);
  const [lpfref, zoneref, egVolRef, egModRef] = new Uint32Array(
    heap,
    ref + 8 + 4 + 12 + 8,
    4
  );
  return {
    inputRef,
    outputRef,
    fract,
    position,
    loopStart,
    loopEnd,
    stride,
    strideInc,
    lpfref,
    zoneref: new Int16Array(heap, zoneref, 60),
    egVolRef: [
      new Int32Array(heap, egVolRef, 2),
      new Float64Array(heap, egVolRef + 8, 2),
    ],
    egModRef,
  };
}
/* eslint-disable no-unused-vars */
class SpinProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    const {
      processorOptions: { rendSb, statusBuffer, wasm },
    } = options;
    this.pipe = new SharedRiffPipe(statusBuffer);
    this.outputSnap = new Float32Array(rendSb, REND_BLOCK * nchannels);
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
    for (let i = 0; i < 16; i++) {
      this.spinners[i] = this.inst.exports.newSpinner();
      const spIO = new Uint32Array(this.memory.buffer, this.spinners[i], 12);
      this.outputs[i] = new Float32Array(this.memory.buffer, spIO[1], 128);
      this.strides[i] = spIO[6];
    }
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
  // sync(offset) {
  //   return 0;
  //   const [
  //     updateFlag,
  //     channel,
  //     sampleId,
  //     loopstart,
  //     loopend,
  //     zoneRef,
  //     pitchRatio,
  //     ...blankForNow
  //   ] = new Uint32Array(this.sb, 4 * offset, CH_META_LEN);

  //   console.assert(this.sampleIdRefs[sampleId], "sample id posted");

  //   this.inst.exports.set_attrs(
  //     this.spinners[channel],
  //     this.sampleIdRefs[sampleId],
  //     loopstart,
  //     loopend,zone,stride
  //   );
  //   this.inst.exports.setStride(this.spinners[channel], pitchRatio / 0xffff);
  //   this.inst.exports.setZone(this.spinners[channel], this.presetRefs[zoneRef]);

  //   this.updateArray[offset] = 0;

  //   this.inst.exports.reset(this.spinners[channel]);
  //   if (this.updateArray[offset + CH_META_LEN] != 0) {
  //     this.sync(offset + CH_META_LEN);
  //   }
  // }

  process(inputs, o, parameters) {
    if (this.pipe.hasMsg) {
      this.pipe.read().forEach((msg) => {
        switch (msg.fourcc) {
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
              console.log(
                this.inst.exports.set_attrs(
                  this.spinners[channel],
                  this.sampleIdRefs[sampleId],
                  loopstart,
                  loopend,
                  this.presetRefs[zoneRef],
                  ratio / 0xffff
                )
              );
            }
            break;
          default:
            break;
        }
      });
    }
    for (let i = 0; i < 16; i++) {
      if (!this.spinners[i]) continue;
      if (!this.outputs[i]) continue;
      // if (!o[i]) continue;
      for (let j = 0; j < 128; j++) this.outputs[i][j] = 0;
      this.inst.exports.spin(this.spinners[i], 128);

      for (let j = 0; j < 128; j++) {
        o[0][0][j] += this.outputs[i][j] / 6;
        o[0][1][j] += this.outputs[i][j] / 6;
      }
      this.outputSnap.set(this.outputs[0], i * REND_BLOCK);
    }
    return true;
  }
}
registerProcessor("spin-proc", SpinProcessor);
