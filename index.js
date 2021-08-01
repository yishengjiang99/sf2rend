import { mkdiv, logdiv } from "./mkdiv/mkdiv.js";
import { load } from "./sf2-service/read.js";

import { realCtx, channel } from "./channel.js";
import { mkui } from "./ui.js";
mkdiv("button", { id: "midic" }, "connect to midi").attachTo(document.body);

let ctx, sf2;
const { stdout, stderr, infoPanel, errPanel } = logdiv();
const flist = document.querySelector("#sf2list");
const cpanel = document.querySelector("#channelContainer");
const { controllers, readable } = mkui(cpanel);
const channels = [],
  programs = {};
let cid = 0;
infoPanel.attachTo(cpanel);
errPanel.attachTo(cpanel);
const { port1, port2 } = new MessageChannel();
readable.pipeTo(
  new WritableStream({
    write(chunk, controller) {
      try {
        nomidimsg(chunk);
      } catch (error) {
        controller.error(error.message);
      }
    },
  })
);
function loadf(file) {
  flist.innerHTML = "";
  load(file, {
    onHeader: (pid, str) => {
      presetUI_sic(pid, str);
    },
  })
    .then((_sf2) => {
      ctx = initAudio(_sf2);
    })
    .then(() => {
      window.addEventListener("click", initMidi, { once: true });
    });
}
loadf("file.sf2");

async function initAudio(sf2) {
  ctx = await realCtx();
  for (let i = 0; i < 16; i++) {
    channels[i] = channel(ctx, sf2, i, controllers[i]);
  }
}
async function initMidi() {
  await ctx.resume();
  bindMidiAccess(port1);
  port2.onmessage = (e) => nomidimsg(e.data);
}
function nomidimsg(data) {
  const [a, b, c] = data;
  const stat = a >> 4;
  const ch = a & 0x0f;
  const key = b & 0x7f,
    vel = c & 0x7f;
  stdout(data);
  stderr(data);
  switch (stat) {
    case 0x0b: //chan set
      // channels[ch].setProgram(key);
      break;
    case 0xc: //change porg
      channels[ch].setProgram(key);
      break;
    case 0x08:
      channels[ch].keyOff(key, vel);
      break;
    case 0x09:
      if (vel == 0) {
        channels[ch].keyOff(key, vel);
      } else {
        channels[ch].keyOn(key, vel);
      }
      break;
    default:
      break;
  }
}
async function openNextChannel(pid, str) {
  if (channels[cid]) {
    console.log("loading");
    await channels[cid].setProgram(pid, 0);
    controllers[cid].name = str;
    cid++;
  }
}
function presetUI_sic(pid, str) {
  const loadlink = mkdiv(
    "a",
    {
      href: "#",
      pid: pid,
      style: "cursor:crosshair",
      onclick: () => openNextChannel(pid, str),
    },
    "load preset"
  );
  mkdiv("li", {}, [str, "&nbsp", loadlink]).attachTo(flist);
  programs[pid] = str;
}

async function bindMidiAccess(port, tee) {
  const midiAccess = await navigator.requestMIDIAccess();
  const midiInputs = Array.from(midiAccess.inputs.values());
  const midiOutputs = Array.from(midiAccess.outputs.values());
  midiInputs.forEach((input) => {
    input.onmidimessage = ({ data, timestamp }) => {
      if (port) port.postMessage(data);
    };
  });

  return [midiInputs, midiOutputs];
}
