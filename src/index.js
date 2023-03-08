import { mkdiv, mkdiv2, logdiv } from "../mkdiv/mkdiv.js";
import { SpinNode } from "../spin/spin.js";
import { mkui } from "./ui.js";
import SF2Service from "../sf2-service/index.js";
import { chart, mkcanvas, renderFrames } from "../chart/chart.js";
import { fetchmidilist, fetchSF2List } from "./midilist.js";
import { mkeventsPipe } from "./mkeventsPipe.js";
import { createChannel } from "./createChannel.js";
import { midi_ch_cmds } from "./midilist.js";
async function main() {
  let sf2,
    uiControllers,
    spinner,
    ctx = new AudioContext({ sampleRate: 48000 });
  let midiworker = new Worker("src/midiworker.js", {
    type: "module",
  });
  const channels = [];

  const rx1 = document.querySelector("#rx1");
  const rx2 = document.querySelector("#rx2");
  const timeslide = document.querySelector("progress");
  const cpanel = document.querySelector("#channelContainer");
  const cmdPanel = document.querySelector("#cmdPanel");
  const logdivfn = logdiv(document.querySelector("#stdout"));
  const stdout = logdivfn.stdout;

  midiworker.addEventListener("message", async function (e) {
    if (e.data.midifile) {
      const { totalTicks, tracks, presets } = e.data.midifile;
      for (const preset of presets) {
        const { pid, channel } = preset;
        const bkid = channel == 9 ? 128 : 0;
        channels[channel].setProgram(pid, bkid);
      }
      rx1.innerHTML = JSON.stringify([totalTicks]);
    } else if (e.data.channel) {
      eventPipe.postMessage(e.data.channel);
    } else if (e.data.qn) {
      rx1.innerHTML = e.data.qn;
      const seqrow = new Array(88).fill(" ");
      for (const c of uiControllers) {
        if (c.active && c.midi) seqrow[c.midi - 21] = "#";
      }
      stdout(seqrow.join(""));
    } else if (e.data.tempo) {
      rx2.innerHTML = "Tempo:" + (e.data.tempo | 0);
    } else if (e.data.t) {
      timeslide.value = e.data.t;
    } else if (e.data.meta) {
      onMidiMeta(stdout, e);
    }
  });

  mkdiv2({
    tag: "button",
    onclick: () => midiworker.postMessage({ cmd: "start" }),
    children: "start",
  }).attachTo(cmdPanel);

  mkdiv2({
    tag: "button",
    onclick: () =>
      midiworker.postMessage({ cmd: "pause" }) &&
      channels.forEach((c) => c.keyOff()),
    children: "pause",
  }).attachTo(cmdPanel);

  midiworker.postMessage({ cmd: "inited" });

  const midiList = await fetchmidilist();
  const midiSelect = mkdiv2({
    tag: "select",
    onchange: (e) =>
      midiworker.postMessage({ cmd: "load", url: e.target.value }),
    children: midiList.map((f) =>
      mkdiv("option", { value: f.get("Url") }, f.get("Name").substring(0, 80))
    ),
  });

  const sf2List = await fetchSF2List();
  const sf2select = mkdiv2({
    tag: "select",
    onchange: async (e) => {
      const sf2url = e.target.value;
      await loadSF2File(sf2url);
    },
    children: sf2List.map((f) => mkdiv("option", { value: f.url }, f.name)),
  });
  cmdPanel.append("sf2select");
  cmdPanel.append(sf2select);
  cmdPanel.append(midiSelect);

  const eventPipe = mkeventsPipe();
  uiControllers = mkui(cpanel, eventPipe);
  await SpinNode.init(ctx);
  spinner = new SpinNode(ctx);
  const masterMixer = new GainNode(ctx, { gain: 2.0 });
  spinner.connect(masterMixer).connect(ctx.destination);
  for (let i = 0; i < 16; i++) {
    channels.push(createChannel(uiControllers[i], i, sf2, spinner));
  }

  eventPipe.onmessage(function (data) {
    const [a, b, c] = data;
    const cmd = a & 0xf0;
    const ch = a & 0x0f;
    const key = b & 0x7f;
    const velocity = c & 0x7f;
    switch (cmd) {
      case midi_ch_cmds.continuous_change: // set CC
        channels[ch].setCC(key, velocity);
        stdout("midi set cc " + [ch, cmd, key, velocity].join("/"));
        break;
      case midi_ch_cmds.change_program: //change porg
        channels[ch].setProgram(key, ch == 9 ? 128 : 0);
        break;
      case midi_ch_cmds.note_off:
        channels[ch].keyOff(key, velocity);
        break;
      case midi_ch_cmds.note_on:
        console.log("key on ", ch);
        if (velocity == 0) {
          channels[ch].keyOff(key, velocity);
        } else {
          channels[ch].keyOn(key, velocity);
        }
        break;
      default:
        stdout("midi cmd: " + [ch, cmd, b, c].join("/"));
        break;
    }
  });
  const midiAccess = await navigator.requestMIDIAccess();
  const midiInputs = Array.from(midiAccess.inputs.values());
  midiInputs.forEach((input) => {
    input.onmidimessage = ({ data }) => {
      eventPipe.postMessage(data);
    };
  });

  await loadSF2File("test.sf2");
  //midiworker.postMessage({ cmd: "load", url: "../song.mid" });
  async function loadSF2File(sf2url) {
    sf2 = new SF2Service(sf2url);
    await sf2.load();
    channels.forEach((c) => c.setSF2(sf2));
    for (let i = 0; i <= 8; i++) {
      await channels[i].setProgram(i, 0);
    }
    await channels[9].setProgram(0, 128);
    for (const [section, text] of sf2.meta) {
      stdout(section + ": " + text);
    }
  }
}
main();

function onMidiMeta(stdout, e) {
  const metalist = [
    "seq num",
    "text",
    "cpyrght",
    "Track Name",
    "lyrics",
    "instrument",
    "marker",
    "cue point",
  ];
  const metaDisplay = (num) => {
    if (num < 8) return metalist[num];
    switch (num) {
      case 0x20:
        return "mc";
      case 0x21:
        return "port: ";
      case 0x51:
        return "tempo";
      case 0x2f:
        return "end of tack";
      case 0x58:
        return "time signature";
      default:
        return parseInt(num).toString(16);
    }
  };
  stdout(
    metaDisplay(e.data.meta) +
      ": " +
      e.data.payload +
      "|" +
      JSON.stringify(e.data)
  );
}
