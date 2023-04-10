
export function mk_lpf_fade(lpfMod) {
	const imports = {
		sinf: (x) => Math.sin(x),
		cosf: (x) => Math.cos(x),
		sinhf: (x) => Math.sinh(x),
	};
	// making two biquads for cross fading
	// because it's too hard to do sinhf 44100 times per second
	// actually need fo
	const lpfs = [
		new WebAssembly.Instance(lpfMod, {env: imports}).exports,
		new WebAssembly.Instance(lpfMod, {env: imports}).exports,
	];
	const lpfs_r = [new WebAssembly.Instance(lpfMod, {env: imports}).exports,
	new WebAssembly.Instance(lpfMod, {env: imports}).exports];
	function initialize(fc, q) {
		lpfs.forEach(l => l.initialize(fc, 1));
		lpfs_r.forEach(l => l.initialize(fc, 1));
	}
	const swap = () => {

		lpfs.push(lpfs.shift());
		lpfs_r.push(lpfs_r.shift());
	};

	let cross_fade = 0;

	function process(fl_array, n, ch) {

		const sets = ch ? lpfs_r : lpfs;
		if (cross_fade) {
			for (let i = 0;i < fl_array.length;i++) {
				const f1 = sets[0].BiQuad(fl_array[i]);
				const f2 = sets[1].BiQuad(fl_array[i]);
				fl_array[i] = f1 + (f2 - f1) * i / 64;
				cross_fade--;
			}
			if (cross_fade <= 0) swap();
		} else {
			for (let i = 0;i < fl_array.length;i++) {
				fl_array[i] = sets[0].BiQuad(fl_array[i]);
			}
		}


	}
	function fade_to(fc, n) {
		lpfs[1].set_fc(fc);
		lpfs_r[1].set_fc(fc);

		//we have to do it twice for L & R
		cross_fade = n * 2;
	}
	return {
		fade_to,
		process,
		set_fc: lpfs[0].set_fc,
		initialize,
		dealloc: () => { }
	};
}
