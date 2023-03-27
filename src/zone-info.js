function createLFP(ctx, zone) {
  new BiquadFilterNode(ctx, {
    frequency: Math.min(
      Math.pow(2, zone.FilterFc / 1200) * 8.176,
      ctx.sampleRate / 2
    ),
    Q: zone.FilterQ / 10,
    type: "lowpass",
  });
}
