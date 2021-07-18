const samples_per_frame = 128;
const bytesPerFrameOutput = samples_per_frame * 2 * Float32Array.BYTES_PER_ELEMENT;


const {
	exports: { apply_zone, ctx_size, init_ctx, render, set_sample_data, set_sample_list, get_output },
} = new WebAssembly.Instance(new WebAssembly.Module(wasmBinary), {
	env: {
		malloc: sbrk,
		memory,
		powf: Math.pow,
		sqrtf: Math.sqrt,
		exp2f: (x) => Math.pow(2, x),
		perror: (x) => alert(x),
	},
});
const structSize = ctx_size();
const rendctx = sbrk(structSize);
const outputBuffer = get_output(rendctx);
init_ctx(rendctx);
let zoneInput = sbrk(60 * Int16Array.BYTES_PER_ELEMENT);
const inputZoneBuffer = new Int16Array(heap, zoneInput, 60 * Int16Array.BYTES_PER_ELEMENT);

function initsdta(sdtaStream, nsamples) {
	const pointr = sbrk(nsamples * Float32Array.BYTES_PER_ELEMENT);
	let offset = pointr;
	while (true) {
		const { done, value } = reader.read();
		if (done) break;
		const dv = new DataView(value.buffer);
		for (let i = 0; i < value.byteLength - 2; i += 2)
			heap[offset++] = dv.getInt16(2 * i, true) / 0x7fff;
	}
	return pointr;
}

function msgHandler(e) {
	const { sdtaStream, nSamples, zone, note } = e.data;
	if (sdtaStream && nSamples) {
		initsdta(sdtaStream, nSamples);
	}
	if (zone && note) {
		heap.set(heap, zoneInput, zone.generators);
		apply_zone(rendCtx, zoneInput, note.channel, note.key, note.velocity);
	}
}
class RenderProcessor extends AudioWorkletProcessor {
	constructor() {
		super();
		this.port.onmessageerror = console.log;
		this.port.onmessage = msgHandler.bind(this);
	}
	process(input, outputs) {
		render(rendctx);
		const flrr = new Float32Array(heap.buffer, rendctx);
		for (let j = 0; j < 128; j++) {
			outputs[0][0][j] = flrr.getFloat32(j * 4, true); //[i];
		}
	}
}
registerProcessor("rend-proc", RenderProcessor);
