import { mkdiv } from "../node_modules/mkdiv/mkdiv";
import { chart } from "./chart.js";
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
    function onclick(e) {
        offset += (e.x < e.target.clientWidth / 2 ? -1 : 1) * samplesPerFrame;
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
