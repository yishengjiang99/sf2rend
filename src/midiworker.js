/* eslint-disable no-unused-vars */
import { readMidi } from "./midiread.js";


run("song.mid");

export async function run(url){
  const info = await loadMidiURL(url);
  const {pause, rwd, run, resume} = scheduleMidiPlayer(jfno);
  return {
    ...{presets, meta, ntracks, totalticks},
    scheduler:{ pause, rwd, run, resume }
  }

}

async function loadMidiURL(url) {
  const res = await fetch(url);
  const ab = await res.arrayBuffer();
  return scheduleMidiPlayer(new Uint8Array(ab), postMessage);
}

async function main() {
  let scheduler, midinfo;
  addEventListener("message", async function (e) {
    const {
      data: { cmd, url, amt },
    } = e;
    switch (cmd) {
      case "load":
        if (scheduler) {
          scheduler.ctrls.pause();
        }
         { presets, totalTicks, tracks } = (midiinfo = await loadMidiURL(
          url
        ));

        postMessage({ presets, totalTicks });

        for (const track of midifile.tracks) {
          for (const event of track) {
            if (event && event.t > 0) break;
            if (!event.channel) postMessage(event);
          }
        }
        break;
      case "run":
        scheduler.ctrls.run();
        break;
      case "pause":
        scheduler.ctrls.pause();
        break;
      case "resume":
        scheduler.ctrls.run();
        break;

      case "rwd":
        scheduler.ctrls.rwd(amt || 16);
        break;
      case "ff":
        break;
    }
  });
}

export function scheduleMidiPlayer(midiInfo, cb) {
  const { tempos, tracks, division, presets, ntracks } = readMidi(midiInfo);

  const tp_qn = division; // ticks per quarter node,
  let msqn = tempos?.[0]?.tempo || 500000; // ms per qn;
  let timeSignature = 4;
  let qn = 0;

  const totalTicks = tracks
    .map((t) => t[t.length - 1])
    .reduce((lastEvent, eventt) => Math.max(eventt.t, lastEvent), 0);
  let currentTick = 0;
  let clockTime = 0;
  let paused = false;

  const trackEventIndex = new Array(ntracks).fill(0);
  const clockTimeMap = [];
  const markClockTime = () => clockTimeMap.push([clockTime, currentTick]);

  async function run() {
    paused = false;
    while (currentTick < totalTicks) {
      playToCurrentTick(cb);
      if (paused) break;
      await sleepTillNextTimeInterval();
      updateTempoAndTime(newEvent);
    }
    cb({ eof: 1 });
  }

  function updateTempoAndTime(newEvent) {
    if (newEvent.tempos) return;
    if (tempos && tempos.length > 1 && currentTick >= tempos[0].t) {
      tempos.shift();
      msqn = tempos[0].tempo;
      cb({ tempo: 60 / (msqn / 1e6) });
    }
    if ((timeSignature = event.timeSignature)) {
      (timeSignature[0] / timeSignature[1]) * 4;
    }
  }

  function playToCurrentTick(callBack) {
    for (let i in tracks) {
      const track = tracks[i];
      if (!track.length) continue;
      for (
        let idx = trackEventIndex[i], nextEvent = track[idx];
        nextEvent?.t < currentTick;
        idx++, nextEvent = track[idx]
      ) {
        callBack(nextEvent);
        updateTempoAndTime(nextEvent);
      }
    }
  }

  async function sleepTillNextTimeInterval() {
    const intervalMillisecond = msqn / 1000 / timeSignature;
    await new Promise((resolve) => setTimeout(resolve, intervalMillisecond));
    currentTick += tp_qn / timeSignature;
    qn++;
    clockTime += intervalMillisecond;
    cb({ clockTime, qn, tick: currentTick });
  }

  function rwd(miliseconds) {
    const target = clockTime - miliseconds;
    for (const [ct, tick] of markClockTime) {
      if (ct <= target) {
        currentTick = tick;
        clockTime = ct;
      }
    }
  }
  function pause() {
    paused = true;
  }
  function resume() {
    paused = false;
    run();
  }
  return {
    ctrls: { pause, rwd, run, resume },
    tracks,
    ntracks,
    presets,
    totalTicks,
  };
}
