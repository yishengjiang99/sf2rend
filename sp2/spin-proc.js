import { downloadData } from "./downloadData.js";
import { wasmbin } from "./spin2.wasm.js";
import saturation from "../saturation/index.js";
const EG_DONE = 7;

class SpinProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    const module = new WebAssembly.Module(wasmbin);
    this.instance = new WebAssembly.Instance(module, {
      env: {
        saturate: (input) => saturation(0.9, input),
      },
    });
    this.sampleIdRefs = [];
    this.memory = this.instance.exports.memory;
    this.presetRefs = [];
    this.spinners = new Array(16).fill(new Map());
    this.outputfs = (ch) => {
      return [
        new Float32Array(
          this.memory.buffer,
          this.instance.exports.outputs.value + ch * 2 * 128 * 4,
          128
        ),
        new Float32Array(
          this.memory.buffer,
          this.instance.exports.outputs.value + ch * 2 * 128 * 4 + 128 * 4,
          128
        ),
      ];
    };
    this.port.onmessage = async ({ data }) => {
      if (data.stream && data.segments) {
        await this.loadsdta(data);
        this.port.postMessage({ zack: 2 });
      } else if (data.zArr && data.presetId !== null) {
        for (const { arr, ref } of data.zArr) {
          this.setZone(ref, arr, data.presetId); //.set
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
      } else {
        console.log(data);
        const [cmd, channel, ...args] = data;
        switch (cmd) {
          case 0xb0:
            break;
          case 0x80: {
            const [key, velocity] = args;

            if (this.spinners[channel].has(key)) {
              this.instance.exports.trigger_release(
                this.spinners[channel].get(key),
                velocity
              );
            }
            this.port.postMessage({ zack: "kf" });

            break;
          }
          case 0x90:
            {
              const [key, velocity, [presetId, zoneRef], ratio] = args;
              const zonePtr = this.presetRefs[presetId]?.[zoneRef];
              if (null == zonePtr) {
                console.error("cannot find present zoneref", presetId, zoneRef);
                return;
              }
              const spref = this.instance.exports.trigger_attack(
                channel,
                key,
                velocity,
                zonePtr
              );
              this.spinners[channel].set(key, spref);

              this.port.postMessage({
                zack: 1,
                ref: zoneRef,
                arr: new Int16Array(this.memory.buffer, zonePtr, 60),
                channel,
                key,
              });
              console.log(channel, this.spinners[channel], key);
            }
            break;
          default:
            break;
        }
      }
    };
  }
  async loadsdta(data) {
    const {
      segments: { sampleId, nSamples, loops, originalPitch, sampleRate },
      stream,
    } = data;
    const flRef = this.instance.exports.malloc(nSamples * 4);

    const shdrref = this.instance.exports.new_pcm(sampleId, flRef);
    const shdrArray = new Uint32Array(this.memory.buffer, shdrref, 6);
    shdrArray.set(
      new Uint32Array([
        loops[0],
        loops[1],
        nSamples,
        sampleRate,
        originalPitch,
        flRef,
      ])
    );

    const fl = new Float32Array(this.memory.buffer, flRef, nSamples);
    await downloadData(stream, fl);
  }
  setZone(ref, arr, presetId) {
    const ptr = this.instance.exports.new_zone();
    if (this.presetRefs[presetId] == null) {
      this.presetRefs[presetId] = {};
    }
    this.presetRefs[presetId][ref] = ptr;
    const atr = new Int16Array(this.memory.buffer, ptr, 60);
    atr.set(new Int16Array(arr, 0, 60));
  }

  process(_, outputs) {
    if (!this.instance) return true;
    this.instance.exports.ob_clear();
    for (let i = 0; i < 16; i++) {
      for (const [key, spref] of this.spinners[i].entries()) {
        const stage = this.instance.exports.sp_run(spref);
        if (stage >= EG_DONE) {
          this.instance.exports.free(this.spinners[i][key]);
          this.spinners[i].delete(key);
        }
      }
    }
    outputs.forEach((output, channel) => {
      const outputff = this.outputfs(channel);
      output[0].set(outputff[0]);
      output[1].set(outputff[1]);
    });

    return true;
  }
}

registerProcessor("spin-proc2", SpinProcessor);
