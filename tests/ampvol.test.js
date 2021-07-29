describe("ampvol", () => {
  it("a", async () => {
    const sf2 = await load("file.sf2");
    const { shdrMap, zMap, preload, filterKV } = sf2.loadProgram(0, 0);
    await preload();
    filterKV(55, 88).forEach(async (v) => {
      const sr = v.shdr.sampleRate;
      const ctx = new OfflineAudioContext(2, sr * 2, sr);
      await SpinNode.init(ctx);
      const ampvol = mkEnvelope(ctx, v);
      const spinner = new SpinNode(ctx, { pcm: v.pcm, loops: v.shdr.loops });
      spinner.connect(ampvol.gainNode).connect(ctx.destination);
      ampvol.keyOn();
      ampvol.keyOff(0.5);

      return await ctx.startRendering();
    });
  });
});
