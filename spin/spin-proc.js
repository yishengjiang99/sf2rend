import saturate from "../saturation/index.js";
import { wasmbin } from "./spin.wasm.js";
import { egStruct, spRef2json } from "./spin-structs.js";
const nchannels = 16;
const voices_per_channel = 2;
class SpinProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: "centDb",
        defaultValue: -2,
        minValue: -1440,
        maxValue: 0,
        automationRate: "a-rate",
      },
    ];
  }
  constructor(options) {
    super(options);
    this.setup_wasm();
    this.inst.exports.gm_reset();
    this.sampleIdRefs = [];
    this.presetRefs = [];
    this.port.onmessage = this.handleMsg.bind(this);
    this.spinners = [];
    this.outputs = [];
    this.dv = [];
    this.midiccRef = new Uint8Array(
      this.memory.buffer,
      this.inst.exports.midi_cc_vals,
      128 * 16
    );
    this.outputfff = new Float32Array(
      this.memory.buffer,
      this.inst.exports.outputs.value,
      128 * nchannels * voices_per_channel
    );
    this.mod_eg_val = new Float32Array(
      this.memory.buffer,
      this.inst.exports.mod_eg_output.value,
      128 * nchannels
    );
    this.LFO_1_Outputs = new Float32Array(
      this.memory.buffer,
      this.inst.exports.LFO_1_Outputs.value,
      128 * nchannels
    );
    this.spState = new Array(32);
    this.port.postMessage({ init: 1 });
    this.eg_vol_stag = new Array(32).fill(0);
    this.sp_reflect_arr = this.malololc(32 * 4 * 4);
    this.debug = true;
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
    let lastfl;
    const imports = {
      memory: this.memory,
      debugFL: (fl) => {
        if (!lastfl || fl != lastfl) {
          lastfl = fl;
        }
      },
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
    return this.eg_vol_stag[ch] && this.eg_vol_stag[ch] < 99;
  }
  async handleMsg(e) {
    const { data } = e;
    if (data.stream && data.segments) {
      await this.loadsdta(data);
      this.port.postMessage({ zack: 2 });
    } else if (data.zArr && data.presetId !== null) {
      for (const { arr, ref } of data.zArr) {
        this.setZone(ref, arr, data.presetId); //.set
      }
      this.port.postMessage({ zack: 1 });
    } else if (data.cmd) {
      switch (data.cmd) {
        case "debug":
          this.debug = true;
          break;
        case "reset":
          this.brk = this.inst.exports.__heap_base;
          break;
        case "gm_reset":
          this.inst.exports.gm_reset();
          break;
        //fallthrough
        case "panic":
          this.inst.exports.silence_all();
          break;
        case "newZone":
          this.setZone(data.zone.ref, data.zone.arr);
          this.port.postMessage({ ack: 1 });

          break;
      }
    }  else if (data.update) {
      const [presetId, zref] = data.update;
      const zonePtr = this.presetRefs[presetId]?.[zref];
      if (zonePtr == null) console.error(presetId, zref, "not found");
      else {
        const atr = new Int16Array(this.memory.buffer, zonePtr, 60);
        atr.set(new Int16Array(data.arr, 0, 60));
        this.port.postMessage({
          zack: "update",
          ref: zref,
          arr: new Int16Array(this.memory.buffer, zonePtr, 60),
        });
      }
    }else if (data.query) {
      const spref = this.inst.exports.spRef(parseInt(data.query));
      this.respondQuery(spref);
    } else {
      const [cmd, channel, ...args] = data;
      const [metric, value] = args;
      switch (cmd) {
        case 0xe0:
          break;
        case 0xb0:
          this.inst.exports.set_midi_cc_val(channel, metric, value);
          break;
        case 0x80:
          this.respondQuery(this.spinners[channel]);

          this.inst.exports.trigger_release(channel);

          this.port.postMessage({ ack: [0x80, channel] });
          break;
        case 0x90:
          {
            const [key, velocity, [presetId, zoneRef]] = args;
            const zonePtr = this.presetRefs[presetId]?.[zoneRef];

            if (!zonePtr) {
              console.error("cannot find present zoneref", presetId, zoneRef);
              return;
            }
            if (this.spinners[channel] == null) {
              this.instantiate(channel);
            }
            let ch = channel;
            this.inst.exports.reset(this.spinners[ch]);
            this.inst.exports.set_spinner_zone(this.spinners[ch], zonePtr);

            // console.log(calc_pitch_diff_log(x -> zone, x -> pcm, key));
            this.inst.exports.trigger_attack(
              this.spinners[ch],
              key,
              velocity
            ); 
            this.respondQuery(this.spinners[ch]);

          }
          break;
        default:
          break;
      }
    }
  }
  respondQuery(ref) {

    const spinfo = spRef2json(this.memory.buffer, ref);
    const egInfo = egStruct(
      this.memory.buffer,
      this.inst.exports.get_vol_eg(ref)
    );
    this.port.postMessage({
      queryResponse: {
        spinfo,
        egInfo,
      },
    });
  }

  setZone(ref, arr, presetId) {
    const ptr = this.malololc(120);
    if (!this.presetRefs[presetId]) {
      this.presetRefs[presetId] = {};
    }
    this.presetRefs[presetId][ref] = ptr;
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
    this.spinners[i] = this.inst.exports.newSpinner(i);
    const spIO = new Uint32Array(this.memory.buffer, this.spinners[i], 3);
    this.spinners[i];
    // this.dv[i] = new DataView(
    //   this.memory.buffer,
    //   this.spinners[i],
    //   this.inst.exports.sp_byte_len
    // );
    //console.log(this.dv[i]);

    //queueMicrotask(() => this.port.postMessage({ sp: i, dv: this.dv[i] }));

    this.outputs[i] = new Float32Array(this.memory.buffer, spIO[1], 128 * 2);
    return this.spinners[i];
  }

  process(inputs, outputs) {
    let has_sound = false;
    for (let i = 0;i < 16 * voices_per_channel;i++) {
      const chid = Math.floor(i / voices_per_channel);
      if (!this.outputs[i]) continue;
      if (!this.spinners[i]) continue;
      const shouldRend = this.inst.exports.spin(this.spinners[i], 128);
      if (!shouldRend) {
       // delete this.spinners[i];
        return true;
      }
      for (let j = 0;j < 128;j++) {
        outputs[chid][0][j] = this.outputs[i][voices_per_channel * j];
        outputs[chid][1][j] = this.outputs[i][voices_per_channel * j + 1];
        // outputs[side_out][0][j] = this.LFO_1_Outputs[chid * 128];
        // outputs[side_out][1][j] = this.mod_eg_val[chid * 128];
        has_sound = has_sound || outputs[chid][0][j] != 0;
      }

    }
    //  this.sp_reflect_snd();
    return true;
  }
  sp_reflect_snd() {
    new Promise((r) => r()).then(() => {
      this.inst.exports.sp_reflect(this.sp_reflect_arr);
      const sharedData = new Float32Array(32 * 4);
      sharedData.set(
        new Float32Array(this.memory.buffer, this.sp_reflect_arr, 32 * 4)
      );
      this.port.postMessage({
        sp_reflect: sharedData,
      });
    });
  }
  sendReport() {
    if (!this.lastReport || globalThis.currentTime - this.lastReport > 0.2) {
      new Promise((r) => r()).then(() => {
        this.lastReport = globalThis.currentTime;
        const ref = this.inst.exports.spRef(0);
        const spinfo = spRef2json(this.memory.buffer, ref);
        const egInfo = egStruct(
          this.memory.buffer,
          this.inst.exports.get_vol_eg(ref)
        );
        this.port.postMessage({
          queryResponse: {
            now: now(),
            spinfo,
            // egInfo,
            egStags: this.eg_vol_stag,
          },
        });
      });
    }
  }
}
registerProcessor("spin-proc", SpinProcessor);
function now() {
  return globalThis.currentTime;
}
async function downloadData(stream, fl) {
  const reader = stream.getReader();
  let writeOffset = 0;
  let leftover;
  const decode = function (s1, s2) {
    const int = s1 + (s2 << 8);
    return int > 0x8000 ? -(0x10000 - int) / 0x8000 : int / 0x7fff;
  };
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      await stream.closed;
      break;
    }
    if (!value) continue;
    let readIndex = 0;

    if (leftover != null) {
      fl[writeOffset++] = decode(leftover, value[readIndex++]);
      leftover = null;
    }
    const n = ~~value.length;
    while (readIndex < n - 2) {
      fl[writeOffset++] = decode(value[readIndex++], value[readIndex++]);
    }
    if (readIndex < value.length - 1) leftover = value[value.length - 1];
    console.assert(readIndex + 1 == value.length || leftover != null);
  }
}