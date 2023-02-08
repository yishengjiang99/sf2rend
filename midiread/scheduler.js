import { readMidi } from "./midiread.js";
export async function scheduler(midi_u8, cb) {
  const { tempos, tracks, division, presets, ntracks } = readMidi(midi_u8);
  const ticksPerQuarterNote = division;
  let microsecondPerQuarterNote =
    tempos && tempos.length ? tempos[0].tempo : 500000;
  let timeSignature = 4;
  let qn = 0;
  const totalTicks = tracks
    .map((t) => t[t.length - 1])
    .reduce((lastEvent, eventt) => Math.max(eventt.t, lastEvent), 0);
  const playedEvent = [];
  let tick = 0;
  let clockTime = 0;
  let paused = false;
  async function run() {
    paused = false;
    while (tick < totalTicks) {
      for (let i in tracks) {
        const track = tracks[i];
        if (!track.length) continue;
        while (track.length && track[0].t < tick) {
          const newevent = track.shift();
          cb(newevent);
          if (newevent.timeSignature) {
            timeSignature =
              (newevent.timeSignature[0] / newevent.timeSignature[1]) * 4;
          }
        }
      }
      if (paused) break;
      const intervalMillisecond =
        microsecondPerQuarterNote / 1000 / timeSignature;
      await new Promise((resolve) => setTimeout(resolve, intervalMillisecond));
      tick += ticksPerQuarterNote / timeSignature;
      clockTime += intervalMillisecond / 1000;
      qn++;
      cb({ clockTime, qn, tick });
      if (tempos && tempos.length > 1 && tick >= tempos[0].t) {
        tempos.shift();
        microsecondPerQuarterNote = tempos[0].tempo;
        cb({ tempo: 60 / (microsecondPerQuarterNote / 1e6) });
      }
    }
  }
  function rwd(amt) {}
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
