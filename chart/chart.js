import { mkdiv } from "../mkdiv/mkdiv.js";

export function chart(canvasCtx, dataArray) {
  resetCanvas(canvasCtx);
  const slider = canvasCtx.canvas.parentElement.querySelector(
    "input[type='range']"
  );
  slider.oninput = (e) => chart(canvasCtx, dataArray);
  const [_width, _height] = get_w_h(canvasCtx);
  let max = 0,
    min = 0,
    x = 0;
  let iWIDTH = _width / dataArray.length; //strokeText(`r m s : ${sum / bufferLength}`, 10, 20, 100)
  for (let i = 1; i < dataArray.length; i++) {
    max = dataArray[i] > max ? dataArray[i] : max;
  }
  canvasCtx.beginPath();

  canvasCtx.lineWidth = 1;
  canvasCtx.strokeStyle = "white";
  canvasCtx.moveTo(0, _height / 2);
  const zoomY = slider.value;
  for (let i = 1; i < dataArray.length; i++) {
    x += iWIDTH;
    canvasCtx.lineTo(x, _height / 2 - zoomY * dataArray[i]);
  }
  canvasCtx.stroke();
  canvasCtx.font = "1em Arial";
}
export function mkcanvas(params = {}) {
  const { width, height, container, title } = Object.assign(
    {
      container: document.body,
      title: "",
      width: 480,
      height: 320,
    },
    params
  );
  const canvas = document.createElement("canvas");
  canvas.setAttribute("width", `${width}`);
  canvas.setAttribute("height", `${height}`);
  const canvasCtx = canvas.getContext("2d");
  canvasCtx.lineWidth = 2;
  canvasCtx.strokeStyle = "white";
  canvasCtx.fillStyle = "black";
  canvasCtx.font = "2em";
  const wrap = mkdiv("div", { style: "padding:2px" }, [
    title ? mkdiv("h5", {}, title) : "",
    mkdiv("div", { class: "cp", style: "position:absolute" }, [
      "y-zoom",
      mkdiv("input", {
        type: "range",
        value: 0.5 * height,
        max: 3 * height,
        min: 0,
      }),
    ]),
    canvas,
  ]);
  container.append(wrap);
  canvas.ondblclick = () => resetCanvas(canvasCtx);
  return canvasCtx;
}
export async function renderFrames(
  canvsCtx,
  arr,
  fps = 60,
  samplesPerFrame = 1024
) {
  let nextframe,
    offset = 0;
  while (arr.length > offset) {
    if (!nextframe || performance.now() > nextframe) {
      chart(canvsCtx, arr.slice(offset, offset + samplesPerFrame));
      nextframe = 1 / fps + performance.now();
      offset += samplesPerFrame / 4;
    }
    await new Promise((r) => requestAnimationFrame(r));
  }
  function onclick({ x, target }) {
    offset += (x < target.clientWidth / 2 ? -1 : 1) * samplesPerFrame;
    chart(canvsCtx, arr.slice(offset, offset + samplesPerFrame));
    const existingSlider = canvsCtx.canvas?.parentElement?.querySelector(
      "input[type='range']"
    );
    const slider =
      existingSlider ||
      mkdiv("input", {
        type: "range",
        min: -10,
        max: 100,
        value: 100,
        step: 0,
        oninput: (e) => {
          const { max, value } = e.target;
          offset = (arr.length * parseInt(value)) / parseInt(max);
          chart(canvsCtx, arr.slice(offset, offset + samplesPerFrame));
        },
      }).attachTo(canvsCtx.canvas.parentElement);
  }
  canvsCtx.canvas.addEventListener("click", onclick);
  canvsCtx.canvas.addEventListener("dblclick", function (e) {
    e.x;
    offset += (e.x < canvsCtx.canvas.width / 2 ? -1 : 1) * samplesPerFrame;
    chart(canvsCtx, arr.slice(offset, offset + samplesPerFrame));
  });
}
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
export function resetCanvas(c) {
  if (!c) return;
  const canvasCtx = c;
  const [_width, _height] = get_w_h(canvasCtx);
  canvasCtx.clearRect(0, 0, _width, _height);
  canvasCtx.fillStyle = "black";
  canvasCtx.fillRect(0, 0, _width, _height);
}
