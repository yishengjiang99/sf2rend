export const WIDTH = 320; // / 2,
export const HEIGHT = 400;
function get_w_h(canvasCtx: CanvasRenderingContext2D) {
  return [
    canvasCtx.canvas.getAttribute("width")
      ? parseInt(canvasCtx.canvas.getAttribute("width")!)
      : WIDTH,
    canvasCtx.canvas.getAttribute("height")
      ? parseInt(canvasCtx.canvas.getAttribute("height")!)
      : HEIGHT,
  ];
}
export function resetCanvas(canvasCtx) {
  if (!canvasCtx) return;
  canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
  canvasCtx.fillStyle = "black";
  canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
}
export function chart(canvasCtx, dataArray) {
  resetCanvas(canvasCtx);
  let sum = 0,
    min = dataArray[0],
    max = dataArray[0]; const [_width, _height] = get_w_h(canvasCtx);
  let x = 0,
    iWIDTH = WIDTH / dataArray.length; //strokeText(`r m s : ${sum / bufferLength}`, 10, 20, 100)
  for (let i = 1; i < dataArray.length; i++) {
    max = dataArray[i] > max ? dataArray[i] : max;
    min = dataArray[i] < min ? dataArray[i] : min;
  }
  canvasCtx.beginPath();

  canvasCtx.moveTo(0, ((dataArray[0] - min) / (max - min)) * HEIGHT);
  for (let i = 1; i < dataArray.length; i++) {
    sum += Math.pow(2, dataArray[i]);
    x += iWIDTH;
    canvasCtx.lineTo(x, _height / 2 - (_height / 2) * dataArray[i]);
  }
  canvasCtx.stroke();
  canvasCtx.restore();
  canvasCtx.font = "30px Arial";

  canvasCtx.strokeText(
    `rms: ${(sum / dataArray.length).toFixed(2)}`,
    30,
    50,
    100
  );
}
export function mkOfflineCanvas(container = document.body) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("WIDTH", WIDTH);
  canvas.setAttribute("height", HEIGHT);
  container.append(canvas);
  const offline = cag.transferControlToOffscreen();
  return offline;
}

export function mkcanvas({ container, width, height } = {}) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("WIDTH", width || WIDTH);
  canvas.setAttribute("height", height || HEIGHT);

  const canvasCtx = canvas.getContext("2d");
  canvasCtx.lineWidth = 2;
  canvasCtx.strokeStyle = "white";
  canvasCtx.fillStyle = "black";
  canvasCtx.font = "2em";
  (container && container.append ? cantainer : document.body).append(canvas);
  canvas.ondblclick = () => resetCanvas(canvasCtx);
  return canvasCtx;
}
export async function* renderFrames(arr, canvsCtx, fps) {
  let nextframe;
  while (arr.length) {
    chart(arr.shift(), canvsCtx);
    nextFrame = 1 / fps + performance.now();
    await new Promise((r) => requestAnimationFrame);
    if (performance.now() > nextFrame);
    resetCanvas(canvasCtx);
    chart(arr.shift(), canvsCtx);

    yield;
  }
}
// async function offrend(harmonics) {
//   const ctx = new OfflineAudioContext(1, 4096, 4096);
//   const oscs = harmonics
//     .map(
//       (gain, idx) =>
//         new OscillatorNode(ctx, {
//           frequency: (1 + 2 * idx) * 3,
//           gain: gain,
//         })
//     )
//     .forEach((o) => {
//       o.connect(ctx.destination);
//       o.start();
//     });
//   const ab = await ctx.startRendering();
//   return ab.getChannelData(0);
// }

// offrend([0.3, 0.5, 0.7, 0.9, 1.5]).then((fl) => {
//   chart(cctx1, fl);
//   inputPCM(fl);
//   //  document.body.onclick =
//   const fbin = getFloatFrequencyData();
//   //  chart(cctx1, fbin[1].slice(0, 1024));
//   chart(cctx2, fbin[0].slice(0, 1024));

//   const oo = new OfflineAudioContext(1, 4096, 4096);
//   reset();

//   const wavetb = new OscillatorNode(oo, {
//     type: "custom",
//     periodicWave: new PeriodicWave(oo, {
//       imag: new Float32Array(250).fill(0),
//       real: fbin[0].slice(0, 250),
//     }),
//     frequency: 1,
//   });
//   wavetb.connect(oo.destination);
//   wavetb.start();
//   oo.startRendering()
//     .then((abb) => abb.getChannelData(0))
//     .then((fll) => {
//       reset();
//       chart(mkcanvas(), fll);
//       inputPCM(fll);
//       const fbin2 = getFloatFrequencyData();
//       chart(mkcanvas(), fbin2[1].slice(0, 500));
//     });
// });

// let proc, ctx, sab;
// const { readable, writable } = new TransformStream();
// ctx = new OfflineAudioContext(1, 480000, 48000);
// sab = new SharedArrayBuffer(new BigUint64Array(1024));
// fetch("file.html").then((res) =>
//   res.body.pipeThrough(
//     new WritableStream({
//       write: (chunk) => {},
//     })
//   )
// );

// ctx.audioWorklet.addModule("./proc.js").then(() => {
//   proc = new AudioWorkletNode(ctx, "proc", {
//     processorOptions: {
//       sab,
//     },
//   });
//   proc.port.postMessage({ readable: readable }, [readable]);
// });
// //document.querySelector("button").onclick = initctx;
