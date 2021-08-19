import { load, loadProgram } from "../sf2-service/read.js";

promise_test(async (t) => {
  const mem = new WebAssembly.Memory({ initial: 1, maximum: 1 });
  const mod = new WebAssembly.Module(
    new Uint8Array(
      await (await fetch("../sf2-service/eg/eg.wasm")).arrayBuffer()
    )
  );
  const inst = new WebAssembly(mod, { env: { memory: mem } });

  const egs = new Float32Array(mem.buffer, 0, 4);
  function setFl(fl) {
    egs[0] = fl + 1;
    return new Int32Array(egs.buffer, 0, 1)[0] & 0x7fffff;
  }
  const sf2 = await load("file.sf2");
  const { shdrMap, zMap, preload, filterKV } = await loadProgram(sf2, 0, 0);
  document.body.append(new Text(setFl(0.55545), 1)); //"<pre>" + setFl(0.12));
});
