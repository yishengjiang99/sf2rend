/* eslint-disable no-undef */
import { load, loadProgram, zref2Zone } from "./read.js";
import {
  mkcanvas,
  chart,
  renderFrames,
} from "https://unpkg.com/mk-60fps/chart.js";
document.body.id = "mocha";
// eslint-disable-next-line no-undef
mocha.setup("bdd");
const expect = globalThis.chai.expect;
const cctx = mkcanvas();

describe("pdtaquery", () => {
  it("parswes file and loads zones", () => {
    load("file.sf2").then(async (sf2) => {
      const z = zref2Zone(sf2.presetRefs[0].ref, sf2.heap);
      expect(z.SampleId).to.exist; //instanceof(Int16Array);
      const pg = loadProgram(sf2, 0, 0);
      console.log(
        pg.zMap.map((z) => z.KeyRange.lo + "_" + z.KeyRange.hi).join("\n")
      );
      pg.filterKV(55, 77).forEach(async (z) => {
        renderFrames(
          mkcanvas({ title: "sampleid" + z.KeyRange.lo + "-" + z.KeyRange.hi }),
          await z.pcm
        );
      });
    });
  });
});
// describe("pdtaquery", () => {
//   it("parswes file and loads zones", () => {
//     load("file.sf2").then(({ loadZone, setProgram, noteOn, zref2Zone }) => {
//       const sf = setProgram(0, 2);
//       const iter = loadZone(0);
//       for (const sh of iter) {
//         expect(sh.range).exists;
//         fetch("file.sf2", { headers: { Range: sh.range } })
//           .then((res) => res.arrayBuffer())
//           .then((ab) => {
//             const b16 = new Int16Array(ab);
//             const f32 = new Float32Array(ab.byteLength / 2);
//             let i = 0;
//             for (let i = 0; i < b16.length; i++) {
//               //} of b16){
//               f32[i] = b16[i] / 0xffff;
//             }
//             chart(mkcanvas(330, 420, document.body), f32);
//           });
//       }
//       const zref = noteOn(2, 45, 22);
//     });
//   });
// });

mocha.run();
