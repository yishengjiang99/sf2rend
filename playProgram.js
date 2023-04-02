export function playZone(ctx, z, key) {
  const ab = new AudioBuffer({
    duration: z.shdr.nSamples / z.shdr.sampleRate,
    numberOfChannels: 1,
    sampleRate: z.shdr.sampleRate,
    length: z.shdr.nsamples,
  });
  ab.getChannelData(0).set(z.shdr.pcm);

  const abs = new AudioBufferSourceNode(ctx, {
    buffer: ab,
    loopStart: z.shdr.loops[0],
    channels: 2,
    loopEnd: z.shdr.loops[1],
    playbackRate: z.calcPitchRatio(key, ctx.sampleRate),
  });
  abs.connect(ctx.destination);
  abs.start(ctx.currentTime);
  abs.stop(ctx.currentTime + 3);
}
