declare function mkcanvas(container?: HTMLElement): CanvasRenderingContext2D;
declare function resetCanvas(ctx: CanvasRenderingContext2D): void;
declare function chart(
  ctx: CanvasRenderingContext2D,
  data: Float32Array | Float64Array
): void;
declare function mkOfflineCanvas(
  container?: HTMLElement
): CanvasRenderingContext2D;

declare const HEIGHT: number;
declare const WIDTH: number;
export { mkcanvas, resetCanvas, chart, HEIGHT, WIDTH };
