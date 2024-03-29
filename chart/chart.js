import { mkdiv } from "../mkdiv/mkdiv.js";
const WIDTH = 960,
  HEIGHT = 420;
export function chart(canvasCtx, dataArray) {
  resetCanvas(canvasCtx);
  const slider = canvasCtx.canvas.parentElement.querySelector(
    "input[type='range']"
  );
  if (slider) slider.oninput = () => chart(canvasCtx, dataArray);
  const [_width, _height] = get_w_h(canvasCtx);
  let max = 0,
    x = 0;
  let iWIDTH = _width / dataArray.length;
  for (let i = 1; i < dataArray.length; i++) {
    max = dataArray[i] > max ? dataArray[i] : max;
  }
  canvasCtx.beginPath();

  canvasCtx.lineWidth = 1;
  canvasCtx.strokeStyle = "white";
  canvasCtx.moveTo(0, _height / 2);
  const zoomY = (slider && Math.log2(slider.value / 128)) || 1;
  for (let i = 1; i < dataArray.length; i++) {
    x += iWIDTH;
    canvasCtx.lineTo(x, _height / 2 + ((zoomY * _height) / 2) * dataArray[i]);
  }
  canvasCtx.stroke();
  canvasCtx.font = "1em Arial";
}
export function chartRect(canvasCtx, dataArray, markers) {
  resetCanvas(canvasCtx);
  const [_width, _height] = get_w_h(canvasCtx);
  let iWIDTH = _width / dataArray.length;
  canvasCtx.fillStyle = "black";
  canvasCtx.fillRect(0, 0, _width, _height);
  canvasCtx.clearRect(0, 0, _width, _height);
  canvasCtx.fillStyle = "red";
  let x = 0;
  for (let i = 0; i < dataArray.length; i++) {
    x += iWIDTH + 1;
    canvasCtx.fillRect(x, _height - 10, iWIDTH, dataArray[i] * _height);
  }
}
export function mkcanvas(params = {}) {
  let { width, height, container, title } = Object.assign(
    {
      container: document.body,
      title: "",
      width: 960,
      height: 320,
    },
    params
  );
  const canvas = document.createElement("canvas");
  // container.ondblclick = (e) => {
  //   container.style =
  //     "display:fixed; width:100vw;height:100vh;text-align:center";
  // };
  function on_resize() {
    canvas.setAttribute("width", `${width}`);
    canvas.setAttribute("height", `${height}`);
  }
  on_resize();
  const canvasCtx = canvas.getContext("2d");
  canvasCtx.lineWidth = 1;
  canvasCtx.strokeStyle = "white";
  canvasCtx.fillStyle = "black";
  canvasCtx.font = "2em";
  // const wrap = mkdiv("div", {style: "position:relative;padding:2px"}, [
  //   title ? mkdiv("h5", {}, title) : "",
  //   mkdiv("div", { class: "cp", style: "position:absolute" }, [
  //     "y-zoom",
  //     mkdiv("input", {
  //       type: "range",
  //       value: 64,
  //       max: 128,
  //       min: 1,
  //       step: "1"
  //     }),
  //   ]),
  //   canvas,
  // ]);
  container.append(canvas);
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
