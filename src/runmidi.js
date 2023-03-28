/* eslint-disable no-unused-vars */
import { midi_ch_cmds } from "./constants.js";
import { readMidi } from "./midiread.js";
import { mkdiv } from "../mkdiv/mkdiv.js";

function mkcalback(channeals) {
  const channels = [];
  const ff = async function (presets) {
    for (const preset of presets) {
      const { pid, channel } = preset;
      const bkid = channel == 9 ? 128 : 0;
      await channels[channel].setProgram(pid, bkid);
    }
  };
  (async function (presets) {
    for (const preset of presets) {
      const { pid, channel } = preset;
      const bkid = channel == 9 ? 128 : 0;
      await channels[channel].setProgram(pid, bkid);
    }
  }.apply([channels]));
}

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
  const worker = new Worker("../timer.js");
  let msqn = tempos?.[0]?.tempo || 500000;
  let ppqn = division;
  console.log(ppqn);
  stdout("msqn" + msqn + " ppqn" + ppqn);
  worker.postMessage({ tm: { msqn, ppqn } });

  const soundtracks = tracks.map((track) =>
    track.filter((event) => event.t && event.channel)
  );

  worker.onmessage = ({ data }) => {
    const sysTick = data;

    for (let i = 0; i < soundtracks.length; i++) {
      const track = soundtracks[i];
      while (track.length && track[0].t <= sysTick) {
        const e = track.shift();
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
