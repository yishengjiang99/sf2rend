import { wasmbin } from "./spin.wasm.js";
import { egStruct, spRef2json } from "./spin-structs.js";
import { midi_ch_cmds } from "../src/midilist.js";

const N_MIDI_CHANNELS = 16;
const RENDQ = 128;
const SUSTAIN_PEDAL_CC = 64;

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

function s16ArrayBuffer2f32(ab) {
  const b16 = new Int16Array(ab);
  const f32 = new Float32Array(b16.length);
  for (let i = 0; i < b16.length; i++) f32[i] = b16[i] / 32768;
  return f32;
}

class SpinProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    this.setup_wasm();
    this.inst.exports.gm_reset();
    // Zone memory owned by the worklet: presetRefs[presetId][zoneRef] -> wasm ptr.
    // Voices point directly at these buffers (single source of truth).
    this.presetRefs = [];
    this.zoneShipCache = new Set(); // "presetId:ref" already shipped
    this.sampleShipCache = new Set(); // "url::sampleId" already shipped
    this.sp_map = {}; // (channel*128+key) -> [sp] in note-on (FIFO) order
    this.spOwner = new Map(); // sp -> map key, for steal cleanup
    this.spZone = new Map(); // sp -> zone wasm ptr, for zone-edit refresh
    this.sustainPedal = new Array(N_MIDI_CHANNELS).fill(false);
    this.sustainedVoices = Array.from({ length: N_MIDI_CHANNELS }, () => []);
    this.scheduled = []; // lookahead-scheduled note-ons: {atTime, sp, key, velocity}
    this.port.onmessage = this.handleMsg.bind(this);
    this.ringbus = ring_bus();
    this.chRms = new Float32Array(N_MIDI_CHANNELS);
    this.rmsOut = new Float32Array(N_MIDI_CHANNELS);
    this.outViews = new Map(); // sp -> Float32Array view of its output buffer
    this.lastBuffer = this.memory.buffer;
    this.lastReport = 0;
    // midi_cc_vals is exported as a WebAssembly.Global; its address is .value
    this.midiccRef = new Uint8Array(
      this.memory.buffer,
      this.inst.exports.midi_cc_vals.value,
      128 * N_MIDI_CHANNELS
    );
    this.port.postMessage({ init: 1 });
    this.debug = false;
  }
  setup_wasm() {
    this.memory = new WebAssembly.Memory({
      maximum: 1024 * 4,
      initial: 1024 * 4,
    });
    const imports = {
      memory: this.memory,
      tanf: Math.tan,
      log2f: (x) => Math.log2(x),
      consolef: (f) => console.log("--->", f),
    };
    this.inst = new WebAssembly.Instance(new WebAssembly.Module(wasmbin), {
      env: imports,
    });
    // The C DSP uses the real device rate (envelopes, LFOs, filters).
    this.inst.exports.set_sample_rate(globalThis.sampleRate || 44100);
    // __heap_base is exported as a WebAssembly.Global; use its address.
    this.brk = this.inst.exports.__heap_base.value;
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
    } else if (data.buffer && data.segments) {
      // Safari fallback: ArrayBuffer instead of a transferred stream
      await this.loadsdta(data);
      this.port.postMessage({ zack: 2 });
    } else if (data.zArr && data.presetId != null) {
      for (const { arr, ref } of data.zArr) {
        this.setZone(ref, arr, data.presetId);
      }
      this.port.postMessage({ zack: 1 });
    } else if (data.cmd) {
      switch (data.cmd) {
        case "debug":
          this.debug = true;
          break;
        case "reset":
          this.brk = this.inst.exports.__heap_base.value;
          this.inst.exports.reset_tables();
          this.presetRefs = [];
          this.zoneShipCache.clear();
          this.sampleShipCache.clear();
          this.sp_map = {};
          this.spOwner.clear();
          this.spZone.clear();
          this.sustainPedal.fill(false);
          this.sustainedVoices = Array.from(
            { length: N_MIDI_CHANNELS },
            () => []
          );
          this.scheduled = [];
          this.ringbus = ring_bus();
          this.outViews.clear();
          this.lastBuffer = this.memory.buffer;
          break;
        case "gm_reset":
          this.inst.exports.gm_reset();
          break;
        case "panic":
          this.inst.exports.silence_all();
          break;
        case "setGen":
          this.inst.exports.set_channel_gen(
            data.channel,
            data.gen,
            data.value
          );
          this.port.postMessage({
            ack: "setGen",
            channel: data.channel,
            gen: data.gen,
            value: data.value,
          });
          break;
        case "clearGen":
          this.inst.exports.clear_channel_gen(data.channel, data.gen);
          this.port.postMessage({
            ack: "clearGen",
            channel: data.channel,
            gen: data.gen,
          });
          break;
        case "setZone":
          this.writeZone(data.presetId, data.ref, data.arr);
          break;
      }
    } else if (data.query != null) {
      // explicit queries only; never auto-respond on note on/off/CC.
      // data.query is a MIDI channel: inspect its most recent active voice.
      const spref = this.inst.exports.sp_for_channel(parseInt(data.query));
      if (spref) this.respondQuery(spref);
      else this.port.postMessage({ queryResponse: { none: true } });
    } else {
      const [cmd, channel, ...args] = data;
      const [metric, value] = args;
      const [lsb, msb] = args;
      const [key, vel] = args;
      switch (cmd) {
        case midi_ch_cmds.pitchbend:
          this.inst.exports.ch_set_bend(channel, msb, lsb);
          break;
        case midi_ch_cmds.continuous_change:
          this.inst.exports.set_midi_cc_val(channel, metric, value);
          if (metric === 123 || metric === 120) {
            // all notes off / all sound off
            this.releaseChannelVoices(channel);
          } else if (metric === SUSTAIN_PEDAL_CC) {
            const on = value >= 64;
            if (this.sustainPedal[channel] && !on) {
              for (const sp of this.sustainedVoices[channel]) {
                this.inst.exports.trigger_release(sp);
              }
              this.sustainedVoices[channel] = [];
            }
            this.sustainPedal[channel] = on;
          }
          break;
        case midi_ch_cmds.note_off: {
          // FIFO: release the oldest instance on this key, not every voice
          const mapKey = channel * 128 + key;
          const voices = this.sp_map[mapKey];
          if (!voices?.length) {
            this.port.postMessage({ ack: [0x80, channel], ignored: true });
            break;
          }
          const sp = voices.shift();
          if (!voices.length) delete this.sp_map[mapKey];
          this.spOwner.delete(sp);
          this.spZone.delete(sp);
          // If the note was lookahead-scheduled but hasn't sounded yet,
          // cancel it instead of releasing.
          const si = this.scheduled.findIndex((s) => s.sp === sp);
          if (si >= 0) {
            this.scheduled.splice(si, 1);
            this.inst.exports.free_voice(sp);
            this.port.postMessage({ ack: [0x80, channel] });
            break;
          }
          if (this.sustainPedal[channel]) {
            // defer the release until the pedal lifts
            this.sustainedVoices[channel].push(sp);
          } else {
            this.inst.exports.trigger_release(sp);
          }
          this.port.postMessage({ ack: [0x80, channel] });
          break;
        }
        case midi_ch_cmds.note_on:
          {
            // [note_on|ch, key, velocity, presetId, zoneRef, atTime?]; the
            // zone lives in worklet-owned presetRefs memory, never a scratch
            // copy. atTime (AudioContext clock) enables lookahead scheduling.
            const [_c, ch, nkey, velocity, presetId, zoneRef, atTime] = data;
            const zonePtr = this.presetRefs[presetId]?.[zoneRef];
            if (zonePtr == null) {
              if (this.debug)
                console.warn("note_on for unshipped zone", presetId, zoneRef);
              break;
            }
            const sp = this.inst.exports.alloc_voice(ch);
            this.removeVoiceEverywhere(sp); // in case the slot was stolen
            this.inst.exports.set_spinner_zone(sp, zonePtr);
            const mapKey = ch * 128 + nkey;
            if (!this.sp_map[mapKey]) this.sp_map[mapKey] = [];
            this.sp_map[mapKey].push(sp);
            this.spOwner.set(sp, mapKey);
            this.spZone.set(sp, zonePtr);
            if (atTime == null || atTime <= globalThis.currentTime + 0.004) {
              this.inst.exports.trigger_attack(sp, nkey, velocity);
              this.ringbus.next_bus.push(sp);
            } else {
              this.scheduled.push({ atTime, sp, key: nkey, velocity });
            }
          }
          break;
        default:
          break;
      }
    }
  }

  // Release every voice on a channel (CC120/CC123, transport stop).
  releaseChannelVoices(ch) {
    this.scheduled = this.scheduled.filter((s) => {
      if (this.inst.exports.get_sp_channel_id(s.sp) === ch) {
        this.inst.exports.free_voice(s.sp);
        this.removeVoiceEverywhere(s.sp);
        return false;
      }
      return true;
    });
    for (const key of Object.keys(this.sp_map)) {
      if ((key >> 7) !== ch) continue;
      for (const sp of this.sp_map[key]) {
        this.inst.exports.trigger_release(sp);
      }
      delete this.sp_map[key];
    }
    for (const [sp, owner] of this.spOwner) {
      if ((owner >> 7) === ch) {
        this.spOwner.delete(sp);
        this.spZone.delete(sp);
      }
    }
    this.sustainedVoices[ch] = [];
  }

  // Remove a (possibly stolen) voice from every tracking structure.
  removeVoiceEverywhere(sp) {
    const owner = this.spOwner.get(sp);
    if (owner !== undefined) {
      const arr = this.sp_map[owner];
      if (arr) {
        const i = arr.indexOf(sp);
        if (i >= 0) arr.splice(i, 1);
        if (!arr.length) delete this.sp_map[owner];
      }
      this.spOwner.delete(sp);
    }
    this.spZone.delete(sp);
    const thisBus = this.ringbus.this_bus;
    const nextBus = this.ringbus.next_bus;
    let i = thisBus.indexOf(sp);
    if (i >= 0) thisBus.splice(i, 1);
    i = nextBus.indexOf(sp);
    if (i >= 0) nextBus.splice(i, 1);
    for (let c = 0; c < N_MIDI_CHANNELS; c++) {
      const sv = this.sustainedVoices[c];
      const j = sv.indexOf(sp);
      if (j >= 0) sv.splice(j, 1);
    }
    this.outViews.delete(sp);
  }

  respondQuery(ref) {
    const spinfo = spRef2json(this.memory.buffer, ref);
    const egInfo = egStruct(
      this.memory.buffer,
      this.inst.exports.get_vol_eg(ref)
    );
    const eg2Info = egStruct(
      this.memory.buffer,
      this.inst.exports.get_mod_eg(ref)
    );
    const gens = new Array(60);
    for (let g = 0; g < 60; g++) {
      gens[g] = this.inst.exports.voice_gen(ref, g);
    }
    this.port.postMessage({
      queryResponse: {
        now: now(),
        spinfo,
        egInfo,
        eg2Info,
        gens,
      },
    });
  }

  setZone(zoneRef, arr, presetId) {
    const key = presetId + ":" + zoneRef;
    if (this.zoneShipCache.has(key)) return; // already shipped
    const ptr = this.malololc(120);
    if (!this.presetRefs[presetId]) {
      this.presetRefs[presetId] = {};
    }
    this.presetRefs[presetId][zoneRef] = ptr;
    new Int16Array(this.memory.buffer, ptr, 60).set(new Int16Array(arr, 0, 60));
    this.zoneShipCache.add(key);
  }

  // Zone editor write: same memory the voices read; live voices refresh.
  writeZone(presetId, ref, arr) {
    const zonePtr = this.presetRefs[presetId]?.[ref];
    if (zonePtr == null) {
      console.error(presetId, ref, "not found");
      return;
    }
    new Int16Array(this.memory.buffer, zonePtr, 60).set(
      Int16Array.from(arr, (v) => Number(v) || 0)
    );
    for (const bus of [this.ringbus.this_bus, this.ringbus.next_bus]) {
      for (const sp of bus) {
        if (this.spZone.get(sp) === zonePtr) {
          this.inst.exports.voice_refresh_zone(sp);
        }
      }
    }
    this.port.postMessage({ ack: "setZone", presetId, ref });
  }

  async loadsdta(data) {
    const {
      segments: {
        sampleId,
        nSamples,
        loops,
        originalPitch,
        pitchCorrection,
        sampleRate: sr,
      },
      sf2url,
    } = data;
    const cacheKey = (sf2url || "") + "::" + sampleId;
    if (this.sampleShipCache.has(cacheKey)) return; // header already valid
    const offset = this.malololc(4 * nSamples);
    const fl = new Float32Array(this.memory.buffer, offset, nSamples);
    if (data.stream) {
      await downloadData(data.stream, fl);
    } else if (data.buffer) {
      fl.set(s16ArrayBuffer2f32(data.buffer));
    }
    if (sampleId > 4096)
      console.error("probably should set higher pcm limit..");
    const stdRef = this.inst.exports.pcmRef(sampleId);
    // pcm_t: loopstart, loopend, length, sampleRate, originalPitch,
    //        pitchCorrection, data
    new Uint32Array(this.memory.buffer, stdRef, 7).set([
      loops[0],
      loops[1],
      nSamples,
      sr,
      originalPitch,
      pitchCorrection | 0,
      offset,
    ]);
    this.sampleShipCache.add(cacheKey);
  }

  process(inputs, outputs) {
    const tick = globalThis.currentTime;
    const [noise_floor] = inputs;
    if (noise_floor && noise_floor[0] && outputs[0] && outputs[0][0]) {
      const target = outputs[0][0];
      const src = noise_floor[0];
      const n = Math.min(target.length, src.length);
      for (let j = 0; j < n; j++) target[j] += src[j];
    }
    this.inst.exports.sp_wipe_output_tab();
    // Move lookahead-scheduled note-ons whose time has come into the bus.
    if (this.scheduled.length) {
      const nowT = globalThis.currentTime;
      const horizon = nowT + RENDQ / globalThis.sampleRate;
      this.scheduled.sort((a, b) => a.atTime - b.atTime);
      while (
        this.scheduled.length &&
        this.scheduled[0].atTime <= horizon
      ) {
        const s = this.scheduled.shift();
        this.inst.exports.trigger_attack(s.sp, s.key, s.velocity);
        this.ringbus.next_bus.push(s.sp);
      }
    }
    const thisBus = this.ringbus.this_bus;
    const nextBus = this.ringbus.next_bus;
    if (this.memory.buffer !== this.lastBuffer) {
      this.outViews.clear();
      this.lastBuffer = this.memory.buffer;
    }

    while (thisBus.length) {
      const spref = thisBus.pop();
      const goAgain = this.inst.exports.spin(spref);
      const sp_midi_channel = this.inst.exports.get_sp_channel_id(spref);
      let view = this.outViews.get(spref);
      if (!view) {
        view = new Float32Array(
          this.memory.buffer,
          this.inst.exports.get_sp_output(spref),
          RENDQ * 2
        );
        this.outViews.set(spref, view);
      }
      const out = outputs[sp_midi_channel];
      if (out) {
        const left = out[0];
        const right = out[1] || out[0];
        const n = Math.min(RENDQ, left.length, right.length);
        for (let j = 0; j < n; j++) {
          left[j] += view[j];
          right[j] += view[j + RENDQ];
        }
      }
      if (goAgain) {
        nextBus.push(spref);
      } else {
        // voice finished: free the slot and drop it from note tracking
        this.inst.exports.free_voice(spref);
        this.removeVoiceEverywhere(spref);
      }
    }
    this.ringbus.bus_ran();

    // Per-channel RMS from the final mixed output, computed once.
    // Simple overload limiter: scale the block down if it clips.
    let peak = 0;
    for (let c = 0; c < N_MIDI_CHANNELS; c++) {
      const out = outputs[c];
      if (!out) {
        this.chRms[c] = 0;
        continue;
      }
      const left = out[0];
      const right = out[1] || out[0];
      const n = Math.min(RENDQ, left.length, right.length);
      let acc = 0;
      for (let j = 0; j < n; j++) {
        const a = left[j] < 0 ? -left[j] : left[j];
        const b = right[j] < 0 ? -right[j] : right[j];
        if (a > peak) peak = a;
        if (b > peak) peak = b;
        acc += left[j] * left[j] + right[j] * right[j];
      }
      this.chRms[c] = acc / (n * 2);
    }
    if (peak > 1) {
      const g = 1 / peak;
      const g2 = g * g;
      for (let c = 0; c < N_MIDI_CHANNELS; c++) {
        const out = outputs[c];
        if (!out) continue;
        const left = out[0];
        const right = out[1] || out[0];
        const n = Math.min(RENDQ, left.length, right.length);
        for (let j = 0; j < n; j++) {
          left[j] *= g;
          right[j] *= g;
        }
        this.chRms[c] *= g2;
      }
    }
    for (let c = 0; c < N_MIDI_CHANNELS; c++) {
      this.rmsOut[c] = Math.sqrt(this.chRms[c]);
    }

    const rend_time = globalThis.currentTime - tick;
    this.sendReport(rend_time);
    return true;
  }

  sendReport(rend_time) {
    // throttle rend_summary to <= 20 Hz
    if (globalThis.currentTime - this.lastReport < 0.05) return;
    this.lastReport = globalThis.currentTime;
    const rms = Array.from(this.rmsOut);
    const activeSp = this.ringbus.active_voices;
    const at = now();
    new Promise((r) => r()).then(() => {
      this.port.postMessage({
        rend_summary: { now: at, rms, activeSp, rend_time },
      });
    });
  }
}
registerProcessor("spin-proc", SpinProcessor);

function now() {
  return globalThis.currentTime;
}
async function downloadData(stream, fl) {
  const reader = stream.getReader();
  let writeOffset = 0;
  let leftover = -1;
  const decode = (lo, hi) => {
    const int = lo | (hi << 8);
    return int & 0x8000 ? (int - 0x10000) / 0x8000 : int / 0x7fff;
  };
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value || !value.length) continue;
    let readIndex = 0;
    if (leftover >= 0) {
      fl[writeOffset++] = decode(leftover, value[readIndex++]);
      leftover = -1;
    }
    const pairs = readIndex + (((value.length - readIndex) >> 1) << 1);
    while (readIndex < pairs) {
      fl[writeOffset++] = decode(value[readIndex++], value[readIndex++]);
    }
    if (readIndex < value.length) leftover = value[readIndex];
  }
}
