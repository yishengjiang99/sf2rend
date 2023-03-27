export function timeseries(_params) {
  var { canvas, sampleSize, analyzer, slider, width, height } = Object.assign(
    { sampleSize: 1024, width: 1111, height: 255, canvas: null },
    _params
  );

  const canvasCtx = canvas.getContext("2d");
  canvas.setAttribute("width", width);
  canvas.setAttribute("height", height);
  canvas.fillStyle = "rbg(0,2,2)";
  canvasCtx.lineWidth = 1;
  canvasCtx.strokeStyle = "white";
  var dataArray = new Uint8Array(analyzer.fftSize);
  canvasCtx.fillRect(0, 0, width, height);

  canvasCtx.beginPath();
  var t = 0;
  canvasCtx.lineWidth = 1;
  var x = 0;
  let zoomScale = 1;
  let max = 1,
    min = -1,
    range = 2;
  let activeDraw = true;
  var convertY = (y) => (((y - min) / range) * height * zoomScale) / 100;
  let timer;
  canvasCtx.moveTo(0, convertY(0));

  draw();

  function draw() {
    analyzer.getByteTimeDomainData(dataArray);
    var bufferLength = dataArray.length;

    canvasCtx.beginPath();
    var sum = 0;

    sum = dataArray.reduce(
      (accumulator, currentValue) => accumulator + currentValue
    );

    canvasCtx.clearRect(10, 20, 10, 100);
    canvasCtx.fillRect(10, 20, 10, 100);
    canvasCtx.strokeStyle = "white";
    canvasCtx.strokeWidth = 1;
    canvasCtx.strokeText(`r m s : ${sum / bufferLength}`, 10, 20, 100);
    for (var i = 0; i < bufferLength; i++) {
      var y = dataArray[i];
      if (y == 0) continue;
      x = (t / bufferLength) % width;
      t++;
      if (t > 100 && x == 0) {
        canvasCtx.clearRect(0, 0, width, height);
        canvasCtx.fillRect(0, 0, width, height);
        canvasCtx.stroke();
        canvasCtx.beginPath();
        canvasCtx.moveTo(x, convertY(y));
      } else {
        canvasCtx.lineTo(x, convertY(y));
      }
    }
    canvasCtx.stroke();
    if (activeDraw) activeDraw = requestAnimationFrame(draw);
  }
  return {
    set active(setActive) {
      if (!activeDraw && setActive) {
        requestAnimationFrame(draw);
        activeDraw = true;
      } else if (!setActive) {
        cancelAnimationFrame(timer);
      }
    },
  };
}
