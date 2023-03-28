/* eslint-disable no-unused-vars */
import { midi_ch_cmds } from "./constants.js";
import { readMidi } from "./midiread.js";
import { mkdiv } from "https://unpkg.com/mkdiv";
export default async function runMidiPlayer(url, eventpipe, container) {
  const { tempos, tracks, division, presets, ntracks, metas } = await readMidi(
    new Uint8Array(await (await fetch(url)).arrayBuffer())
  );

  for (const { channel, pid } of presets) {
    if (presets.t > 0) continue;
    eventpipe.postMessage([midi_ch_cmds.change_program | channel, pid]);
  }

  const worker = new Worker("../timer.js");
  worker.postMessage({ msqn: tempos?.[0]?.tempo || 500000 });
  worker.postMessage({ ppqn: division });
  const soundtracks = tracks.map((track) =>
    track.filter((event) => event.t && event.channel)
  );

  worker.onmessage = ({ data }) => {
    const sysTick = data;

    for (let i = 0; i < soundtracks.length; i++) {
      const track = soundtracks[i];
      while (track.length && track[0].t <= sysTick) {
        const e = track.shift();
        console.log(e.channel);
        eventpipe.postMessage(e.channel);
      }
    }
  };
  const cmds = "start,stop,reset".split(",");
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
  ).attachTo(document.querySelector("header"));
}
