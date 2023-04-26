export function anti_denom_dither(audioCtx) {

	const buffer = new AudioBuffer({
		numberOfChannels: 1,
		length: 1024,
		sampleRate: audioCtx.sampleRate,
	});

	// Fill the buffer with white noise;
	// just random values between -1.0 and 1.0
	for (let channel = 0;channel < 1;channel++) {
		// This gives us the actual array that contains the data
		const nowBuffering = buffer.getChannelData(channel);
		for (let i = 0;i < 1024;i++) {
			// Math.random() is in [0; 1.0]
			// audio needs to be in [-1.0; 1.0]
			nowBuffering[i] = (Math.random() * 2 - 1) * .0000001;
		}
	}

	// Get an AudioBufferSourceNode.
	// This is the AudioNode to use when we want to play an AudioBuffer
	const source = new AudioBufferSourceNode(audioCtx, {
		loop: true
	})
	// Set the buffer in the AudioBufferSourceNode
	source.buffer = buffer;
	return source;
}