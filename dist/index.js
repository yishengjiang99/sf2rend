import { load } from "../sf2-service/read.js";
import { mkdiv } from "../node_modules/mkdiv/mkdiv.js";

const statusDiv = document.createElement("span");
document.body.append(statusDiv);
const sf2URL = "file.sf2";
let ctx, proc, impulse, sf2service;
const aggShdrMap = {};
const main = mkdiv("main", {}, "check");
const startbtn = mkdiv("button", { onclick: start }, "Start");
main.append(startbtn);
main.attachTo(document.body);
const list = mkdiv("li").attachTo(main);

const sf2serviceWait = load(sf2URL, {
  onString: (str) => main.append(mkdiv("div", {}, str)),
  onLink: function (str, start, len) {
    main.append(
      mkdiv(
        "a",
        {
          target: "frame1",
          href: "#" + sf2URL + ":" + start + ":" + (start + len),
          start,
          len,
        },
        str
      )
    );
  },
});

function setStatus(str) {
  statusDiv.textContent = str;
}
setStatus("press anykey");

async function start() {
  ctx = new AudioContext({ sampleRate: 48000 });
  sf2service = await sf2serviceWait;
  setStatus("load");
  const keyon = await loadProgram(0, 0);
  keyon(0, 55, 88);
}

async function loadProgram(pid, aac) {
  const pref = sf2service.setProgram(pid, aac);
  if (!pref) return;
  const { shdrMap, zMap } = sf2service.zoneSampleHeaders(pref);

  await ctx.audioWorklet.addModule("dist/rend.js");
  proc = new AudioWorkletNode(ctx, "rendproc5", {
    outputChannelCount: [2],
  });
  proc.port.onmessage = console.log;
  await new Promise((resolve) =>
    proc.port.addEventListener("message", resolve, { once: true })
  );
  const pcmOffset = {};
  let offset = 0;
  for (const k of Object.keys(shdrMap)) {
    pcmOffset[k] = offset;
    offset += shdrMap[k].len;
  }
  const { readable, writable } = new TransformStream();
  (async () => {
    for await (const _ of await (async function* dlpcm() {
      let offset = 0;

      for (const k of Object.keys(shdrMap)) {
        const shdr = shdrMap[k];
        const pcm = await fetch(shdr.url, {
          headers: { Range: shdr.range },
        }).then((r) => r.body.pipeTo(writable, { preventClose: true }));
        shdrMap[k].offset = offset;
        offset += shdr.len;
        yield;
      }
      return;
    })());
  })();
  proc.port.postMessage({ readable }, [readable]);
  await writable.closed;
  proc.connect(ctx.destination);
  async function keyon(channel, key, vel) {
    const { zref, zone } = sf2service.noteOn(channel, key, vel);
    const cl = new Int16Array(60);
    cl.set(zone);
    proc.port.postMessage({
      zone: cl,
      pcmOffset,
      shdr: shdrMap[cl[53]].charClone,
      key,
      vel,
    });
  }
  return keyon;
}

function getMidi(code) {
  const keys = ["a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j"];
  return keys.indexOf(code) > -1
    ? Math.pow(2, (56 + keys.indexOf(code) - 69) / 12) * 440
    : 0;
}
function s16ArrayBuffer2f32(ab) {
  const b16 = new Int16Array(ab);

  const f32 = new Float32Array(ab.byteLength / 2);
  for (let i = 0; i < b16.length; i++) {
    //} of b16){
    f32[i] = b16[i] / 0xffff;
  }
  return f32;
}
