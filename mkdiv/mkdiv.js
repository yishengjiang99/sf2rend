export function mkdiv(type, attr = {}, children = "") {
    if(Array.isArray(attr) && !children) return mkdiv(type,{},attr);
    const div = document.createElement(type);
    for (const key in attr) {
        if (key.match(/on(.*)/)) {
            div.addEventListener(key.match(/on(.*)/)[1], attr[key]);
        }
        else {
            div.setAttribute(key, attr[key]);
        }
    }
    const charray = !Array.isArray(children) ? [children] : children;
    charray.forEach((c) => {
        typeof c == "string" ? (div.innerHTML += c) : div.append(c);
    });
    return div;
}
HTMLElement.prototype.attachTo=function(parent){
    parent.append(this)
    return this;
}
HTMLElement.prototype.wrapWith=function(tag){
    const parent=mkdiv(tag)
    parent.append(this)
    return parent;
}
export function logdiv() {
    const logs = [];
    const errPanel = mkdiv("div");
    const infoPanel = mkdiv("pre", {
        style: "width:30em;min-height:299px;scroll-width:0;max-height:299px;overflow-y:scroll",
    });
    const stderr = (str) => (errPanel.innerHTML = str);
    const stdout = (log) => {
        logs.push((performance.now() / 1e3).toFixed(3) + ": " + log);
        if (logs.length > 100)
            logs.shift();
        infoPanel.innerHTML = logs.join("\n");
        infoPanel.scrollTop = infoPanel.scrollHeight;
    };
    return {
        stderr,
        stdout,
        infoPanel,
        errPanel,
    };
}
export function wrapDiv(div, tag, attrs = {}) {
    return mkdiv(tag, attrs, [div]);
}
export function wrapList(divs) {
    return mkdiv("div", {}, divs);
}

// @ts-ignore
export const draw = function (getData, length, canvas) {
    const slider = mkdiv("input", { type: "range", value: 1, max: 10, min: -10, step: 0.2 }, []);
    let zoomScale = 1, zoomXscale = 1;
    const height = parseInt(canvas.getAttribute("height")) ||
        canvas.parentElement.clientHeight;
    const width = parseInt(canvas.getAttribute("width")) ||
        canvas.parentElement.clientWidth;
    const canvasCtx = canvas.getContext("2d");
    canvas.setAttribute("width", width + "");
    canvas.setAttribute("height", height + "");
    canvasCtx.fillStyle = "rbga(0,2,2,0.1)";
    canvasCtx.lineWidth = 1;
    canvasCtx.strokeStyle = "white";
    var dataArray = new Float32Array(length);
    var convertY = (y) => (y * height * zoomScale) / 2 + height / 2;
    canvas.parentElement.append(slider);
    canvasCtx.fillRect(0, 0, width, height);
    canvasCtx.beginPath();
    canvasCtx.moveTo(0, convertY(0));
    var t = 0;
    canvasCtx.lineWidth = 1;
    var x = 0;
    let timer;
    function draw(once = false) {
        const dataArrayOrDone = getData();
        if (dataArrayOrDone === null) {
            return;
        }
        else {
            dataArray = dataArrayOrDone;
        }
        var bufferLength = dataArray.length;
        canvasCtx.beginPath();
        var sum = 0;
        canvasCtx.moveTo(0, height / 2);
        canvasCtx.clearRect(0, 0, width, height);
        canvasCtx.fillStyle = `rbga(10,10,10, ${1 * 100})`;
        canvasCtx.fillRect(0, 0, width, height);
        canvasCtx.strokeStyle = "white";
        canvasCtx.lineWidth = 1;
        canvasCtx.beginPath();
        let x = 0, iwidth = (width / bufferLength) * zoomXscale; //strokeText(`r m s : ${sum / bufferLength}`, 10, 20, 100)
        for (let i = 0; i < bufferLength; i++) {
            canvasCtx.lineTo(x, convertY(dataArray[i]));
            x += iwidth;
        }
        canvasCtx.stroke();
        if (once)
            return;
        timer = requestAnimationFrame(() => draw(false));
    }
    canvas.onkeydown = (e) => {
        if (e.code == "+")
            zoomScale += 0.5;
    };
    function zoom(e) {
        zoomXscale = Math.pow(2, parseInt(e.target.value));
        draw(true);
    }
    slider.removeEventListener("input", zoom);
    slider.addEventListener("input", zoom);
    draw(true);
    return {
        canvas: canvas,
        stop: () => {
            clearTimeout(timer);
        },
        start: () => {
            draw();
        },
        drawOnce: () => {
            draw(true);
        },
    };
};
