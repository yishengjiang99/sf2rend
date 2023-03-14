import SF2Service from "../index.js";
const mocha = window.mocha;
const sf2url = "./fixtures/VintageDreamsWaves-v2.sf2";
document.body.id = "mocha";
mocha.setup("bdd");
const expect = globalThis.chai.expect;
let sf2;

describe("load sf2 file", () => {
  before(async () => ((sf2 = new SF2Service(sf2url)), await sf2.load()));
  it("Can load SF2 meta data", async () => {
    expect(sf2.programNames.length).gt(0, "asb");
    expect(sf2.presets.length).gt(0, "asb");
  }).slow(100);
  it("can load a preset", async () => {
    const program = sf2.loadProgram(0, 0);
    expect(program.url).to.exist;
    expect(program.shdrMap).to.exist;
    for (const zone of program.zMap) {
      expect(program.shdrMap[zone.SampleId]).exist;
      expect(program.shdrMap[zone.SampleId].range).exist;
    }
  }).slow(100);
  it("can filter key/velocity for zone", async () => {
    const program = sf2.loadProgram(0, 0);
    const zones = program.filterKV(55, 55);
    console.log(zones, "loaded zones");
    console.log(program.shdrMap[zones[0].SampleId]);
    expect(zones.length).gt(0);
    expect(program.shdrMap[zones[0].SampleId].range).exist;
  });
  it("can load sample pcm", async () => {
    const program = sf2.loadProgram(0, 0);
    const zones = program.filterKV(55, 55);
  });
  it("preload all", async () => {
    const program = sf2.loadProgram(0, 0);
    const gg = await program.preload();
    for (const zone of program.zMap) {
      expect(zone.shdr.nsamples).gt(0);
    }
  }).slow(10);
});
mocha.run();
