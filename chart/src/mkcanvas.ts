import { mkdiv } from "../node_modules/mkdiv/mkdiv";
export const WIDTH = 480; // / 2,
export const HEIGHT = 320;

export interface MkCanvasOptions {
  container: HTMLElement;
  width: number;
  height: number;
  title: string;
}
export const defaultParams: MkCanvasOptions = {
  container: document.body,
  title: "",
  width: WIDTH,
  height: HEIGHT,
};
export function mkcanvas(params: MkCanvasOptions) {
  const { width, height, container, title } = Object.assign(
    {},
    params,
    defaultParams
  );

  const canvas = document.createElement("canvas") as HTMLCanvasElement;
  canvas.setAttribute("width", `${width}`);
  canvas.setAttribute("height", `${height}`);
  const canvasCtx: CanvasRenderingContext2D = canvas.getContext("2d")!;
  canvasCtx.lineWidth = 2;
  canvasCtx.strokeStyle = "white";
  canvasCtx.fillStyle = "black";
  canvasCtx.font = "2em";
  const wrap = mkdiv("div", {}, [title ? mkdiv("h5", {}, title) : "", canvas]);
  container.append(wrap);
  return canvasCtx;
}
