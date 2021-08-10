export function crossfade(ctx, { fade } = {}) {
  const steroPan = new StereoPannerNode(ctx, { pan: (fade || 0.5) * 2 - 1 });
  const split = new ChannelSplitterNode(ctx, { numberOfOutputs: 2 });
  const g1 = new GainNode(ctx);
  const g2 = new GainNode(ctx);
  const unitysigt = new AudioBufferSourceNode(ctx, {
    buffer: new AudioBuffer({
      numberOfChannels: 1,
      length: 24,
      sampleRate: ctx.sampleRate,
    }),
    loop: true,
  });
  unitysigt.buffer.getChannelData(0).set(new Float32Array(24).fill(1.0));
  const output = new GainNode(ctx, { gain: 1 });
  unitysigt.connect(steroPan);
  steroPan.connect(split);
  split.connect(g1.gain, 0);
  g1.connect(output);
  split.connect(g2.gain, 1);
  g2.connect(output);
  unitysigt.start();
  var _sig1, _sig2;
  return {
    set sig1(node) {
      if (_sig1) _sig1.disconnect();
      _sig1 = node;
      _sig1.connect(g1);
    },
    set sig2(node) {
      if (_sig2) _sig2.disconnect();
      _sig2 = node;
      _sig2.connect(g2);
    },
    set fade(val) {
      steroPan.pan.setValueAtTime(val * 2 - 1, ctx.currentTime);
    },
    get fadeParam() {
      return steroPan.pan;
    },
    get fade() {
      return steroPan.pan;
    },
    get pan() {
      return steroPan;
    },
    connect(des) {
      output.connect(des);
    },
  };
}
