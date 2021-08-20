import { downloadData } from "../fetch-drop-ship/download.js";
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
      processorOptions: { sb, wasm },
    } = options;
    this.sb = sb;
    this.updateArray = new Uint32Array(this.sb, 0, CH_META_LEN * 32);
    this.outputSnap = new Float32Array(
      this.sb,
      CH_META_LEN * 32 * Uint32Array.BYTES_PER_ELEMENT,
      REND_BLOCK * nchannels
    );
    this.memory = new WebAssembly.Memory({ maximum: 1024, initial: 1024 });
    this.inst = new WebAssembly.Instance(new WebAssembly.Module(wasm), {
      env: { memory: this.memory },
    });
    this.brk = 0x10000;
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
    for (let i = 0; i < 16; i++) {
      this.spinners[i] = this.inst.exports.newSpinner();
      const spIO = new Uint32Array(this.memory.buffer, this.spinners[i], 2);
      this.outputs[i] = new Float32Array(this.memory.buffer, spIO[1], 128);
      console.log(spRef2json(this.memory.buffer, this.spinners[i]));
    }
  }
  async handleMsg(e) {
    const { data } = e;
    if (data.stream && data.segments) {
      const { stream, segments, nsamples } = data;
      const offset = this.malololc(4 * data.nsamples);

      const fl = new Float32Array(this.memory.buffer, offset, data.nsamples);
      await downloadData(stream, fl);
      this.outputSnap.set(fl.slice(0, 2024));
      for (const sampleId in segments) {
        this.sampleIdRefs[parseInt(sampleId)] =
          segments[sampleId].startByte + offset;
      }
      this.port.postMessage({ ack: offset });
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
      console.log(e.data);
    }
  }
  sync(offset) {
    const [
      updateFlag,
      channel,
      sampleId,
      loopstart,
      loopend,
      zoneRef,
      pitchRatio,
      ...blankForNow
    ] = new Uint32Array(this.sb, 4 * offset, CH_META_LEN);
    console.log(
      JSON.stringify(spRef2json(this.memory.buffer, this.spinners[channel]))
    );

    console.assert(this.sampleIdRefs[sampleId], "sample id posted");
    this.inst.exports.setZone(this.spinners[channel], this.presetRefs[zoneRef]);

    this.inst.exports.set_attrs(
      this.spinners[channel],
      this.sampleIdRefs[sampleId],
      loopstart,
      loopend
    );
    this.inst.exports.setStride(this.spinners[channel], pitchRatio / 0xffff);
    this.updateArray[offset] = 0;

    this.inst.exports.reset(this.spinners[channel]);
    if (this.updateArray[offset + CH_META_LEN] != 0) {
      this.sync(offset + CH_META_LEN);
    }
  }

  process(inputs, o, parameters) {
    if (this.updateArray[0] > 0) {
      this.sync(0);
    }
    for (let i = 0; i < 16; i++) {
      if (!this.spinners[i]) continue;
      if (!this.outputs[i]) continue;
      if (!o[i]) continue;
      for (let j = 0; j < 128; j++) this.outputs[i][j] = 0;
      this.inst.exports.spin(this.spinners[i], 128);
      for (let j = 0; j < 128; j++) {
        o[i][0][j] = this.outputs[i][j];
        o[i][1][j] = this.outputs[i][j];
      }
      this.outputSnap.set(this.outputs[i], i * REND_BLOCK);
    }
    return true;
  }
}
registerProcessor("spin-proc", SpinProcessor);
