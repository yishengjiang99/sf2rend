import { wasmbin } from "./spin.wasm.js";
import { egStruct, spRef2json } from "./spin-structs.js";
import { midi_ch_cmds } from "../src/midilist.js";
import saturate from "../saturation/index.js";
const nchannels = 16;
const voices_per_channel = 4;

function ring_bus() {
  // circular queue of size 2
  // bus as in bus stop
  // not the wire
  let _arr = [[], []];
  let _idx = 0;
  return {
    get this_bus() {
      return _arr[_idx];
    },
    get next_bus() {
      return _arr[_idx ^ 1];
    },
    get active_voices() {
      return _arr[0].length + _arr[1].length;
    },
    bus_ran: () => (_idx ^= 1), // after rend block, next_bus became this_bus for next cycle
  };
}
class SpinProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    this.setup_wasm();
    this.inst.exports.gm_reset();
    this.presetRefs = [];
    this.port.onmessage = this.handleMsg.bind(this);
    this.sp_map = {};
    this.midiccRef = new Uint8Array(
      this.memory.buffer,
      this.inst.exports.midi_cc_vals,
      128 * 16
    );
    this.port.postMessage({ init: 1 });
    this.debug = false;
    this.ringbus = ring_bus();
    const zonePtr = this.malololc(120);
    this.zoneAttr = new Int16Array(this.memory.buffer, zonePtr, 60);

  }
  setup_wasm() {
    this.memory = new WebAssembly.Memory({
      maximum: 1024 * 4,
      initial: 1024 * 4,
    });
    const imports = {
      memory: this.memory,
      tanf: Math.tan,
      consolef: (f) => console.log("--->", f),
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
        case "panic":
          this.inst.exports.silence_all();
          break;
        case "newZone":
          this.setZone(data.zone.ref, data.zone.arr);
          this.port.postMessage({ ack: 1 });
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
      const [lsb, msb] = args;
      const [key, vel] = args;
      switch (cmd) {
        case midi_ch_cmds.pitchbend:
          // this.inst.exports.ch_set_bend(channel, msb, lsb);
          break;
        case midi_ch_cmds.continuous_change:
          this.inst.exports.set_midi_cc_val(channel, metric, value);
          if (this.lastRan) this.respondQuery(this.lastRan);
          break;
        case midi_ch_cmds.note_off: {
          if (!this.sp_map[channel * 128 + key]) throw "unexpected emty sp_map";
          for (const sp of this.sp_map[channel * 128 + key]) {
            this.inst.exports.trigger_release(sp);
            this.respondQuery(sp);
          }

          this.port.postMessage({ ack: [0x80, channel] });
          break;
        }
        case midi_ch_cmds.note_on:
          {
            const [cmd, ch, key, velocity, zoneArr] = data;
            const atr = new Int16Array(this.memory.buffer, this.zoneAttr, 60);
            atr.set(zoneArr);
            const sp = this.inst.exports.newSpinner(ch);
            this.inst.exports.reset(sp);
            this.inst.exports.set_spinner_zone(sp, this.zoneAttr);
            this.inst.exports.trigger_attack(sp, key, velocity);
            if (!this.sp_map[ch * 128 + key]) this.sp_map[ch * 128 + key] = [];
            this.sp_map[ch * 128 + key].push(sp);
            this.ringbus.next_bus.push(sp);
            this.respondQuery(sp);
            this.lastRan = sp;
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
        spinfo,
        egInfo,
        eg2Info: egStruct(
          this.memory.buffer,
          this.inst.exports.get_mod_eg(ref)
        )
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
      segments: { sampleId, nSamples, loops, originalPitch, sampleRate: sr },
      stream,
    } = data;
    const offset = this.malololc(4 * nSamples);
    const fl = new Float32Array(this.memory.buffer, offset, nSamples);
    if (sampleId > 4096)
      console.error("probably should set higher pcm limit..");
    const stdRef = this.inst.exports.pcmRef(sampleId);
    const pcmArr = new Uint32Array(this.memory.buffer, stdRef, 6);
    pcmArr.set([loops[0], loops[1], nSamples, sr, originalPitch, offset]);
    await downloadData(stream, fl);
  }

  process([noise_floor], outputs) {
    const tick = globalThis.currentTime;
    const fft_out = outputs[18][0];

    let has_sound = false;
    let [left, right] = outputs[0];
    if (noise_floor && noise_floor[0]) {
      left.set(noise_floor[0]);
      right.set(noise_floor[0]);
    }
    this.inst.exports.sp_wipe_output_tab();
    const thisBus = this.ringbus.this_bus;
    const nextBus = this.ringbus.next_bus;
    let loudnorm = 0.05
    const ch_rms = Array(16).fill(0);
    const skipped = [];

    while (thisBus.length) {
      // we are playing each voice in a LIFO matter
      const spref = thisBus.pop();
      const goAgain = this.inst.exports.spin(spref);
      const sp_output_ref = this.inst.exports.get_sp_output(spref);
      const sp_midi_channel = this.inst.exports.get_sp_channel_id(spref);
      const outputf = new Float32Array(
        this.memory.buffer,
        sp_output_ref,
        128 * 2
      );

      const [left, right] = outputs[sp_midi_channel];
      if (ch_rms[sp_midi_channel] > 1.0) {
        skipped.push(sp_midi_channel);
      }
      for (let j = 0; j < 128; j++) {
        left[j] = left[j] + outputf[j] * loudnorm;
        right[j] = right[j] + outputf[j + 128] * loudnorm;
        ch_rms[sp_midi_channel] += left[j] * left[j];
      }
      ch_rms[sp_midi_channel] /= 128;
      if (goAgain) nextBus.unshift(spref);
    }
    this.ringbus.bus_ran();
    const rend_time = globalThis.currentTime - tick;
    this.sendReport({ ch_rms, skipped, rend_time });
    return true;
  }
  sendReport({ ch_rms, skipped, rend_time }) {
    if (null == this.lastRan) return;
    if (
      this.debug ||
      this.focusQ ||
      !this.lastReport ||
      globalThis.currentTime - this.lastReport > 0.016
    ) {
      new Promise((r) => r()).then(() => {
        this.lastReport = globalThis.currentTime;
        const ref = this.lastRan;
        const spinfo = spRef2json(this.memory.buffer, ref);
        const egInfo = egStruct(
          this.memory.buffer,
          this.inst.exports.get_vol_eg(ref)
        );
        this.port.postMessage({
          rend_summary: {
            now: now(),
            rms: ch_rms,
            activeSp: this.ringbus.active_voices,
            spinfo,
            egInfo,
            skipped,
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
