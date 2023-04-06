const channel = new BroadcastChannel("timer")
let tmParams = {
  ppqn: 120, timesig: 4, msqn: 315789,
  get waittime() {
    const {msqn, timesig} = this;
    return msqn / 1000 / timesig;
  },
  get ticksElapsed() {
    return tmParams.ppqn / tmParams.timesig;
  }
}


// const intervalMillisecond = microsecondPerQuarterNote / 1000 / timeSignature;
let timer = null,
  ticks = 0;
let startTime,
  lastTick = 0;
channel.onmessage = ({data: {cmd, tick, tm}}) => {
  console.log(cmd);
  switch (cmd) {
    case "start":
      startTime = performance.now();
      ticks = 0;
    //fallthru;
    case "record":
    case "resume":
      clearTimeout(timer);
      lastTick = performance.now();
      timer = setTimeout(ontick, tmParams.waittime);
      break;
    case "reset":
      clearInterval(timer);
      ticks = 0; channel.postMessage(ticks);
      break;
    case "stop":
    case "pause":
      clearInterval(timer);
      break;
    case "fwd":
      ticks += tmParams.ppqn * 32;
      channel.postMessage(ticks);
      break;
    case "rwd":
      ticks -= tmParams.ppqn * 32;
      channel.postMessage(ticks);
      break;
    case "setTick":
      ticks = tick;
      break;
  }
  if (tm) {
    tmParams = {...tmParams, ...tm};
  }
  if (tick) {
    ticks = tick;
  }
};

function ontick() {
  postMessage(ticks);
  channel.postMessage(ticks);
  ticks += tmParams.ticksElapsed;
  let now = performance.now;
  lastTick = now;
  const wt = tmParams.waittime;
  const drift = (now - lastTick) - wt;

  timer = setTimeout(ontick, wt - drift);
}
