/* eslint-disable no-unused-vars */
import { midi_ch_cmds } from "./constants.js";
import { readMidi } from "./midiread.js";
import { mkdiv } from "../mkdiv/mkdiv.js";

// function mkcalback(channeals) {
//   const channels = [];
//   (async function (presets) {
//     for (const preset of presets) {
//       console.log(preset);

//       const { pid, channel } = preset;
//       if(channel==9){
//         break;
//         debugger;
//       }
//       const bkid = channel == 9 ? 128 : 0;
//       const _pid = bkid == 128 ? 0 : pid;
//       console.log(_pid, bkid);
//       await channels[channel].setProgram(_pid, bkid);
//     }
//   }.apply([channels]));
// }

export default async function runMidiPlayer(
  url,
  eventpipe,
  container,
  loadPresetFn
) {
  const { tempos, tracks, division, presets, ntracks, metas } = await readMidi(
    new Uint8Array(await (await fetch(url)).arrayBuffer())
  );
  await loadPresetFn(presets);
  const worker = new Worker("./src/timer.js");
  let msqn = tempos?.[0]?.tempo || 500000;
  let ppqn = division;
  // stdout("msqn" + msqn + " ppqn" + ppqn);
  worker.postMessage({ tm: { msqn, ppqn } });

  const soundtracks = tracks.map((track) =>
    track.filter((event) => event.t && event.channel)
  );
  // console.log(presets);
  // tracks.map((track) =>
  //   track
  //     .filter((event) => event.t == 0 && event.channel)
  //     .forEach((e) => {
  //       eventpipe.postMessage(e.channel);
  //     })
  // );

  worker.onmessage = ({ data }) => {
    const sysTick = data;

    for (let i = 0; i < soundtracks.length; i++) {
      const track = soundtracks[i];
      while (track.length && track[0].t <= sysTick) {
        const e = track.shift();
        if (e.meta) console.log(e.meta);
        else eventpipe.postMessage(e.channel);
      }
    }
  };
  const cmds = "start,stop,reset".split(",");
  container.innerHTML = "";
  mkdiv(
    "toolbar",
    cmds.map((cmd) =>
      mkdiv(
        "button",
        {
          onclick: () => worker.postMessage({ [cmd]: 1 }),
        },
        cmd
      )
    )
  ).attachTo(container);
}
