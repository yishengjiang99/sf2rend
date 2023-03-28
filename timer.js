/* eslint-disable no-unused-vars */
let ppqn = 120;
let timesig = 4; //ratio of 4/4 etc
let msqn = 315789; // msqn315789 ppqn120
// msqn, ppq msqn, ppq

let waittime = msqn / 1000 / timesig;
// const intervalMillisecond = microsecondPerQuarterNote / 1000 / timeSignature;
let timer = null,
  ticks = 0;
let startTime,
  lastTick = 0;
onmessage = ({ data }) => {
  const { tm, stop, start, reset, load } = data;

  if (tm) {
    ppqn = tm.ppqn;
    msqn = tm.msqn;
    waittime = msqn / 1000 / timesig;
  }
  if (start) {
    clearTimeout(timer);
    startTime = performance.now();
    lastTick = startTime;

    timer = setTimeout(ontick, waittime);
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
  ticks += ppqn / timesig;
  let now = performance.now;
  lastTick = now;
  const drift = waittime - (now - lastTick);

  timer = setTimeout(ontick, waittime);
}
