"use strict";
exports.__esModule = true;
exports.sine = exports.expRamp = exports.targets = exports.linRamp = void 0;
function linRamp(_a) {
    var input = _a.input, time = _a.time, sr = _a.sr;
    (time = time || 1), (sr = sr || 4800);
    var ctx = new OfflineAudioContext(1, time * sr, sr);
    var g = new GainNode(ctx, { gain: 0 });
    var dc = (input && input(ctx)) || newdc(ctx);
    dc.connect(g).connect(ctx.destination);
    dc.start();
    dc.stop(1);
    g.gain.linearRampToValueAtTime(1, time);
    return ctx.startRendering();
}
exports.linRamp = linRamp;
function targets(time, sr) {
    if (time === void 0) { time = 1; }
    if (sr === void 0) { sr = 48000; }
    // g.gain.setTargetAtTime(0.0001, time / 5, time / 10);
    var ctx = new OfflineAudioContext(1, time * sr, sr);
    var g = new GainNode(ctx, { gain: 1 });
    var dc = newdc(ctx);
    dc.connect(g).connect(ctx.destination);
    g.gain.setTargetAtTime(0.0001, time / 5, time / 10);
    // g.gain.linearRampToValueAtTime(1, time / 10);
    // g.gain.linearRampToValueAtTime(0.8, time / 5);
    dc.start();
    dc.stop(time);
    return ctx.startRendering();
}
exports.targets = targets;
function expRamp(time, sr) {
    if (time === void 0) { time = 1; }
    if (sr === void 0) { sr = 48000; }
    var ctx = new OfflineAudioContext(1, time * sr, sr);
    var g = new GainNode(ctx, { gain: 1 });
    var dc = newdc(ctx);
    dc.connect(g).connect(ctx.destination);
    g.gain.exponentialRampToValueAtTime(0.3, time);
    // g.gain.linearRampToValueAtTime(1, time / 10);
    // g.gain.linearRampToValueAtTime(0.8, time / 5);
    dc.start();
    dc.stop(time);
    return ctx.startRendering();
}
exports.expRamp = expRamp;
function newdc(ctx) {
    var unitysigt = new AudioBufferSourceNode(ctx, {
        buffer: new AudioBuffer({
            numberOfChannels: 1,
            length: 24,
            sampleRate: ctx.sampleRate
        }),
        loop: true
    });
    unitysigt.buffer.getChannelData(0).set(new Float32Array(24).fill(1));
    return unitysigt;
}
function sine(ctx) {
    return new OscillatorNode(ctx, {
        type: "custom",
        periodicWave: new PeriodicWave(ctx, { real: [0], imag: [1] })
    });
}
exports.sine = sine;
