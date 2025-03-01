import SpinProcessor from './spin-proc.js';
import {wasmbin} from "./spin.wasm.js";
import {midi_ch_cmds} from "../src/midilist.js";
import {egStruct, spRef2json} from "./spin-structs.js";

let k, lpfmod;


function registerProcessor(name, processorCtor) {
  return `console.log(globalThis);\n${processorCtor};\nregisterProcessor('${name}', ${processorCtor.name});`;
}
export class SpinNode extends AudioWorkletNode {
  static lpfmod;
  static async init(ctx) {
    try {
      const procUrl = URL.createObjectURL(
        new Blob([registerProcessor("spin-proc", SpinProcessor)], {
          type: "application/javascript",
        }),
        {type: "module"}
      );
      await ctx.audioWorklet.addModule(procUrl);
      //lpfmod = await WebAssembly.compile(lpfModule.wasmbin);
    } catch (e) {
      console.trace(e);
    }
  }
  static alloc(ctx) {
    if (!k) k = new SpinNode(ctx);
    return k;
  }
  constructor(ctx) {
    super(ctx, "spin-proc", {
      numberOfInputs: 1,
      numberOfOutputs: 20,
      outputChannelCount: [...Array(18).fill(2), 1, 1],
      processorOptions: {
        wasmbin, midi_ch_cmds
      }
    });
    this.port.onmessageerror = (e) => alert("adfasfd", e.message); // e; // e.message;
  }
  async shipProgram(sf2program, presetId) {
    await sf2program.fetch_drop_ship_to(this.port);
    await this.postZoneAttributes(sf2program, presetId);
  }
  async postZoneAttributes(sf2program, presetId) {
    this.port.postMessage({
      presetId,
      zArr: sf2program.zMap.map((z) => {
        const shz = new Int16Array(60);
        shz.set(z.arr);
        return {
          arr: shz.buffer,
          ref: z.ref,
        };
      }),
    });
  }
  handleMsg(e) {
    console.log(e.data);
  }
}
