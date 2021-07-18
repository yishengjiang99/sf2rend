import {writeFileSync,readFileSync} from 'fs';
import {execSync} from 'child_process';
execSync(`emcc upsample.c -o upsample.wasm \
-s EXPORTED_RUNTIME_METHODS='["stackAlloc"]' \
-s EXPORTED_FUNCTIONS='["_init","_upsample_wave_table","_setRatio"]' --no-entry`);
writeFileSync(
  "upsample.js",
  /* javascript */ `
	// @prettier-ignore
export const wasmbin=new Uint8Array([${readFileSync("upsample.wasm").join(
    ","
  )}]);
export default function(){
	const module=new WebAssembly.Module(wasmbin);
	const instance = new WebAssembly.Instance(module, {env:{
		powf:Math.pow
	}});
	const heap = new Uint8Array(instance.exports.memory.buffer);


	return function *upsample(input, pitch, sampleRate){
		const output = instance.exports.stackAlloc(4096);
		const sampleRef = instance.exports.stackAlloc(input.byteLength);
		const ref = instance.exports.init(output, sampleRef, input.byteLength);
		const s16 = new Int16Array(input);
		const fl = new Float32Array(input.byteLength / 2);
		s16.forEach((v, i) => (fl[i] = v / 0xffff));
		heap.set(new Uint8Array(fl.buffer), sampleRef);
		instance.exports.setRatio(
			ref,
			sampleRate,
			Math.pow(2, (pitch - 69) / 12) * 440.0
		);
		
		if(instance.exports.upsample_wave_table(ref)==1){
			return new Float32Array(heap.buffer, output, 4096);
		}else{
			yield new Float32Array(heap.buffer, output, 4096);
		}
	}
}`
);