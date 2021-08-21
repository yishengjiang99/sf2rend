import { effects } from "./midilist.js";
export function mkEnvelope(ctx) {
  const volumeEnveope = new GainNode(ctx, { gain: 0 });
  let delay, attack, hold, decay, release, gainMax, sustain, _midiState, _zone;
  function setZone(zone) {
    [delay, attack, hold, decay, release] = [
      zone.VolEnvDelay,
      zone.VolEnvAttack,
      zone.VolEnvHold,
      zone.VolEnvDecay,
      zone.VolEnvRelease,
    ].map((v) => (v == -1 || v <= -12000 ? 0.0001 : Math.pow(2, v / 1200)));
    sustain = Math.pow(10, zone.VolEnvSustain / -200);
    _zone = zone;
  }
  return {
    set zone(zone) {
      setZone(zone);
    },
    set midiState(staet) {
      _midiState = staet;
    },
    keyOn(vel) {
      const sf2attenuate = Math.pow(10, _zone.Attenuation * -0.005);
      const midiVol = _midiState[effects.volumecoarse] / 128;
      const midiExpre = _midiState[effects.expressioncoarse] / 128;
      gainMax = (sf2attenuate * midiVol * midiExpre * vel) / 128;

      volumeEnveope.gain.linearRampToValueAtTime(gainMax, delay + attack);
      if (decay > 0.001)
        volumeEnveope.gain.linearRampToValueAtTime(
          gainMax * (1 - sustain),
          delay + attack + hold + decay
        );
      console.log({ phases: [attack, decay, sustain, release], peak: gainMax });
      return { phases: [attack, decay, sustain, release], peak: gainMax };
    },
    keyOff() {
      volumeEnveope.gain.linearRampToValueAtTime(0.0, release);
    },
    gainNode: volumeEnveope,
  };
}
