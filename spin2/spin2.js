import * as Spin from './spin.wasm.js';
let module, memory;
export async function wsmodule() {
	if (!module) module = await WebAssembly.compile(Spin.wasmbin);
	if (!memory) memory = new WebAssembly.Memory({initial: 2, maximum: 2, shared: true});
	return {module, memory};
}
export async function mkInstance() {
	const {module, memory} = await wsmodule();
	return await WebAssembly.instantiate(module, {
		env: {
			memory,
			mem2: new WebAssembly.Memory({
				initial: 10,
				maximum: 10
			})
		}
	})
}
export class SpinNode extends AudioWorkletNode {
	static async init(ctx) {
		await ctx.audioWorklet.addModule("spin2/spin2-proc.js");
		await wsmodule();
	}
	constructor(ctx) {
		super(ctx, "spin-proc", {
			numberOfInputs: 0,
			numberOfOutputs: 2,
			outputChannelCount: [2, 4]
		});
		this.port.onmessageerror = (e) => alert("adfasfd", e.message); // e; // e.message;
	}
	handleMsg(e) {
		console.log(e.data);
	}
}
