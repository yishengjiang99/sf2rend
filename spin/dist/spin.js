const channels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
export class SpinNode extends AudioWorkletNode {
  sb;
  sdv;
  static async init(ctx) {
    await ctx.audioWorklet.addModule("spin/dist/proc.js");
  }
  constructor(ctx) {
    const sb = new SharedArrayBuffer(1024 * 16);
    super(ctx, "spin-proc", {
      numberOfInputs: 0,
      numberOfOutputs: 16,
      outputChannelCount: channels.map((ch) => 2),
      processorOptions: { sb },
    });
    this.sb = sb;
    this.sdv = new DataView(sb);
  }
  keyOn(ch, key, vel, zone, midiVolume, midiExpression) {
    const [delay, attack, hold, decay, release] = [
      zone.VolEnvDelay,
      zone.VolEnvAttack,
      zone.VolEnvHold,
      zone.VolEnvDecay,
      zone.VolEnvRelease,
    ].map((v) =>
      v == -1 ? 0.001 : v <= -12000 ? 0.001 : Math.pow(2, v / 1200)
    );
    const gainMax =
      2 *
      Math.pow(
        10,
        (zone.Attenuation + midiVolume * 10 + midiExpression * 10) * -0.005
      );
    const sustain = gainMax * Math.pow(10, zone.VolEnvSustain * -0.005);
    //@ts-ignore
    this.parameters.get("sample_id_" + ch).setValueAtTime(zone.SampleId, ch);
    //@ts-ignore
    const amp = this.parameters.get("amp_" + ch);
    amp.cancelScheduledValues(0);
    amp.linearRampToValueAtTime(gainMax, attack + delay);
    amp.setTargetAtTime(sustain, attack + delay + hold, decay);
    //@ts-ignore
    const pitchCtrl = this.parameters.get("stride_" + ch);
    pitchCtrl.setValueAtTime(zone.pitchRatio(key), calc_portamonto());
  }
  keyOff(ch, zone) {
    //@ts-ignore
    const amp = this.parameters.get("amp_" + ch);
    amp.cancelScheduledValues(0.01);
    amp.linearRampToValueAtTime(0, Math.pow(2, zone.VolEnvRelease / 1200));
  }
}
//TODO: get from midistate + mod env
function calc_portamonto() {
  return 0.01;
}
