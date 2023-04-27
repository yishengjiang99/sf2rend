import { SpinNode } from "../spin/spin.js";
import { LowPassFilterNode } from "../lpf/lpf.js";
import {midi_ch_cmds, midi_effects} from "./constants.js";
import FFTNode from "../fft-64bit/fft-node.js";
import { mkdiv } from "../mkdiv/mkdiv.js";
import {drawLoops} from "../volume-meter/main.js";
import createAudioMeter from "../volume-meter/volume-meter.js";
import {anti_denom_dither} from './misc.js';
import SF2Service from "../sf2-service/sf2.js";
let init = false;
export async function mkpath(ctx, eventPipe) {
    return mkpath2(ctx, {midi_input: eventPipe});
}
export async function mkpath2(ctx, {midi_input, sf2File, }) {
    if (!init) {
        await SpinNode.init(ctx).catch(console.trace);
        await FFTNode.init(ctx).catch(console.trace);
        await LowPassFilterNode.init(ctx).catch(console.trace);
        init = true;
    }
    const lpfs = Array(32).fill(new LowPassFilterNode(ctx));
    const channelIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const spinner = new SpinNode(ctx);
    const mastGain = new GainNode(ctx, {gain: 1});
    const whitenoise = anti_denom_dither(ctx);
    const fft = new FFTNode(ctx);
    const clipdetect = createAudioMeter(ctx);

    whitenoise.connect(spinner);
    for (const id of channelIds) {
        spinner.connect(lpfs[id], id).connect(mastGain);
    }
    //spinner.connect(clipdetect, 18);
    whitenoise.start();
    mastGain.connect(fft).connect(ctx.destination);
    let sf2s;
    return {
        spinner,
        async loadProgram(pid, bankid) {
            if (sf2File && !sf2s) {
                sf2s = new SF2Service(sf2File);
                await sf2s.load();
            }
            const p = sf2s.loadProgram(pid, bankid);
            await spinner.shipProgram(p, pid | bankid);
            return p;
        },
        connect(destination, outputNumber, destinationInputNumber) {
            spinner.connect(destination, outputNumber, destinationInputNumber);
        },

        detectClips(canvas) {
            const timer = drawLoops(canvas, clipdetect);
            spinner.connect(clipdetect, 18);
            return function cleanup() {
                cancelAnimationFrame(timer);
            };
        },
        get analysis() {
            return {
                get waveForm() {
                    return fft.getWaveForm();
                },
                get frequencyBins() {
                    return fft.getFloatFrequencyData();
                }
            };
        },
        querySpState: async function (channelId) {
            spinner.port.postMessage({query: channelId});
            return await new Promise((resolve, reject) => {
                setTimeout(reject, 100);
                spinner.port.onmessage = ({data}) => {
                    if (data.queryResponse)
                        resolve(data.queryResponse);
                };
            });
        },
        loadPreset: spinner.shipProgram,
        lowPassFilter: function (channel, initialFrequency) {
            lpfs[channel].parameters
                .get("FilterFC")
                .linearRampToValueAtTime(initialFrequency, ctx.currentTime);
            return lpfs[channel];
        },
        silenceAll() {
            mastGain.gain.linearRampToValueAtTime(0, ctx.baseLatency);
            // spinner.port.postMessage({cmd: "reset_gm"});
        },
        async mute(channel, bool) {
            this.startAudio();
            const ramp = bool ? [60, 44, 3] : [33, 55, 80];
            while (ramp.length) {
                midi_input.postMessage([midi_ch_cmds.continuous_change | channel, 7, ramp.shift()]);
                await new Promise(r => setTimeout(r, 5));
            }
        },
        async startAudio() {
            if (ctx.state !== "running")
                await ctx.resume();
        },
        ctrl_bar(container) {
            "gm_reset|debug|querySpState"
                .split("|")
                .map((cmd) => mkdiv("button", {onclick: () => spinner.port.postMessage({cmd})}, cmd).attachTo(container));

            mkdiv("input", {
                type: "range", min: 0, max: 2, oninput: (e) => mastGain.gain.linearRampToValueAtTime(e.target.value, ctx.baseLatency)
                , value: 1, title: "master G", step: .1
            }).attachTo(container);

        },
        subscribeNextMsg: async function (precateFn) {
            return await new Promise((resolve, reject) => {
                setTimeout(reject, 2000);
                spinner.port.onmessage = ({data}) => {
                    if (precateFn(data))
                        resolve(data);
                };
            });
        },
        bindToolbar: function () {
            document
                .querySelectorAll("input[type=checkbox], input[type=range]")
                .forEach((b) => {
                    if (b.dataset.path_cmd) {
                        let cmd = b.dataset.path_cmd;
                        let p1 = parseInt(b.dataset.p1 || "0");
                        b.addEventListener("click", (e) => {
                            const value = b.type == "checkbox" ? b.checked : b.value; // Generated by https://quicktype.io
                            switch (cmd) {
                                case "solo":
                                    channelIds.forEach((id) => id != p1 && this.mute(id, value));
                                    midi_input.postMessage([midi_ch_cmds.continuous_change | p1, midi_effects.volumecoarse, 50]);
                                    setTimeout(() => midi_input.postMessage([midi_ch_cmds.continuous_change | p1, midi_effects.volumecoarse, 99]), 10);
                                    setTimeout(() => midi_input.postMessage([midi_ch_cmds.continuous_change | p1, midi_effects.volumecoarse, 126]), 15);
                                    break;
                                case "mute":
                                    this.mute(p1, value);
                                    break;
                                case "lpf":
                                    this.lowPassFilter(p1, value);
                                    break;
                                default:
                                    spinner.port.postMessage({
                                        cmd: b.dataset.path_cmd,
                                    });
                                    break;
                            }
                        });
                    }
                });
        },
        bindKeyboard: function (get_active_channel_fn, eventpipe) {

            const keys = ["a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j"];
            window.onkeydown = (e) => {
                if (e.repeat)
                    return;
                if (e.isComposing)
                    return;
                const channel = get_active_channel_fn();
                const baseOctave = 48;

                const index = keys.indexOf(e.key);
                if (index < 0)
                    return;
                const key = index + baseOctave;

                e.target.addEventListener("keyup", () => {
                    eventpipe.postMessage([0x80 | channel, key, 111]);
                }, {once: true});
                eventpipe.postMessage([0x90 | channel, key, 120]);
            };
        },
    };
}