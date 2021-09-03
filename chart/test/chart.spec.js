import { mkcanvas, chart } from "../chart.js";
describe("mkcanvas", () => {
  it("instantiate", () => {
    const ret = mkcanvas();
    expect(ret.canvas instanceof HTMLCanvasElement);
    it("attachanges canvas to document body", () => {
      expect(ret.canvas.parentElement).eq(document.body);
    });
    chart(ret, [1, 2, 3, 6, 2, 1, 3, 2]);
  });
});
