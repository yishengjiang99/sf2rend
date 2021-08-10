export function linRamp({ input, time, sr }) {
    (time = time || 1), (sr = sr || 4800);
    const ctx = new OfflineAudioContext(1, time * sr, sr);
    const g = new GainNode(ctx, { gain: 0 });
    const dc = (input && input(ctx)) || newdc(ctx);
    dc.connect(g).connect(ctx.destination);
    dc.start();
    dc.stop(1);
    g.gain.linearRampToValueAtTime(1, time);
    return ctx.startRendering();
}
export function targets(time = 1, sr = 48000) {
    // g.gain.setTargetAtTime(0.0001, time / 5, time / 10);
    const ctx = new OfflineAudioContext(1, time * sr, sr);
    const g = new GainNode(ctx, { gain: 1 });
    const dc = newdc(ctx);
    dc.connect(g).connect(ctx.destination);
    g.gain.setTargetAtTime(0.0001, time / 5, time / 10);
    // g.gain.linearRampToValueAtTime(1, time / 10);
    // g.gain.linearRampToValueAtTime(0.8, time / 5);
    dc.start();
    dc.stop(time);
    return ctx.startRendering();
}
export function expRamp(time = 1, sr = 48000) {
    const ctx = new OfflineAudioContext(1, time * sr, sr);
    const g = new GainNode(ctx, { gain: 1 });
    const dc = newdc(ctx);
    dc.connect(g).connect(ctx.destination);
    g.gain.exponentialRampToValueAtTime(0.3, time);
    // g.gain.linearRampToValueAtTime(1, time / 10);
    // g.gain.linearRampToValueAtTime(0.8, time / 5);
    dc.start();
    dc.stop(time);
    return ctx.startRendering();
}
function newdc(ctx) {
    const unitysigt = new AudioBufferSourceNode(ctx, {
        buffer: new AudioBuffer({
            numberOfChannels: 1,
            length: 24,
            sampleRate: ctx.sampleRate,
        }),
        loop: true,
    });
    unitysigt.buffer.getChannelData(0).set(new Float32Array(24).fill(1));
    return unitysigt;
}
export function sine(ctx) {
    return new OscillatorNode(ctx, {
        type: "custom",
        periodicWave: new PeriodicWave(ctx, { real: [0], imag: [1] }),
    });
}
