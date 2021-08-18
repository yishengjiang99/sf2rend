export function pcmNode(pcm, ctx = new AudioContext()) {
  const node = new AudioBufferSourceNode(ctx, {
    buffer: new AudioBuffer({
      numberOfChannels: 1,
      length: pcm.length,
      sampleRate: ctx.sampleRate,
    }),
  });
  node.buffer.getChannelData(0).set(pcm);
  return node;
}
