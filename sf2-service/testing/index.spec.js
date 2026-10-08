import SF2Service from "../index.js";
import {newSFZone} from "../zoneProxy.js";
//const sf2url = "https://raw.githubusercontent.com/FluidSynth/fluidsynth/master/sf2/VintageDreamsWaves-v2.sf2";
let sf2;
// CI passes --sf2-test-url via karma client.args to serve static/ locally;
// otherwise fall back to the deployed site.
const _karmaArgs = (typeof window !== "undefined" && window.__karma__?.config?.args) || [];
const _urlFlag = _karmaArgs.indexOf("--sf2-test-url");
const sf2url = (_urlFlag >= 0 && _karmaArgs[_urlFlag + 1]) ||
  "https://yishengjiang99.github.io/sf2rend/static/GeneralUserGS.sf2"
// eslint-disable-next-line no-undef
describe("load sf2 file", function() {
  this.timeout(15000);
  before(async function() {
    try {
      sf2 = new SF2Service(sf2url);
      await sf2.load();
    } catch(e) {
      // Network issues - skip tests that require loaded SF2
      this.skip();
    }
  });
  it("parallel download stream with transferrable buffer to message port on another thread", async () => {
    const port = new MessageChannel();
    const program = sf2.loadProgram(0, 0);
    port.port2.onmessage = async ({data: {stream, segments}}) => {
      const reader = stream.getReader();
      expect(reader).to.exist;
      const pcm = new Uint8Array(segments.nSamples * 2);
      let offset = 0;
      while (true) {
        const {value, done} = await reader.read();
        if (done) break;
        if (!value) continue;
        pcm.set(new Uint8Array(value.buffer), offset);
        offset += value.byteLength;
      }
      expect(offset / 2).eq(segments.nSamples);
      stream.closed;
    }
    await program.fetch_drop_ship_to(port.port1);
    expect(true);
  })
  it("Can load SF2 meta data", async () => {
    expect(sf2.programNames[0].length).gt(0, "filens");
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
  });

  it("can filter key/velocity for zone", async () => {
    const program = sf2.loadProgram(0, 0);
    for (let i = 0;i < 88;i += 4) {
    const zones = program.filterKV(55, 55);
    expect(zones.length).gt(0);
      expect(zones.length).lt(3);
    expect(program.shdrMap[zones[0].SampleId].range).exist;
    }

  });
  it("can load sample pcm", async () => {
    const program = sf2.loadProgram(0, 0);
    const zones = program.filterKV(55, 55);
    expect(await zones[0].shdr.data).exist;

  });
  it("preload all", async () => {
    const program = sf2.loadProgram(0, 0);
    const gg = await program.preload();
    for (const zone of program.zMap) {
      expect(zone.shdr.nsamples).gt(0); expect(zone.shdr.loops[1]).gt(zone.shdr.loops[0]);

    }
  }).slow(10);
  it("has sample set with unique sample ids", async () => {
    const program = sf2.loadProgram(0, 0);
    expect(program.sampleSet).to.be.instanceof(Set);
  }); it("makes proxy objects for sf zones", async () => {
    const program = sf2.loadProgram(0, 0);
    const obj = newSFZone(program.zMap[0]);
    expect(obj.sample.loops).be.instanceof(Array);
    obj.VolEnvAttack = -1111;
    expect(obj.isDirty);
  });

});

// Commented out: SpinNode tests require mkspin dependency
// describe("sending to spinner", async () => {
//   let sp, sf2, ctx;
//   ctx = new OfflineAudioContext(1, 48000, 480000);
//   before(async () => ((sf2 = new SF2Service(sf2url)), await sf2.load()));
//   before(async () => {
//     await SpinNode.init();
//   });
// })  