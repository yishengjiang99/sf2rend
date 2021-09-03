export async function renderFrames(canvsCtx, arr, fps = 60, samplesPerFrame = 48000 / 60) {
    let nextframe, offset = 0;
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
        const existingSlider = canvsCtx.canvas?.parentElement?.querySelector("input[type='range']");
        const slider = existingSlider ||
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
