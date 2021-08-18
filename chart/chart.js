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
export function resetCanvas(c) {
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
export function mkcanvas(params = {}) {
  const { width, height, container, title } = Object.assign(
    {
      container: document.body,
      title: "",
      width: WIDTH,
      height: HEIGHT,
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
  const wrap = mkdiv("div", {}, [title ? mkdiv("h5", {}, title) : "", canvas]);
  container.append(wrap);
  canvas.ondblclick = () => resetCanvas(canvasCtx);
  return canvasCtx;
}
export async function renderFrames(
  canvsCtx,
  arr,
  fps = 60,
  samplesPerFrame = 48000 / 60
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
export function mkdiv(type, attr = {}, children = "") {
  // if (attr && typeof attr != "object" && !children)
  //   return mkdiv(type, {}, attr);
  const div = document.createElement(type);
  for (const key in attr) {
    if (key.match(/on(.*)/)) {
      div.addEventListener(key.match(/on(.*)/)[1], attr[key]);
    } else {
      div.setAttribute(key, attr[key]);
    }
  }
  const charray = !Array.isArray(children) ? [children] : children;
  charray.forEach((c) => {
    typeof c == "string" ? (div.innerHTML += c) : div.append(c);
  });
  return div;
}
HTMLElement.prototype.attachTo = function (parent) {
  parent.append(this);
  return this;
};
HTMLElement.prototype.wrapWith = function (tag) {
  const parent = mkdiv(tag);
  parent.append(this);
  return parent;
};

export function wrapDiv(div, tag, attrs = {}) {
  return mkdiv(tag, attrs, [div]);
}
export function wrapList(divs) {
  return mkdiv("div", {}, divs);
}
