import { wasmbin } from "./spin.wasm.js";
import { readMidi } from "../midireadlib/midiread.js";
const CH_META_LEN = 24;
const nchannels = 32;
const REND_BLOCK = 128;
const KeyRangeIndex = 42,
  VelRangeIndex = 43;
interface KeyNumberArray {
  [key: number]: number[];
}
interface Spinner_t {
  ref: number;
  u32View: Uint32Array;
  output: Float32Array;
}
enum spinDone {
  DONE = 0,
  NOT_NODE = 1,
}
/* eslint-disable no-unused-vars */
// @ts-ignore
export class SpinProcessor extends AudioWorkletProcessor {
  memory: WebAssembly.Memory;
  zones: KeyNumberArray;
  channelPrograms: KeyNumberArray;
  activeNotes: { key: number; spinner: Spinner_t; channel: number }[];
  inst: WebAssembly.Instance;
  brk: number;
  malloc: (len: number) => number;
  presetRefs: number[];
  spinners: Spinner_t[];
  zoneFilters: KeyNumberArray;
  midiInfo: any;
  ticksPerQuarterNote: number;
  microSecondsPerQuarterNote: number;
  programs: any;
  playbackStart: any;
  microSecondPerQuarterNote: number;
  sdtaRef: (spId: any) => Uint32Array;
  api: {
    spin: CallableFunction;
    gm_reset: CallableFunction;
    trigger_attack: CallableFunction;
    eg_release: CallableFunction;
    pcms: WebAssembly.Global;
    set_midi_cc_val: CallableFunction;
    spRef: (idx) => number;
    pcmRef: CallableFunction;
  };
  port: any;
  fadeouts: any;
  constructor(options) {
    super(options);
    this.memory = new WebAssembly.Memory({
      maximum: 1024,
      initial: 1024,
    });
    this.zones = new Array(255).fill([]);
    this.channelPrograms = new Array(16);
    this.activeNotes = [];

    const imports = {
      memory: this.memory,
      debugFL: () => {},
    };
    this.inst = new WebAssembly.Instance(new WebAssembly.Module(wasmbin), {
      env: imports,
    });
    this.brk = 0x30000;
    this.malloc = (len) => {
      const ret = this.brk;
      this.brk += len;
      if (this.brk > this.memory.buffer.byteLength) throw "no mem";
      return ret;
    };
    this.api = {
      spin: this.inst.exports.spin as CallableFunction,
      gm_reset: this.inst.exports.gm_reset as CallableFunction,
      trigger_attack: this.inst.exports.trigger_attack as CallableFunction,
      eg_release: this.inst.exports.triggerRelease as CallableFunction,
      pcms: this.inst.exports.pcms as WebAssembly.Global,
      set_midi_cc_val: this.inst.exports.set_midi_cc_val as CallableFunction,
      spRef: (idx) => (this.inst.exports.spRef as CallableFunction)(idx),
      pcmRef: (idx) => {
        const ref = (this.inst.exports.pcmRef as CallableFunction)(idx);
        return [
          new Uint32Array(this.memory.buffer, ref, 5),
          new Int8Array(this.memory.buffer, ref + 20, 2),
        ];
      },
    };

    this.api.gm_reset();
    for (let i = 0; i < nchannels; i++) {
      const ref = this.api.spRef(i);
      const u32View = new Uint32Array(this.memory.buffer, ref, 16);
      this.spinners.push({
        u32View,
        ref,
        output: new Float32Array(this.memory.buffer, u32View[1]),
      });
    }
    this.presetRefs = [];
    this.port.onmessage = this.handleMsg.bind(this);
  }
  async handleMsg(e) {
    const { data } = e;
    if (data.stream && data.segments) {
      const {
        segments: {
          sampleId,
          nSamples,
          loops,
          sampleRate,
          originalPitch,
          pitchCorrection,
        },
        stream,
      } = data;
      const offset = this.malloc(4 * nSamples);
      const fl = new Float32Array(this.memory.buffer, offset, nSamples);
      await downloadData(stream, fl);
      const [arr1, arr2] = this.api.pcmRef(sampleId);
      arr1.set(
        new Uint32Array([loops[0], loops[1], nSamples, offset, sampleRate])
      );
      arr2.set(new Int8Array(originalPitch, pitchCorrection));
    } else if (data.zArr && data.presetId) {
      for (const { arr } of data.zArr) {
        const ptr = this.malloc(120);
        const zoneMem = new Int16Array(this.memory.buffer, ptr, 60);
        zoneMem.set(new Int16Array(arr));
        this.zones[data.presetId].push(ptr);
        this.zoneFilters[ptr] = [
          zoneMem[KeyRangeIndex] & 0x007f,
          (zoneMem[KeyRangeIndex] >> 8) & 0x7f,
          zoneMem[VelRangeIndex] & 0x007f,
          (zoneMem[VelRangeIndex] >> 8) & 0x7f,
        ];
      }
      this.port.postMessage({ zack: 1 });
    } else if (e.data.midiab) {
      this.midiInfo = readMidi(new Uint8Array(e.data.midiab));
      const { tempos, tracks, division, presets, ntracks } = this.midiInfo;
      this.ticksPerQuarterNote = division;
      this.microSecondsPerQuarterNote = tempos.length
        ? tempos.shift().tempo
        : 500000;
      const totalTicks = tracks
        .map((t) => t[t.length - 1])
        .reduce((lastEvent, eventt) => Math.max(eventt.t, lastEvent), 0);
      this.port.postMessage({ presets, totalTicks });
    } else {
      const [cmd, channel, ...args] = data;
      this.handleChannelMessage([cmd, channel, ...args]);
    }
  }

  handleChannelMessage(data) {
    const [a, b, c] = data;
    const stat = a >> 4;
    const ch = a & 0x0f;
    const key = b & 0x7f,
      vel = c & 0x7f;
    const release = (ch, key) => {
      this.activeNotes
        .filter((n) => n.channel == ch && n.key == key)
        .forEach((n, index) => {
          this.api.eg_release(n.spinner.ref);
          this.fadeouts.push(this.activeNotes.splice(index, 1));
        });
    };
    switch (stat) {
      case 0xb: //chan set/
        this.api.set_midi_cc_val(ch, key, vel);
        break;
      case 0xc: //change porg
        const pid = key,
          bankId = ch == 9 ? 128 : 0;
        this.channelPrograms[ch] = [pid, bankId];
        break;
      case 0x08:
        release(ch, key);
        break;
      case 0x09:
        if (vel == 0) {
          release(ch, key);
        } else {
          const [pid, bankId] = this.channelPrograms[ch];
          this.programs[pid | bankId]
            .filter((z) => {
              const [lokey, hikey, lovel, hivel] = this.zoneFilters[z];
              return lokey <= key && hikey > key && lovel <= vel && hivel > vel;
            })
            .map((z) => {
              if (this.spinners.length == 0) {
                console.warn("release polyphony limit of 64. note skipped ");
                return;
              }
              const spinner = this.spinners.shift();
              this.api.trigger_attack(spinner.ref, z, key, vel);
              this.activeNotes.push({
                channel: ch,
                spinner,
                key: key,
              });
            });
        }
        break;
      default:
        break;
    }
  }

  process(_, [[outputLeft, outputRight]]) {
    if (this.playbackStart != null) {
      // @ts-ignore
      const tick = currentTick(this.playbackStart);

      for (const track of this.midiInfo.tracks) {
        if (!track.length) continue;
        while (track.length && track[0].t <= tick) {
          const newevent = track.shift();
          if (newevent.channel) {
            this.handleChannelMessage(newevent.channel);
          }
        }
      }
    }
    for (let i = this.activeNotes.length - 1; i >= 0; i--) {
      const { spinner } = this.activeNotes[i];
      this.api.spin(spinner.ref, REND_BLOCK);
      for (let j = 0; j < 128; j++) {
        outputLeft[j] += spinner.output[2 * j];
        outputRight[j] += spinner.output[2 * j + 1];
      }
    }
    for (let i = this.fadeouts.length - 1; i >= 0; i--) {
      const { spinner } = this.fadeouts[i];

      const done = this.api.spin(spinner.ref, REND_BLOCK) == spinDone.DONE;
      for (let j = 0; j < 128; j++) {
        outputLeft[j] += spinner.output[2 * j];
        outputRight[j] += spinner.output[2 * j + 1];
      }
      if (done) this.spinners.push(this.fadeouts.splice(i, 1).spinner);
    }

    return true;
  }
}
//@ts-ignore
registerProcessor("spin-proc", SpinProcessor);

function currentTick(playbackStart) {
  const currentFrame = global.currentFrame;

  return (
    (((currentFrame - playbackStart) * 128) /
      global.sampleRate /
      this.microSecondPerQuarterNote) *
    this.ticksPerQuarterNote
  );
}
async function downloadData(
  stream: ReadableStream<Uint8Array>,
  fl: Float32Array
) {
  const reader = stream.getReader();
  let writeOffset = 0;
  let leftover;
  const decode = function (s1, s2) {
    const int = s1 + (s2 << 8);
    return int > 0x8000 ? -(0x10000 - int) / 0x8000 : int / 0x7fff;
  };
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      await reader.closed;
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
function pool() {
  const _arr = [];
}
