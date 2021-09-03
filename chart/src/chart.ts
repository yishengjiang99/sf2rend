//@ts-ignore
export const WIDTH = 480; // / 2,
export const HEIGHT = 320;
function get_w_h(canvasCtx) {
  return [
    canvasCtx.canvas.getAttribute("width")
      ? parseInt(canvasCtx.canvas.getAttribute("width"))
      : WIDTH,
    canvasCtx.canvas.getAttribute("height")
      ? parseInt(canvasCtx.canvas.getAttribute("height"))
      : HEIGHT,
  ];
}
function resetCanvas(c) {
  if (!c) return;
  const canvasCtx = c;
  const [_width, _height] = get_w_h(canvasCtx);
  canvasCtx.clearRect(0, 0, _width, _height);
  canvasCtx.fillStyle = "black";
  canvasCtx.fillRect(0, 0, _width, _height);
}
export function chart(canvasCtx, dataArray) {
  resetCanvas(canvasCtx);
  const [_width, _height] = get_w_h(canvasCtx);
  let max = 0,
    min = 0,
    x = 0;
  let iWIDTH = _width / dataArray.length; //strokeText(`r m s : ${sum / bufferLength}`, 10, 20, 100)
  for (let i = 1; i < dataArray.length; i++) {
    max = dataArray[i] > max ? dataArray[i] : max;
  }
  canvasCtx.beginPath();
  // canvasCtx.lineWidth = 0.1;
  // canvasCtx.moveTo(0, _height / 2);
  // canvasCtx.lineTo(_width, _height / 2);
  // canvasCtx.stroke();
  canvasCtx.lineWidth = 2;
  canvasCtx.strokeStyle = "white";
  canvasCtx.moveTo(0, _height / 2);
  for (let i = 1; i < dataArray.length; i++) {
    x += iWIDTH;
    canvasCtx.lineTo(x, _height / 2 - (_height / 4) * dataArray[i]);
  }
  canvasCtx.stroke();
  canvasCtx.restore();
  canvasCtx.font = "1em Arial";
}
