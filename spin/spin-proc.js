const CH_META_LEN = 12;

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
    this.updateArray = new Uint32Array(this.sb);
    this.inst = new WebAssembly.Instance(new WebAssembly.Module(wasm), {
      env: {},
    });
    this.sampleIdRefs = [];

    this.memory = this.inst.exports.memory;
    this.port.onmessage = this.handleMsg.bind(this);
    this.spinners = [];
    this.outputs = [];
  }
  async handleMsg({ data: { keyOn, stream, segments, nsamples, ...data } }) {
    if (stream && segments) {
      const offset = this.inst.exports.malloc(4 * nsamples);
      const fl = new Float32Array(this.memory.buffer, offset, 4 * nsamples);

      const reader = stream.getReader();
      let writeOffset = 0;
      let leftover;
      const decode = function (s1, s2) {
        const int = s1 + (s2 << 8);
        return int > 0x8000 ? -(0x10000 - int) / 0x8000 : int / 0x7fff;
      };
      await reader.read().then(function process({ done, value }) {
        if (done) {
          return writeOffset;
        }
        if (leftover) {
          fl[writeOffset++] = decode(leftover, value.shift());
        }
        let i;
        for (i = 0; i < value.length / 2; i++) {
          fl[writeOffset++] = decode(value[2 * i], value[2 * i + 1] << 8);
        }
        reader.read().then(process);
      });
      for (const sampleId in segments) {
        this.sampleIdRefs[parseInt(sampleId)] =
          segments[sampleId].startByte + offset;
      }

      this.port.postMessage({ ack: offset });
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

    console.log(
      new Float32Array(
        this.memory.buffer,
        spRef2json(this.memory.buffer, this.spinners[channel])[0],
        122
      )
    );
  }

  process(_, o, parameters) {
    if (this.updateArray[0] > 0) {
      this.sync(0);
    }
    for (let i = 0; i < 32; i++) {
      if (!o[i]) continue;
      if (this.spinners[i]) {
        this.inst.exports.spin(this.spinners[i], o[i][0].length);
        o[i][0].set(this.outputs[i]);
      }
    }
    return true;
  }
}
registerProcessor("spin-proc", SpinProcessor);
