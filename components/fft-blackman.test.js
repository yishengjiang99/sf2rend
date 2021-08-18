import { fftbm } from "./fftblackman.js";
import { load } from "../sf2-service/read.js";
import { loadProgram } from "../sf2-service/read.js";
import { chart, mkcanvas, renderFrames } from "../chart/chart.js";

export const tb = () => {
  promise_test(async () => {
    const ctx = new AudioContext();
    const sf2 = await load("../sf2-service/file.sf2");
    const pg = loadProgram(sf2, 0, 0);
    const bins = new Float32Array(4096);
    const smp = await pg.zMap[4].pcm;
    const cx = mkcanvas();

    // const z = pg.filterKV(44, 22);
    // debugger;const ctx = new OfflineAudioContext(1, pcm.length, sampleRate);
    const analyserNode = new AnalyserNode(ctx, { fftSize: 4096 });
    analyserNode.smoothingTimeConstant = 0;
    const node = new AudioBufferSourceNode(ctx, {
      buffer: new AudioBuffer({
        numberOfChannels: 1,
        length: smp.length,
        sampleRate: ctx.sampleRate,
      }),
    });
    node.buffer.getChannelData(0).set(smp);
    // const osc = new OscillatorNode(ctx, { type: "sine", frequency: 32 });

    // osc.start();
    node.connect(analyserNode).connect(ctx.destination);
    node.start();
    setInterval(() => {
      analyserNode.getFloatTimeDomainData(bins);
      renderFrames(cx, bins);
    }, 12);

    assert_true(bins != null);
  });
};
