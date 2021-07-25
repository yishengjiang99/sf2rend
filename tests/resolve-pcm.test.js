/* eslint-disable no-undef */
import { load } from "../sf2-service/read.js";
import { SpinNode } from "../spin/node.js";
import mkEnvelope from "../adsr.js";

mocha.setup("bdd");
describe("sf2zone preload", async () => {
  let sf2, zone;
  it("load all pcm of a zone and convert from s16 to f32", async () => {
    sf2 = await load("file.sf2");
    zone = sf2.loadProgram(0, 0);
    const { shdrMap, zMap, preload, filterKV } = zone;
    await preload();
    chai.expect(zMap[0].pcm).instanceof(Float32Array); // instanceof Float32Array);
    window.fetch = () => {
      chai.expect(false, "should not have been called");
    };
    //chai.fail("should not have been called");
    console.assert(shdrMap[zMap[0].SampleId].data() instanceof Float32Array);
  });
  it("should take almost no time to resolve pcm of all zones after prelaod", async () => {
    zone.zMap.map((z) =>
      chai.expect(z.pcm.byteLength).gt(z.shdr.range[1] - z.shdr.range[0])
    );
  }).slow(5);
});
mocha.run();
// async function go() {
//   const sf2 = await load("file.sf2");
//   const { shdrMap, zMap, preload, filterKV } = sf2.loadProgram(0, 0);
//   await preload();
//   filterKV(55, 88).forEach(async (v) => {
//     const sr = v.shdr.sampleRate;
//     const ctx = new OfflineAudioContext(2, sr * 2, sr);
//     await SpinNode.init(ctx);
//     const ampvol = mkEnvelope(ctx, v);
//     const spinner = new SpinNode(ctx, { pcm: v.pcm, loops: v.shdr.loops });
//     spinner.connect(ampvol.gainNode).connect(ctx.destination);
//     ampvol.keyOn();
//     ampvol.keyOff(0.5);

//     return (ab = await ctx.startRendering());
//   });
// }
// go();
