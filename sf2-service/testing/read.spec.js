import { load, loadProgram } from "../read.js";
const mocha = window.mocha;
const sf2url = "./fixtures/VintageDreamsWaves-v2.sf2";
let sf2;
describe("load sf2 file", () => {
  before(async () => (sf2 = await load(sf2url)));
  it("sf2file is loaded", async () => {
    expect(sf2).exists;
    // document.body.innerHTML += JSON.stringify(sf2);
    expect(sf2.url).includes("http");
  }).slow(100);
  it("sf2 zref ", () => {
    expect(sf2.presetRefs[0]).exists;
  });
});
describe("load program", () => {
  before(async () => (sf2 = await load(sf2url)));
  it("progra loaded", () => {});
});
