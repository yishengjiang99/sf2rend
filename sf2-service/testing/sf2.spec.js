/* eslint-disable no-undef */
import { load, loadProgram } from "../read.js";
const sf2url = "./fixtures/VintageDreamsWaves-v2.sf2";
document.body.id = "mocha";
mocha.setup("bdd");
const expect = globalThis.chai.expect;
describe("load sf2 file", () => {
  it("sf2file is loaded", async () => {
    const sf2 = await load(sf2url);
    expect(sf2).exists;
    it("sf2 zref ", () => {
      expect(sf2.presetRefs[0]).exists;
    });
  }).slow(100);
});
mocha.run();
