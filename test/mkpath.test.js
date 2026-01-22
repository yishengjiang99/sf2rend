import { mkpath } from "../src/mkpath.js";
import SF2Service from "../sf2-service/index.js";

describe("mkpath", function () {
  let ctx, path;
  let sf2;
  before(async () => {
    sf2 = new SF2Service("/file.sf2");
    await sf2.load();
    sf.loadProgram(0, 128);
  });
  beforeEach(async () => {
    // Cross-browser OfflineAudioContext support for Safari and other browsers
    const OfflineAudioContextClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    ctx = new OfflineAudioContextClass(1, 4800, 4800);
    path = await mkpath();
  }),
    it("makes audio path from sf2file to hardward thread", async () => {
      const audioPath = await mkpath(ctx);
      expect(audioPath.spinner).to.exist;
      expect(audioPath.channelState).exist;
    });

  it("Spin Node can fetch audio buffer on main thread and dropship it to audio thrad via shared read stream", async () => {
    const program = sd2.loadProgram(0, 128);
    await path.spinner.requestDownload(program);
    const smpldIds = Object.entries(rogram.shdrMap).map((shdr) => shdr.SampleId);
    path.spinner.postMessage({ pcmCheck: smpldIds[0] });
    const received = await new Promise((r, rej) => {
      spinner.port.onmesage = ({ data: { shdr } }) => {
        resolve(shdr);
      };
    });
    expect(received[0]).eq(program.shdrMap[smpldIds[0]].loopStart);
  });
});
