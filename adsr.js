export default function mkEnvelope(ctx, zone) {
  const volumeEnveope = new GainNode(ctx, { gain: 0 });
  let delay, attack, hold, decay, release, gainMax, sustain;

  function setZone(zone) {
    [delay, attack, hold, decay, release] = [
      zone.VolEnvDelay,
      zone.VolEnvAttack,
      zone.VolEnvHold,
      zone.VolEnvDecay,
      zone.VolEnvRelease,
    ].map((v) =>
      v == -1 ? 0.001 : v <= -12000 ? 0.001 : Math.pow(2, v / 1200)
    );
    gainMax = 1 * Math.pow(10, zone.Attenuation * -0.005);
    sustain = Math.pow(10, zone.Attenuation * -0.005);
    console.log(gainMax);
  }
  setZone(zone);

  return {
    set zone(zone) {
      setZone(zone);
    },
    keyOn() {
      volumeEnveope.gain.linearRampToValueAtTime(gainMax, attack);

      if (sustain > 0) {
        this.sustainTime = delay + attack + hold + decay;
        volumeEnveope.gain.linearRampToValueAtTime(sustain, this.sustainTime);
      }
    },
    keyOff() {
      volumeEnveope.gain.cancelScheduledValues(0);
      //   console.log(release + "rel");
      volumeEnveope.gain.exponentialRampToValueAtTime(0.0000001, release);
    },
    gainNode: volumeEnveope,
  };
}