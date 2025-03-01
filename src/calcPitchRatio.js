export default function calcPitchRatio(key, outputSampleRate, zone) {
  const rootkey =
    zone.OverrideRootKey > -1 ? zone.OverrideRootKey : zone.shdr.originalPitch;
  const samplePitch = rootkey * 100 + zone.CoarseTune * 100 + zone.FineTune * 1;
  const pitchDiff = (key * 100 - samplePitch) / 1200 + zone.shdr.sampleRate - outputSampleRate;

  const r = Math.pow(2, pitchDiff) * (zone.shdr.sampleRate / outputSampleRate);
  return r;
}
