import Module from "../upsampler/upsample.js";
export async function awncontroller(ctx, sf2service) {
	const upsampler = Module();
	const zone = new SharedArrayBuffer(240+16*80);
	const midistate = new Uint8Array(zone, 0, 16*8);

	const oscState = new Uint8Array(zone,240, 16*80);
	const wasmBinary= new Uint8Array(await(await fetch("spin-oscillators/build/wavetable_oscillator.wasm")).arrayBuffer())
	try{
		await ctx.audioWorklet.addModule("spin-oscillators/audio-thread.js");
	}	catch(e){
		console.log(e);
		return;
	}
	//const mem = new WebAssembly.Memory({initial:180,maximum:180});
	const proc = new AudioWorkletNode(ctx, "rendproc", {
		numberOfInputs:0,
		numberOfOutputs:16,
		outputChannelCount:[2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
		processorOptions: {
			zone: zone,
			wasmBinary,

		},
	});
	const gains = new Array(16).fill(new GainNode(ctx,{gain:0}));
	const mix = new GainNode(ctx);
	proc.onmessage=(e)=>window.stdout(JSON.stringify(e.data));
	proc.onprocessorerror = console.error;
	for(let i=0;i<16;i++) proc.connect(gains[i],i,0).connect(mix);
	mix.connect(ctx.destination);

	function loadProgram(channel, pid){
		const pref=sf2service.setProgram(pid,channel);
		const iter = sf2service.zoneSampleHeaders(pref);
		
		async function *fetchIter(iter){
			for (const sh of iter) {
					const {range,sampleRate,originalPitch}=sh;
				const res= await fetch("file.sf2", { headers: { Range: range} });
				const ab = await res.arrayBuffer();
				const upsampled_iter=upsampler.upsample(ab,originalPitch,sampleRate)
				yield await((async()=>{
					for(const table of await upsampled_iter){
						console.log(table);
					}	
				}))();
			}
		}
		fetchIter(iter);
	}
	function keyOn(channel,midi, vel){
			const zref=sf2service.keyOn(channel,midi,vel);
			const zone=sf2service.zref2Zone(zref);
			const peak = Math.pow(10, zone.Attenuation*-0.05);
			const hold =  Math.pow(2, zone.VolEnvHold / 1200);
			const delay = 	Math.pow(2, zone.VolEnvDelay / 1200);
			const attack =  Math.pow(2, zone.VolEnvAttack / 1200);
			const decay = 	Math.pow(2, zone.VolEnvDecay / 1200);
			const sustain = Math.pow(10, -1*zone.VolEnvSustain/200);
			midistate[channel*4]=midi;
			midistate[channel*4+1]=vel;
			gains[channel].gain.linearRampToValueAtTime(peak, ctx.currentTime+attack+delay);
			gains[channel].gain.setTargetAtTime(sustain, ctx.currentTime+attack+delay+hold+decay);
	}
	function keyOff(channel){
		gains[channel].gain.cancelAndHoldAtTime(ctx.currentTime+0.001);
		gains[channel].gain.setTargetAtTime(0,.3);
	}
	return {
		keyOn, keyOff, oscState,loadProgram
	}
}
