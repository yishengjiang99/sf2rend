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
    ].map((v) => (v == -1 || v <= -12000 ? 0.001 : Math.pow(2, v / 1200)));
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
    keyOn(time) {
      const sf2attenuate = Math.pow(10, _zone.Attenuation * -0.005);
      const midiVol = _midiState[effects.volumecoarse] / 128;
      const midiExpre = _midiState[effects.expressioncoarse] / 128;
      gainMax = 1 * sf2attenuate * midiVol * midiExpre;

      volumeEnveope.gain.linearRampToValueAtTime(
        gainMax,
        time - ctx.currentTime + delay + attack
      );
      volumeEnveope.gain.linearRampToValueAtTime(
        sustain,
        time - ctx.currentTime + attack + hold + decay
      );
    },
    keyOff() {
      volumeEnveope.gain.cancelScheduledValues(0);
      //   console.log(release + "rel");
      volumeEnveope.gain.linearRampToValueAtTime(0.0, release);
    },
    gainNode: volumeEnveope,
  };
}
