import { pcmNode } from "./pcm-node.js";
export async function fftbm(pcm, params) {
  const { sampleRate, order, output } = {
    ...params,
    ...{
      sampleRate: 44100,
      order: 12,
      output: new Float32Array(2024),
    },
  };
  const ctx = new OfflineAudioContext(1, pcm.length, sampleRate);
  const analyserNode = new AnalyserNode(ctx, { fftSize: 32 });
  analyserNode.smoothingTimeConstant = 0;
  const node = new AudioBufferSourceNode(ctx, {
    buffer: new AudioBuffer({
      numberOfChannels: 1,
      length: pcm.length,
      sampleRate: ctx.sampleRate,
    }),
  });
  node.buffer.getChannelData(0).set(pcm);
  const osc = new OscillatorNode(ctx, { type: "sine", frequency: 32 });

  osc.start();
  osc.connect(analyserNode).connect(ctx.destination);
  node.start();
  const ab = await ctx.startRendering();
  analyserNode.getFloatFrequencyData(output);
  analyserNode.getFloatFrequencyData(output);
  analyserNode.getFloatFrequencyData(output);
  analyserNode.getFloatFrequencyData(output);

  return { fl: ab.getChannelData(0), fft: output };
}
