/* eslint-disable no-unused-vars */
let ppqn = 22;
let timesig = 4;
let msqn = 50000;

let interval = msqn / ppqn / timesig;

let timer = null,
  ticks = 0;
let startTime,
  lastTick = 0;
onmessage = ({ data }) => {
  const { msqn, stop, start, reset, load } = data;

  // if (msqn) interval = msqn / 1000 / ppqn;
  if (start) {
    clearTimeout(timer);
    startTime = performance.now();
    lastTick = startTime;

    timer = setTimeout(ontick, interval);
  } else if (stop) {
    clearTimeout(timer);
  } else if (reset) {
    clearTimeout(timer);
    postMessage(ticks);
    ticks = 0;
  }
};

function ontick() {
  postMessage(ticks);
  ticks += msqn / timesig;
  let now = performance.now;
  const drift = now - lastTick - interval;
  timer = setTimeout(ontick, interval);
}
