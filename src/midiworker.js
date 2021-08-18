import { scheduler } from "../midiread/dist/scheduler.js";
const main = async (_url) => {
  const res = await fetch(_url);
  const ab = await res.arrayBuffer();
  const {
    ctrls: { run, rwd, pause },
    totalTicks,
    tracks,
    presets,
  } = await scheduler(new Uint8Array(ab), postMessage);
  // @ts-ignore
  postMessage({ totalTicks, presets });
  for (const t of tracks) {
    for (const et of t) {
      if (et.t > 0) break;
      if (!et.channel) postMessage(et);
    }
  }
  onmessage = ({ data: { cmd, amt, url } }) => {
    if (url) {
      pause();
      main(url);
    }
    switch (cmd) {
      case "start":
        run();
        break;
      case "pause":
        pause();
        break;
      case "resume":
        run();
        break;

      case "rwd":
        rwd(amt || 16);
        break;
      case "ff":
        break;
    }
  };
};

const url = self.location.hash.split("#")[1];
console.log(url);
main(url);
