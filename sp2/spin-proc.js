import { downloadData } from "./downloadData.js";
import { wasmbin } from "./spin2.wasm.js";

class SpinProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);

    const module = new WebAssembly.Module(wasmbin);
    this.instance = new WebAssembly.Instance(module);
    this.sampleIdRefs = [];
    this.memory = this.instance.exports.memory;

    this.presetRefs = [];
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
    this.spinners = [];
    this.port.onmessage = async ({ data }) => {
      if (data.stream && data.segments) {
        await this.loadsdta(data);
        this.port.postMessage({ zack: 2 });
      } else if (data.zArr && data.presetId !== null) {
        for (const { arr, ref } of data.zArr) {
          this.setZone(ref, arr, data.presetId); //.set
        }
      } else {
        const [cmd, channel, ...args] = data;
        switch (cmd) {
          case 0xb0:
            break;
          case 0x80: {
            const [key, velocity] = args;
            this.instance.exports.trigger_release(channel, key, velocity);
            this.port.postMessage({ ack: [0x80, channel] });
            break;
          }
          case 0x90:
            {
              const [key, velocity, [presetId, zoneRef]] = args;
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
              const spIO = new Uint32Array(this.memory.buffer, spref, 5);
              const inputf = new Float32Array(
                this.memory.buffer,
                spIO[1],
                1024
              );
              console.log(spIO, spref, inputf);
              this.port.postMessage({ zack: 1 });
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
    console.log(
      "shref",
      new Uint32Array([
        loops[0],
        loops[1],
        nSamples,
        sampleRate,
        originalPitch,
        flRef,
      ])
    );
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
    console.log(
      atr[53],
      new Uint32Array(
        this.memory.buffer,
        this.instance.exports.pcmRef(atr[53]),
        6
      )
    );
  }

  process(_, outputs) {
    if (this.instance.exports.queue_count() == 0) return true;
    this.instance.exports.sp_run_all();
    outputs.forEach((output, channel) => {
      const outputff = this.outputfs(channel);
      output[0].set(outputff[0]);
      output[1].set(outputff[1]);
    });
    // console.log(this.outputfs(0)[0].filter((v) => v != 0));

    return true;
  }
}

registerProcessor("spin-proc2", SpinProcessor);
