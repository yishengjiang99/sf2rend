import SF2Service from "./sf2-service/index.js";
import {mkdiv} from './mkdiv/mkdiv.js';
import get_iirf from "./irf.js";
import {mkpath2} from './src/mkpath.js';


async function zone() {
    const ctx = new AudioContext();
    const apath = await mkpath2(ctx, {sf2File: "file.sf2"});

    const program = await apath.loadProgram(0, 0);
    program.zMap.map(z => ([z.FilterFc, z.FilterQ, z.VelRange, z.KeyRange]));
    const z = program.filterKV(66, 55)[0];
    apath.spinner.port.postMessage([0x90, 0x0, 66, 55, [0, z.pid]]);
    apath.connect(ctx.destination);
    console.log(ctx);
}
zone();



//     mkpath(new AudioContext);

//     const btn = document.createElement("button");
//     const btn1 = document.createElement("button");
//     const root = document.body;
//     btn.innerText = "start";
//     btn1.innerText = "stop";
//     root.append(btn);
// //     root.append(btn1);


// //     // btn.disabled = true;
// //     // const ofc = new AudioContext();
// //     // const sf2url = "https://yishengjiang99.github.io/sf2rend/static/GeneralUserGS.sf2";
//     // let sf2 = new SF2Service(sf2url);
//     // await sf2.load();
//     // const program = sf2.loadProgram(0, 0);
//     // await program.preload();
//     // const sampleSet = new Set(program.zMap.map((z) => z.SampleId));
//     // const audioBufferMap = new Map();
//     // for (const id of Array.from(sampleSet)) {
//     //     const sHead = program.shdrMap[id];
//     //     const ab = new AudioBuffer({
//     //         duration: sHead.nSamples / sHead.sampleRate,
//     //         numberOfChannels: 1,
//     //         sampleRate: sHead.sampleRate,
//     //         length: sHead.nsamples,
//     //     });
//     //     ab.getChannelData(0).set(sHead.pcm);
//     //     audioBufferMap.set(id, ab);
//     // }


//     const zones = program.filterKV(55, 66);
//     console.log(zones);

//     const ctx = ofc;
//     const z = zones[0];

//     window.onkeydown = () => ctx.resume().then(go4);
//     function go4() {

//         const cfv = get_iirf(ctx, z.FilterFc, z.shdr.sampleRate);
//         const abs = new AudioBufferSourceNode(ofc, {
//             buffer: audioBufferMap.get(z.SampleId),
//             loopStart: z.shdr.loops[0],
//             channels: 2,
//             loopEnd: z.shdr.loops[1],
//             loop: false,
//             playbackRate: z.calcPitchRatio(55, ofc.sampleRate),
//         });

//         const [frq, b0, a0, b1, a1, b2, a2] = [
//             0.0008663387,
//             0,
//             0.001732678,
//             1.919129,
//             0.0008663387,
//             -0.9225943];
//         const [w, d] = [new GainNode(ctx), new GainNode(ctx)];
//         const sp = new ChannelSplitterNode(ctx, {numberOfOutputs: 2});
//         const aaa = new ChannelMergerNode(ctx, {numberOfInputs: 2});
//         abs.connect(sp).connect(w, 1, 0);
//         w.connect(cfv);
//         cfv.connect(aaa, 0, 1);

//         abs.connect(sp).connect(d, 0, 0)
//             .connect(aaa, 0, 0);

//         aaa.connect(ofc.destination);
//         abs.start();
//     }
// }

// zone();
// function xp1() {
//     let a1 = 3, b0 = 3;

//     mkdiv("div", [
//         mkdiv("label", "foward"),
//         mkdiv("input", {
//             min: 0,
//             max: 127,
//             value: 100,
//             step: 1,
//             id: "vol",
//             type: "range",
//             oninput: (e) => b0 = e.target.value
//         }),
//         mkdiv("label", "backword"),
//         mkdiv("input", {
//             min: 0,
//             max: 127,
//             value: 100,
//             step: 1,
//             id: "vol",
//             type: "range",
//             oninput: (e) => a1 = e.target.value
//         }),

//     ]).attachTo(document.body);



// }