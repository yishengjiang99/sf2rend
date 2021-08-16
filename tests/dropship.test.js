import { load, loadProgram } from "../sf2-service/read.js";
import {
  requestDownload,
  getWorker,
} from "../fetch-drop-ship/fetch-drop-ship.js";
import { downloadData } from "../fetch-drop-ship/download.js";
import { mkcanvas, chart } from "../chart/chart.js";

export function test() {
  const ca = mkcanvas();
  promise_test(async () => {
    const sf2 = await load("./file.sf2");
    const { port1, port2 } = new MessageChannel();

    assert_true(sf2 != null && sf2.heap != null, "loaded sf2");
    assert_true(sf2.shdrref != null, "d");
    console.log(sf2);
    const worker = getWorker(port2);
    for (let i = 0; i < 128; i++) {
      const pg = loadProgram(sf2, i, 0);
      assert_true(
        pg != null && pg.filterKV != null && pg.zMap.length > 0,
        "loaded program" + i
      );

      for (const shdr of Object.values(pg.shdrMap)) {
        // console.log(shdr.loops, shdr.range);
        assert_true(
          shdr.range[0] < shdr.range[1] && shdr.range[1] % 2 == 1,
          "shdr range ok"
        );
      }
      assert_true(sf2.heap != null, "heap still there");
      requestDownload(worker, loadProgram(sf2, 0, i));
      port1.onmessage = async ({ data: { nsamples, stream, segments } }) => {
        if (stream && segments) {
          const fl = new Float32Array(nsamples);
          await downloadData(stream, fl);
          chart(ca, fl);
          assert_true(fl.some((v) => v != 0));
        }
      };
    }
  }, "basic");
}
