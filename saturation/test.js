import saturate from "./index.js";
import { expect } from "chai";
describe("freebie", () => {
  it("2+2", () => {
    expect(saturate(0.9, 0.1) - 0.1).lt(0.000001);
    expect(saturate(0.9, 0.9)).lt(0.9); //000001);
  });
});
