import { initVoice, loadre } from "../sf2-service/render.js";
const { mem, newVoice, render, loadPCM } = loadre();

const v = newVoice();

const { setAttr, output1, output2 } = initVoice(newVoice(), mem);
const inititialPCMPtr = loadPCM(0);
class RendProc extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    const { mem, newVoice, render, loadPCM } = loadre();

    const v = newVoice();

    const { setAttr, output1, output2 } = initVoice(newVoice(), mem);
    this.port.start();

    this.port.postMessage(1);
    this.port.onmessage = this.handlemsg.bind(this);
  }
  handlemsg(e) {
    const {
      data: { readable, key, vel, zone, shdr, pcmOffset },
    } = e;
    if (readable) {
      const r = readable.getReader();
      r.read().then(function postpcm({ done, value }) {
        if (done) return;
        if (value) {
          const nnum = ~~(value.length / 2);
          const f32s = s16ArrayBuffer2f32(value);
          const ref = loadPCM(nnum);
          new Float32Array(mem.buffer, ref, nnum).set(f32s);
        }
        return r.read().then(postpcm);
      });
    }
    if (pcmOffset && zone && shdr && key && vel) {
      setAttr(zone, shdr, inititialPCMPtr + pcmOffset, key, vel);
      console.log(new Uint32Array(mem, v, 12));
    }
  }
  process(_, [outputs]) {
    render();
    outputs[0].set(output1);
    outputs[1].set(output2);
    //console.log(output1);
    return true;
  }
}
registerProcessor("rendproc5", RendProc);
function s16ArrayBuffer2f32(ab) {
  const b16 = new Int16Array(ab);

  const f32 = new Float32Array(ab.byteLength / 2);
  for (let i = 0; i < b16.length; i++) {
    //} of b16){
    f32[i] = b16[i] / 0xffff;
  }

  return f32;
}
