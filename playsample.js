const cent2sec = (cent) => Math.pow(2, cent / 1200);
// const han = function (n, points) { return 0.5 - 0.5*Math.cos(2*Math.PI*n/(points-1));
//   const hanwindow = Range(0,4096).map(i=>han(i,4096));

//   console.log(hanwindow);
export async function run_sf2_smpl(shdr, zone, smplData) {
  const ctx = new OfflineAudioContext(1, 1 * shdr.sampleRate, shdr.sampleRate);
  const audb = ctx.createBuffer(2, smplData.length, shdr.sampleRate);
  audb.getChannelData(0).set(smplData);
  const [startloop, endloop] = shdr.loops;
  //ratio=((float)sh->sampleRate / (float)frequency(sh->originalPitch)) / 4096.0f
  const abs = new AudioBufferSourceNode(ctx, {
    buffer: audb,
    loop: true,
    loopStart: startloop / shdr.sampleRate,
    loopEnd: endloop / shdr.sampleRate,
    playbackRate: 1,
  });
  let lpf = new BiquadFilterNode(ctx, {
    frequency: Math.min(
      Math.pow(2, zone.FilterFc / 1200) * 8.176,
      ctx.sampleRate / 2
    ),
    Q: zone.FilterQ / 10,
    type: "lowpass",
  });
  const modEnvelope = new GainNode(ctx, { gain: 0 });
  modEnvelope.connect(lpf.frequency);
  if (zone.ModEnvAttack > -12000) {
    modEnvelope.gain.linearRampToValueAtTime(1, cent2sec(zone.ModEnvAttack));
  } else {
    modEnvelope.gain.value = 1.0;
  }
  modEnvelope.gain.setTargetAtTime(
    1 - zone.ModEnvSustain / 1000,
    cent2sec(zone.ModEnvDecay),
    0.4
  );
  const volumeEnveope = new GainNode(ctx, { gain: 0 });
  volumeEnveope.gain.linearRampToValueAtTime(
    Math.pow(10, zone.Attenuation / 200),
    Math.pow(2, zone.VolEnvAttack / 1200)
  );
  volumeEnveope.gain.setTargetAtTime(
    1 - zone.VolEnvSustain / 1000,
    Math.pow(2, zone.VolEnvDecay / 1200),
    0.4
  );
  const releaseTime = Math.pow(2, zone.VolEnvRelease / 1200);
  abs
    .connect(volumeEnveope)
    .connect(lpf)
    .connect(analyser)
    .connect(ctx.destination);
  abs.start();
  return {
    ab: ctx.startRendering(),
    analyser,
  };
}
