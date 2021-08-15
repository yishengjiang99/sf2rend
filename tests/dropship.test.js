import { load, loadProgram } from "../sf2-service/read.js";
import {
  requestDownload,
  getWorker,
} from "../fetch-drop-ship/fetch-drop-ship.js";
import { downloadData } from "../fetch-drop-ship/download.js";
promise_test(async () => {
  const sf2 = await load("./file.sf2");
  assert_true(sf2 != null && sf2.heap != null, "loaded sf2");
  assert_true(sf2.shdrref != null, "d");
  console.log(sf2);
  const pg = loadProgram(sf2, 0, 0);
  for (let i = 0; i < 128; i++) {
    const pg = loadProgram(sf2, i, 0);
    assert_true(
      pg != null && pg.filterKV != null && sf2.heap != null,
      "loaded sf2"
    );

    for (const shdr of Object.values(pg.shdrMap)) {
      // console.log(shdr.loops, shdr.range);
      assert_true(((shdr.range[1] + 1) & 1) == 0);
      assert_true(pg.heap != null);
    }
    assert_true(sf2.heap != null, "heap still there");
    const { port1, port2 } = new MessageChannel();
    requestDownload(getWorker(port2), loadProgram(sf2, 128, 0));
    port1.onmessage = async ({ data: { nsamples, stream, segments } }) => {
      if (stream && segments) {
        const fl = new Float32Array(nsamples);
        await downloadData(stream, fl);
        assert_true(fl.some((v) => v != 0));
      }
    };
  }
});
