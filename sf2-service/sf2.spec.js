import {load} from "./index.js";
import { s16ArrayBuffer2f32 } from "../s16tof32.js";
import { mkcanvas, chart, resetCanvas } from "../chart.js";
document.body.id = "mocha";
mocha.setup("bdd");
const expect = globalThis.chai.expect;

describe("pdtaquery", () => {
  it("parswes file and loads zones", () => {
    load("../file.sf2").then(({ zoneSampleHeaders, setProgram, noteOn }) => {
      const sf = setProgram(0, 2);
      console.log(noteOn(2, 44, 33)); //;noteOn(2,44,33);
      for (const sh of zoneSampleHeaders(sf)) {
        expect(sh[1] > sh[0]);
      }
    });
  });
});
describe("pdtaquery", () => {
  it("parswes file and loads zones", () => {
    load("../file.sf2").then(
      ({ zoneSampleHeaders, setProgram, noteOn, zref2Zone }) => {
        const sf = setProgram(0, 2);
        const iter = zoneSampleHeaders(sf);
        for (const { shdr, zone } of iter) {
          if (shdr != null) {
            fetch(shdr.url, { headers: { Range: shdr.range } })
              .then((res) => res.arrayBuffer())
              .then((ab) => s16ArrayBuffer2f32(ab))
              .then((fl) => chart(mkcanvas(), fl));
          }
        }
        const zref = noteOn(2, 45, 22);
      }
    );
  });
});

mocha.run();
