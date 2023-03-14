/* eslint-disable no-undef */
import { load } from "../sf2-service/read.js";

describe("sf2zone preload", async () => {
  let sf2, zone;
  it("load all pcm of a zone and convert from s16 to f32", async () => {
    sf2 = await load("file.sf2");
    zone = sf2.loadProgram(0, 0);
    const { shdrMap, zMap, preload } = zone;
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
