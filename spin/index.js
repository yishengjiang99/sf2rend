/**
 * 
 * @returns 
spinner sps[nchannels];
lpf_t lpf[nchannels];
EG eg[nchannels * 2];
LFO lfos[nchannels * 2];
pcm_t pcms[999];
char midi_cc_vals[nchannels * 128];
float outputs[nchannels * RENDQ * 2];
float silence[40];
char spsIndx = 0;
 */
export async function mkspinner() {
  const memory = new WebAssembly.Memory({
    maximum: 1024,
    initial: 1024,
  });
  const fetchPromise = fetch(basename() + "spin/spin.wasm");
  const { instance } = await WebAssembly.instantiateStreaming(fetchPromise, {
    env: { memory },
  });
  let brk = 0x30000;
  let sbrk = (len) => {
    const ret = brk;
    brk += len;
    if (brk > memory.buffer.byteLength) throw "no mem";
    return ret;
  };
  const pcmStructLen = 4 * Uint32Array.BYTES_PER_ELEMENT;
  return {
    instance,
    sbrk,
    memory,
    sdtaRef(sampleId) {
      return new Uint32Array(
        this.memory.buffer,
        this.inst.exports.pcms.value + sampleId * pcmStuctLen
      );
    },
    async loadsdta({ segments: { sampleId, nSamples, loops }, stream }) {
      const offset = this.sbrk(4 * nSamples);
      const fl = new Float32Array(this.memory.buffer, offset, nSamples);
      await downloadData(stream, fl);
      this.sdtaRef(sampleId).set(
        new Uint32Array([loops[0], loops[1], nSamples, offset])
      );
    },
    ccvals: new Uint8Array(
      memory.buffer,
      instance.exports.midi_cc_vals.value,
      128 * 16
    ),
    ...instance.exports,
  };
}
function basename() {
  const root = document.location.pathname.split("/sf2rend")[0];
  return root + "/sf2rend/";
}
