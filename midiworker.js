import { scheduler } from "https://unpkg.com/midiread@2.0.14/dist/scheduler.js";
(async () => {
  const url = self.location.hash.split("#")[1];
  console.log(url);
  const res = await fetch(url);
  const ab = await res.arrayBuffer();
  const {
    ctrls: { run, rwd, pause },
    totalTicks,
    tracks,
    presets,
  } = await scheduler(new Uint8Array(ab), postMessage);
  console.log(res);
  // @ts-ignore
  postMessage({ totalTicks, tracks, presets });
  onmessage = ({ data: { cmd, amt } }) => {
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
})();
