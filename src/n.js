import { midi_ch_cmds } from "./constants.js";

export function recordMidi(cctx, { pxqn, pxct }) {
  const width = 1200,
    height = 520;

  let lastClock = 0, //
    qn = 0, //quarter n
    ticks = 0,
    xx,
    x = 0, //
    yy,
    ppqn = 96,
    ct_offset = 2400,
    qn_offset = 0;
  var msqn = 500000;
  var mlqn = msqn / 1000;
  var events = [];

  cctx.font = "25px Courier New";
  cctx.fillRect(33, 33, 55, 100);
  cctx.fillRect(0, 0, width, height);

  function inputd(data) {
    var ms_delay_ = performance.now() - lastClock; // / 1000;
    var qn_delay = ms_delay_ / mlqn;
    lastClock = performance.now();
    var tick_delay = qn_delay * ppqn;
    qn += qn_delay;
    ticks += tick_delay;
    events.push(tick_delay);
    cctx.moveTo(x, 60);
    cctx.strokeStyle = "yellow";
    cctx.lineTo(x + pxqn * qn_delay, 60);
    cctx.stroke();
    x += pxqn * qn_delay;
    globalThis.stdout([qn_delay, tick_delay, ms_delay_].join("----"));

    var cmd = data[0],
      ch = data[1],
      midi = data[2],
      vel = data[3];
    var y = (midi - 20) * 20;
    cctx.strokeWidth = "1px";
    cctx.fillStyle = "red";
    switch (cmd) {
      case midi_ch_cmds.note_off:
        cctx.fillRect(xx, yy, x - xx, 20);

        break;
      case midi_ch_cmds.note_on:
        if (vel == 0) {
          cctx.fillRect(xx, yy, x - xx, 20);
        } else {
          xx = x;
          yy = y;
        }
        break;
      default:
        break;
    }
    return {
      inputd: inputd,
    };
  }
  return {
    inputd: inputd,
  };
}
