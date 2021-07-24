import { load } from "../sf2-service/read.js";
import { mkdiv, logdiv } from "../node_modules/mkdiv/mkdiv.js";
import { newSFZone } from "../sf2-service/zoneProxy.js";

const statusDiv = mkdiv("span", { id: "rx1" });
const pre = mkdiv("pre", { id: "stdout" });

const { stderr, stdout, infoPanel, errPanel } = logdiv("#stdout", "#rx1");
document.body.append(statusDiv);
document.body.append(infoPanel);
document.body.append(errPanel);
const sf2URL = "file.sf2";
let ctx, proc, impulse, sf2service;
const aggShdrMap = {};
const main = mkdiv("main", {}, "check");
const startbtn = mkdiv("button", { onclick: start }, "Start");
main.append(startbtn);
main.attachTo(document.body);
const cent2sec = (cent) => Math.pow(2, cent / 1200);

var clist;
const zMap = {},
  shMap = {};
const divmap = {};
const sf2serviceWait = load(sf2URL, {
  onHeader: (pid, str) => {
    const loadlink = mkdiv(
      "a",
      {
        href: "#",
        onclick: (e) => {
          e.preventDefault();
          loadProgram(pid, 0).then(({ keyon, keyoff }) => {
            for (let i = 0x2a; i < 0x6c; i++)
              e.target.parentElement.appendChild(
                mkdiv(
                  "button",
                  {
                    midi: i,
                    onmousedown: (e) => {
                      keyon(e.target.getAttribute("midi"), 111);
                      e.target.addEventListener("mouseup", keyoff, {
                        once: true,
                      });
                    },
                  },
                  i.toString(16)
                )
              );
          });
        },
        style: "cursor:crosshair",
      },
      "load preset"
    );
    divmap[pid] = mkdiv("summary", { pid: pid }, [str, "&nbsp", loadlink])
      .wrapWith("details")
      .attachTo(main);
  },
  onZone(pid, ref, array) {
    zMap[pid] = zMap[pid] || {};
    zMap[pid][ref] = array;
    divmap[pid].append(mkdiv("div", {}, array));
  },
  onSample: function (str, start, len, attrs) {},
});

function setStatus(str) {
  statusDiv.textContent = str;
}
stdout("press anykey");

async function start() {
  if (!ctx) {
    ctx = new AudioContext();
    await ctx.audioWorklet.addModule("dist/rend.js");
  }
  sf2service = sf2service || (await sf2serviceWait);

  setStatus("load");
}

async function loadProgram(pid, aac) {
  const zmap = zMap[pid];
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
