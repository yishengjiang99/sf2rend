import { scheduler } from "../midiread/scheduler.js";
async function loadMidiURL(url) {
  const res = await fetch(url);
  const ab = await res.arrayBuffer();
  return scheduler(new Uint8Array(ab), postMessage);
}

async function main() {
  let scheduler;
  addEventListener(
    "message",
    async function ({ data: { cmd, url, amt, evtPipe } }) {
      switch (cmd) {
        case "load":
          if (scheduler) {
            scheduler.ctrls.pause();
          }
          scheduler = await loadMidiURL(url);
          const { totalTicks, tracks, presets } = scheduler;
          if (!tracks) return;
          // @ts-ignore
          postMessage({ midifile: { totalTicks, presets, tracks } });

          for (const track of scheduler.tracks) {
            for (const event of track) {
              if (event && event.t > 0) break;
              if (!event.channel) postMessage(event);
            }
          }
          break;
        case "start":
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
    }
  );
}

main();
