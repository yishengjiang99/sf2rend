import { SharedRiffPipe } from "../shared-riff-pipe.js";
import sinon from "../node_modules/sinon/lib/sinon.js"; //https://unpkg.com/sinon@11.1.2/lib/sinon.js";
import { expect } from "../node_modules/chai/index.mjs";

describe("SharedRiffPipe", function () {
  it("instantiate", function () {
    const pipe = new SharedRiffPipe(new SharedArrayBuffer(68));
    expect(pipe).exists;
    expect(pipe.array).instanceOf(Uint32Array);
  });
  it("sending", function () {
    const pipe = new SharedRiffPipe(264);
    const sl = pipe.free_slot(120);
    expect(sl).eq(0);
    const zone = new Int16Array(60);
    pipe.send(0x0001, zone);
    expect(pipe.array[0]).eq(0x0001 | 0x8000);
  });
  it("sending then reading 1 msg", () => {
    const pipe = new SharedRiffPipe(264);
    const zone = new Int16Array(60);
    zone.fill(0);
    zone[5] = 33;
    pipe.send(0x0001, zone);
    const msgs = pipe.read();
    expect(msgs.length).eq(1);
  });
  it("sending then reading 2 msgs", () => {
    const pipe = new SharedRiffPipe(264);
    const zone = new Int16Array(60);
    zone.fill(0);
    zone[5] = 33;
    pipe.send(0x0001, zone);
    expect(pipe.free_slot(32)).eq(32);
    const shr = new Uint32Array(8);
    pipe.send(0x0002, shr);
    expect(pipe.array[0]).eq(0x0001 | 0x8000);
    expect(pipe.array[32]).eq(0x0002 | 0x8000);
    const msgs = pipe.read();
    expect(msgs.length).eq(2);
  });

  it("shared with worker", () => {});
});
