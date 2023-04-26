import {wasmbin} from "./spin.wasm.js";
import {egStruct, spRef2json} from "./spin-structs.js";
import {midi_ch_cmds} from "../src/midilist.js";
import saturate from "../saturation/index.js";
const nchannels = 16;
const voices_per_channel = 4;
let _arr = [[], []];
let _idx = 0;
const ringbus = {
  this_bus: () => _arr[_idx],
  next_bus: () => _arr[_idx ^ 1],
  bus_ran: () => _idx ^= 1
}
const {this_bus, next_bus} = ringbus;
class SpinProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    this.setup_wasm();
    this.inst.exports.gm_reset();
    this.sampleIdRefs = [];
    this.presetRefs = [];
    this.port.onmessage = this.handleMsg.bind(this);
    this.spinners = [];
    this.sp_map = {};
    this.midiccRef = new Uint8Array(
      this.memory.buffer,
      this.inst.exports.midi_cc_vals,
      128 * 16
    );
    this.spState = new Array(32);
    this.port.postMessage({init: 1});
    this.eg_vol_stag = new Array(32).fill(0);
    this.sp_reflect_arr = this.malololc(32 * 4 * 4);
    this.debug = false;
    this.spinners = ringbus.this_bus();
    this.busIndex = 0;
  }
  setup_wasm() {
    this.memory = new WebAssembly.Memory({
      maximum: 1024 * 4,
      initial: 1024 * 4,
    });
    const imports = {
      memory: this.memory
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
  async handleMsg(e) {
    const {data} = e;
    if (data.stream && data.segments) {
      await this.loadsdta(data);
      this.port.postMessage({zack: 2});
    } else if (data.zArr && data.presetId !== null) {
      for (const {arr, ref} of data.zArr) {
        this.setZone(ref, arr, data.presetId); //.set
      }
      this.port.postMessage({zack: 1});
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
        case "panic":
          this.inst.exports.silence_all();
          break;
        case "newZone":
          this.setZone(data.zone.ref, data.zone.arr);
          this.port.postMessage({ack: 1});
          break;
      }
    } else if (data.update) {
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
    } else if (data.query) {
      const spref = this.inst.exports.spRef(parseInt(data.query));
      this.respondQuery(spref);
    } else {
      const [cmd, channel, ...args] = data;
      const [metric, value] = args;
      switch (cmd) {
        case 0xe0:
          break;
        case midi_ch_cmds.continuous_change:
          this.inst.exports.set_midi_cc_val(channel, metric, value);
          console.log(channel, metric, value);
          break;
        case 0x80: {
          const [key, vel] = args;
          if (!this.sp_map[channel * 128 + key]) throw 'unexpected emty sp_map';
          for (const sp of this.sp_map[channel * 128 + key]) {
            this.inst.exports.trigger_release(sp);
            this.respondQuery(sp);

          }

          this.port.postMessage({ack: [0x80, channel]});
          break;
        }
        case 0x90:
          {

            const [cmd, ch, key, velocity, [presetId, zoneRef]] = data;
            console.log(key, velocity, 'keyon');
            const zonePtr = this.presetRefs[presetId]?.[zoneRef];
            if (!zonePtr) {
              console.error("cannot find present zoneref", presetId, zoneRef);
              return;
            }
            const sp = this.inst.exports.newSpinner(ch);

            this.inst.exports.reset(sp);
            this.inst.exports.set_spinner_zone(sp, zonePtr);
            this.inst.exports.trigger_attack(
              sp,
              key,
              velocity
            );
            if (!this.sp_map[ch * 128 + key]) this.sp_map[ch * 128 + key] = [];
            this.sp_map[ch * 128 + key].push(sp);
            this.spinners.push(sp);
            this.respondQuery(sp);

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
        now: now(),
        rrms: this.rrms,
        spinfo,
        egInfo,
      },
    });
  }

  setZone(zoneRef, arr, presetId) {
    const ptr = this.malololc(120);
    if (!this.presetRefs[presetId]) {
      this.presetRefs[presetId] = {};
    }
    this.presetRefs[presetId][zoneRef] = ptr;
    new Int16Array(this.memory.buffer, ptr, 60).set(new Int16Array(arr, 0, 60));
  }

  async loadsdta(data) {
    const {
      segments: {sampleId, nSamples, loops, originalPitch, sampleRate: sr},
      stream,
    } = data;
    const offset = this.malololc(4 * nSamples);
    const fl = new Float32Array(this.memory.buffer, offset, nSamples);
    if (sampleId > 4096) console.error("probably should set higher pcm limit..");
    const stdRef = this.inst.exports.pcmRef(sampleId);
    const pcmArr = new Uint32Array(this.memory.buffer, stdRef, 6);
    pcmArr
      .set(
        [loops[0], loops[1], nSamples, sr, originalPitch, offset]
      );
    await downloadData(stream, fl);
  }

  process([noise_floor], [[left, right], fft_out, clip_out]) {
    let has_sound = false;
    if (noise_floor && noise_floor[0]) {
      left.set(noise_floor[0]);
      right.set(noise_floor[0]);
    }
    this.inst.exports.sp_wipe_output_tab();
    const thisBus = ringbus.this_bus();
    const nextBus = ringbus.next_bus();
    let loudnorm = 1; // 2.0 / Math.sqrt(thisBus.length);
    let rms = 0;
    while (thisBus.length) {
      // we are playing each voice in a LIFO matter 
      const spref = thisBus.pop();
      const goAgain = this.inst.exports.spin(spref);
      const outputf = new Float32Array(
        this.memory.buffer,
        this.inst.exports.get_sp_output(spref), 128 * 2);
      for (let j = 0;j < 128;j++) {
        left[j] += outputf[128 + j] * loudnorm;
        right[j] += outputf[j] * loudnorm;
        rms += left[j] * right[j];
      }
      if (goAgain) nextBus.unshift(spref);
    }
    for (let j = 0;j < 128;j++) {
      left[j] = saturate(left[j]);
      right[j] = saturate(right[j]);
    }
    if (fft_out) fft_out[0].set(left);
    clip_out[0].set(right);
    this.rrms = rms + "|" + loudnorm;
    ringbus.bus_ran();
    this.sendReport();
    return true;
  }
  sendReport() {
    if (this.debug && (!this.lastReport || globalThis.currentTime - this.lastReport > 0.2)) {
      new Promise((r) => r()).then(() => {
        this.lastReport = globalThis.currentTime;
        const ref = this.inst.exports.spRef(this_bus?.[0] || next_bus?.[0] || this.inst.exports.sp_idx.value - 1);
        const spinfo = spRef2json(this.memory.buffer, ref);
        this.inst.exports.sp_reflect(this.sp_reflect_arr);
        const sharedData = new Float32Array(32 * 4);
        sharedData.set(
          new Float32Array(this.memory.buffer, this.sp_reflect_arr, 32 * 4)
        );
        const egInfo = egStruct(
          this.memory.buffer,
          this.inst.exports.get_vol_eg(ref)
        );
        this.port.postMessage({
          sp_reflect: sharedData,
          queryResponse: {
            now: now(),
            rrms: this.rrms,
            spinfo,
            egInfo,
            activeSp: _arr
          }
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
    const {done, value} = await reader.read();
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