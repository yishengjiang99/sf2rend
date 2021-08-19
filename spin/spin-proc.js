import { downloadData } from "../fetch-drop-ship/download.js";
const CH_META_LEN = 12;
const nchannels = 32;
const REND_BLOCK = 128;
/*
 typedef struct {
  float *inputf, *outputf;
  float fract;
  uint32_t position, loopStart, loopEnd;
  float stride, strideInc;
  float amp, ampInc;
} spinner;
    */
function spRef2json(heap, ref) {
  const [inputRef, outputRef] = new Uint32Array(heap, ref, 2);
  const [fract] = new Float32Array(heap, ref + 8, 1);
  const [position, loopStart, loopEnd] = new Uint32Array(heap, ref + 8 + 4, 3);
  const [stride, strideInc, amp, ampInc] = new Float32Array(
    heap,
    ref + 8 + 4 + 12,
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
    amp,
    ampInc,
  };
}
/* eslint-disable no-unused-vars */
class SpinProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: "stride",
        type: "a-rate",
        minValue: -40,
        maxValue: 40,
        defaultValue: 1.0,
      },
    ];
  }
  constructor(options) {
    super(options);
    const {
      processorOptions: { sb, wasm, lpfwasm, fc },
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
      return ret;
    };
    this.sampleIdRefs = [];

    this.port.onmessage = this.handleMsg.bind(this);
    this.spinners = [];
    this.outputs = [];
  }
  async handleMsg(e) {
    const {
      data: { stream, segments, nsamples, ...data },
    } = e;
    if (stream && segments) {
      const offset = this.malololc(4 * nsamples);

      const fl = new Float32Array(this.memory.buffer, offset, nsamples);
      await downloadData(stream, fl);
      this.outputSnap.set(fl.slice(0, 2024));
      for (const sampleId in segments) {
        this.sampleIdRefs[parseInt(sampleId)] =
          segments[sampleId].startByte + offset;
      }

      this.port.postMessage({ ack: offset });
    } else {
      console.log(e.data);
    }
  }
  sync(offset) {
    const [updateFlag, channel, sampleId, loopstart, loopend] = new Uint32Array(
      this.sb,
      4 * offset,
      5
    );

    const [stride, strideInc, amp, ampInc] = new Float32Array(
      this.sb,
      4 * offset + 20,
      4
    );

    if (this.spinners[channel]) this.inst.exports.reset(this.spinners[channel]);
    else {
      this.spinners[channel] = this.inst.exports.newSpinner();
      const spIO = new Uint32Array(
        this.memory.buffer,
        this.spinners[channel],
        2
      );
      this.outputs[channel] = new Float32Array(
        this.memory.buffer,
        spIO[1],
        128
      );
    }
    console.assert(this.sampleIdRefs[sampleId], "sample id posted");
    this.inst.exports.set_attrs(
      this.spinners[channel],
      this.sampleIdRefs[sampleId],
      loopstart,
      loopend
    );
    this.inst.exports.set_float_attrs(
      this.spinners[channel],
      stride,
      strideInc,
      amp,
      ampInc
    );
    this.updateArray[offset] = 0;

    if (this.updateArray[offset + CH_META_LEN] != 0) {
      this.sync(offset + CH_META_LEN);
    }
  }

  process(inputs, o, parameters) {
    if (this.updateArray[0] > 0) {
      this.sync(0);
    }
    for (let i = 0; i < 16; i++) {
      const vols = inputs[i][0];
      if (!this.spinners[i]) continue;
      if (!this.outputs[i]) continue;
      if (!o[i]) continue;
      const rendN = o[i][0].length;
      for (let j = 0; j < 128; j++) this.outputs[i][j] = 0;
      this.inst.exports.spin(this.spinners[i], 128);
      for (let j = 0; j < 128; j++) {
        o[i][0][j] = vols[j] * this.outputs[i][j];
        o[i][1][j] = vols[j] * this.outputs[i][j];
      }
      new Promise((r) => r()).then(() => {
        this.outputSnap.set(o[i][0], i * REND_BLOCK);
      });
    }
    return true;
  }
}
registerProcessor("spin-proc", SpinProcessor);
