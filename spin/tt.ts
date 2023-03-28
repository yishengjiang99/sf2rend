import saturate from "../saturation/index.js";
import { wasmbin } from "./spin.wasm.js";
class AudioWorkletProcessor {
  constructor(options) {}
}
class SpinProcessor extends AudioWorkletProcessor {
  exports: {
    gm_reset: any;
  };
  constructor(options) {
    super(options);
    this.setup_wasm();
    this.exports.gm_reset();
    this.port.onmessage = this.handleMsg.bind(this);
    this.spinners = [];
    this.outputs = [];
    this.midiccRef = this.exports.midi_cc_vals;
    this.port.postMessage({ init: 1 });
  }
  setup_wasm() {
    this.memory = new WebAssembly.Memory({
      maximum: 1024 * 4,
      initial: 1024 * 4,
    });
    const imports = {
      memory: this.memory,
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
    return {
      instance: this.inst,
      memory: this.memory,
      malloc: this.malololc,
      exports: this.inst.exports,
    };
  }
  async handleMsg(e) {
    const { data } = e;
    if (data.stream && data.segments) {
      const { stream, segments } = data;
      const sampleId = await this.sp.loadSampleData({ stream, segments });
      this.port.postMessage({ ack: { sample: sampleId } });
    } else if (data.zArr) {
      for (const { arr, ref } of data.zArr) {
        this.sp.setZone(ref, arr);
      }
      this.port.postMessage({ zack: 1 });
    } else if (data.cmd) {
      switch (data.cmd) {
        case "reset":
          this.sp = this.setup_wasm();
          //fallthrough
          break;
        case "panic":
          this.exports.gm_reset();
          break;
        case "newZone":
          this.sp.setZone(data.zone.ref, data.zone.arr);
          this.port.postMessage({ ack: this.sp.getZone(data.zone.ref) });
          break;
      }
    } else {
      const [cmd, channel, ...args] = data;
      const [metric, value] = args;
      const [zref, zone_attr, new_val] = args;
      switch (cmd) {
        case "set_z_attr":
          this.sp.setZoneAttribute(zref, zone_attr, new_val);
          break;
        case 0xb0:
        case 0x00b0:
          this.inst.exports.set_midi_cc_val(channel, metric, value);
          break;
        case 0x80:
        case 0x0080:
          this.inst.exports.eg_release(channel);
          this.port.postMessage({ ack: [0x80, channel] });
          break;
        case 0x9000: {
          const [cmd, channel, ratio, velocity, zoneRef] = data;
          this.triggerAttack(zoneRef, ratio, velocity, channel, cmd);
          break;
        }
        case 0x0090:
          {
            const [zoneRef, ratio, velocity] = args;
            this.triggerAttack(zoneRef, ratio, velocity, channel);
          }
          break;
        default:
          break;
      }
    }
  }
  triggerAttack(zoneRef, ratio, velocity, ch) {
    if (!this.sp.zoneRef(zoneRef)) {
      this.port.postMessage({ panick: "cannot find zone ref" });
    }
    this.spinners[ch] = this.sp.get_available_spinner(ch);
    if (this.spinners[ch] == 0) {
      this.port.postMessage({ panick: "cannot reserve open spinner" });
    }
    this.inst.exports.set_spinner_zone(
      this.spinners[ch],
      this.presetRefs[zoneRef]
    );
    this.inst.exports.trigger_attack(this.spinners[ch], ratio, velocity);
  }

  instantiate(i) {
    console.log("instant sp", i);
    this.spinners[i] = this.inst.exports.newSpinner(i);
    const spIO = new Uint32Array(this.memory.buffer, this.spinners[i], 3);
    this.spState[i] = new Uint32Array(
      this.memory.buffer,
      this.spinners[i] + 12,
      4
    );
    this.outputs[i] = new Float32Array(this.memory.buffer, spIO[1], 128 * 2);
    return this.spinners[i];
  }

  process(inputs, outputs) {
    for (let i = 0; i < 32; i++) {
      const chid = Math.floor(i / 2);
      // if (this.eg_vol_stag[i] === 9999) continue;
      if (!this.spinners[i]) continue;
      if (!this.outputs[i]) continue;
      this.outputs[i].set(new Float32Array(128 * 2).fill(0));

      this.eg_vol_stag[i] = this.inst.exports.spin(this.spinners[i], 128);
      for (let j = 0; j < 128; j++) {
        outputs[chid][0][j] += saturate(this.outputs[i][2 * j]);
        outputs[chid][1][j] += saturate(this.outputs[i][2 * j + 1]);
      }
    }
    if (!this.lastReport || globalThis.currentFrame - this.lastReport > 4400) {
      this.lastReport = globalThis.currentFrame;
      new Promise((r) => r()).then(() => {
        this.port.postMessage({ currentFrame: globalThis.currentFrame });
      });
    }

    return true;
  }
}
registerProcessor("spin-proc", SpinProcessor);
