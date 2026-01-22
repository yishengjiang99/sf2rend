import { mkdiv, mkdiv2, mksvg, logdiv } from 'https://unpkg.com/mkdiv@3.1.2/mkdiv.js';
import SF2Service from 'https://unpkg.com/sf2-service@1.3.6/index.js';

async function requestDownload(program, port) {
  await Promise.all(
    Object.values(program.shdrMap).map(async (shdr) => {
      const res = await fetch(program.url, {
        headers: {
          Range: `bytes=${shdr.range.join("-")}`,
        },
      }).catch((e) => {
        console.error(e, shdr);
      });

      port.postMessage(
        {
          segments: {
            sampleId: shdr.SampleId,
            nSamples: (shdr.range[1] + 1 - shdr.range[0]) / 2,
            loops: shdr.loops,
            sampleRate: shdr.sampleRate,
          },
          stream: res.body,
        },
        [res.body]
      );
      await res.body.closed;
    })
  );
}

let k;

class SpinNode extends AudioWorkletNode {
  static async init(ctx) {
    await ctx.audioWorklet.addModule("./spin/spin-proc.js");
  }
  static alloc(ctx) {
    if (!k) k = new SpinNode(ctx);
    return k;
  }
  constructor(ctx, numberOfOutputs = 1) {
    super(ctx, "spin-proc", {
      numberOfInputs: 0,
      numberOfOutputs,
      outputChannelCount: new Array(16).fill(2),
    });
  }

  keyOn(channel, zone, key, vel) {
    this.port.postMessage([
      0x0090,
      channel,
      zone.ref,
      zone.calcPitchRatio(key, this.context.sampleRate),
      vel,
    ]);
  }
  keyOff(channel, key, vel) {
    this.port.postMessage([0x80, channel, key, vel]);
  }

  async shipProgram(sf2program, presetId) {
    await requestDownload(sf2program, this.port);
    await this.postZoneAttributes(sf2program, presetId);
  }
  async postZoneAttributes(sf2program, presetId) {
    this.port.postMessage({
      presetId,
      zArr: sf2program.zMap.map((z) => {
        const shz = new Int16Array(60);
        shz.set(z.arr);
        return {
          arr: shz.buffer,
          ref: z.ref,
        };
      }),
    });
  }
  handleMsg(e) {
    console.log(e.data);
  }
}

const midi_ch_cmds$1 = {
  change_program: 0xc0,
  continuous_change: 0xb0,
  note_on: 0x90,
  note_off: 0x80,
  keyaftertouch: 0xa0, // 10
  pitchbend: 0xe0, // 14
};

const midi_effects = {
  bankselectcoarse: 0,
  modulationwheelcoarse: 1,
  breathcontrollercoarse: 2,
  footcontrollercoarse: 4,
  portamentotimecoarse: 5,
  dataentrycoarse: 6,
  volumecoarse: 7,
  balancecoarse: 8,
  pancoarse: 10,
  expressioncoarse: 11,
  pitchbendcoarse: 12,
  effectcontrol2coarse: 13,
  generalpurposeslider1: 16,
  generalpurposeslider2: 17,
  generalpurposeslider3: 18,
  generalpurposeslider4: 19,
  bankselectfine: 32,
  modulationwheelfine: 33,
  breathcontrollerfine: 34,
  footcontrollerfine: 36,
  portamentotimefine: 37,
  dataentryfine: 38,
  volumefine: 39,
  balancefine: 40,
  panfine: 42,
  expressionfine: 43,
  pitchbendfine: 44,
  effectcontrol2fine: 45,
  holdpedal: 64,
  portamento: 65,
  sustenutopedal: 66,
  softpedal: 67,
  legatopedal: 68,
  hold2pedal: 69,
  soundvariation: 70,
  resonance: 71,
  soundreleasetime: 72,
  soundattacktime: 73,
  brightness: 74,
  soundcontrol6: 75,
  soundcontrol7: 76,
  soundcontrol8: 77,
  soundcontrol9: 78,
  soundcontrol10: 79,
  generalpurposebutton1: 80,
  generalpurposebutton2: 81,
  generalpurposebutton3: 82,
  generalpurposebutton4: 83,
  reverblevel: 91,
  tremololevel: 92,
  choruslevel: 93,
  celestelevel: 94,
  phaserlevel: 95,
  databuttonincrement: 96,
  databuttondecrement: 97,
  nonregisteredparametercoarse: 98,
  nonregisteredparameterfine: 99,
  registeredparametercoarse: 100,
  registeredparameterfine: 101,
};

/* eslint-disable react/prop-types */

const rowheight = 40;
const pixelPerSec = 12;
let ControllerState;

class TrackUI {
  constructor(idx, cb) {
    this.idx = idx;
    this.nameLabel = mkdiv2({
      tag: "input",
      type: "text",
      autocomplete: "off",
      onfocus: (e) => (e.target.value = ""),
      list: idx == 9 ? "drums" : "programs",
      onchange: (e) => {
        const pid = Array.from(e.target.list.options).findIndex(
          (d) => d.value == e.target.value
        );
        cb([midi_ch_cmds$1.change_program | idx, pid, idx == 9 ? 128 : 0]);
        e.target.blur();
      },
    });

    const container = mkdiv(
      "details",
      {
        style: "display:grid; grid-template-columns:1fr 1fr;",
        class: "instrPanels",
      },
      [
        mkdiv(
          "summary",
          {
            class: "attrs",
            style: "width:320px;padding:20px",
          },
          [
            mkdiv("input", { type: "checkbox" }),
            this.nameLabel,
            mkdiv(
              "a",
              {
                onclick: () => (ControllerState.activeChannelUserInput = idx),
              },
              "play"
            ),
          ]
        ),
        mkdiv("label", { for: "mkey" }, "key"),
        mkdiv("meter", {
          min: 0,
          max: 127,
          id: "mkey",
          aria: "key",
        }),
        mkdiv("label", { for: "velin" }, "velocity"),

        mkdiv("meter", {
          type: "range",
          id: "velin",
          min: 1,
          max: 127,
          step: 1,
          aria: "vel",
          value: 60,
        }),
        mkdiv("label", { for: "vol" }, "volume"),

        mkdiv("input", {
          min: 0,
          max: 127,
          value: 100,
          step: 1,
          id: "vol",
          type: "range",
          oninput: (e) => cb([0xb0 | idx, 7, e.target.value]),
        }),
        mkdiv("label", { for: "pan" }, "pan"),
        mkdiv("input", {
          min: 0,
          max: 127,
          step: 1,
          type: "range",
          value: 64,
          oninput: (e) => cb([0xb0 | idx, 10, e.target.value]),
        }),
        mkdiv("label", { for: "expression" }, "expression"),
        mkdiv("input", {
          min: 0,
          max: 127,
          step: 1,
          value: 127,
          type: "range",
          oninput: (e) => cb([0xb0 | idx, 11, e.target.value]),
        }),

        mkdiv("label", { for: "other" }, "other"),
        mkdiv("input", {
          min: 0,
          id: "other",
          max: 127,
          step: 1,
          value: 127,
          type: "range",
          oninput: (e) => cb([0xb0 | idx, 11, e.target.value]),
        }),
        mksvg(
          "svg",
          {
            style: "width:80px;height:59px; display:inline;",
            viewBox: "0 0 80 60",
          },
          [
            mksvg("polyline", {
              fill: "red",
              stroke: "black",
            }),
          ]
        ),
      ]
    );

    this.meters = container.querySelectorAll("meter");

    this.sliders = Array.from(
      container.querySelectorAll("input[type='range']")
    );
    const [keyLabel, velLabel, ...ccLabels] =
      container.querySelectorAll("label");
    this.ccLabels = ccLabels;
    this.led = container.querySelector("input[type=checkbox]");
    this.polylines = Array.from(container.querySelectorAll("polyline"));
    this.container = container;
    this._active = false;
    this._midi = null;
  }
  set presetId(presetId) {
    ControllerState = {
      ...ControllerState,
      channels: {
        ...ControllerState.channels,
        [this.idx]: presetId,
      },
    };
  }
  set name(id) {
    this.nameLabel.value = id;
  }
  8;
  get name() {
    return this.nameLabel.value;
  }
  set midi(v) {
    this._midi = v;
    this.meters[0].value = v;
  }
  get midi() {
    return this._midi;
  }
  set CC({ key, value }) {
    console.log(value, key);
    switch (key) {
      case midi_effects.volumecoarse:
        this.sliders[0].value = value;
        this.ccLabels[0].innerHTML = "volume" + value;
        break;
      case midi_effects.pancoars:
        this.sliders[1].value = value;
        this.ccLabels[1].innerHTML = "pan" + value;
        break;
      case midi_effects.expressioncoarse:
        this.sliders[2].value = value;
        this.ccLabels[2].innerHTML = "exp" + value;
        break;
      default:
        this.sliders[3].value = "midi " + key;
        this.ccLabels[3].innerHTML = "value" + value;
        break;
    }
  }
  set velocity(v) {
    this.meters[1].value = v;
  }
  get velocityInput() {
    return this.meters[1].value;
  }
  get active() {
    return this._active;
  }
  set active(b) {
    this._active = b;
    if (b) {
      this.led.setAttribute("checked", "checked");
    } else {
      this.led.removeAttribute("checked");
    }
  }
  set env1({ phases: [a, d, s, r], peak }) {
    const points = [
      [0, 0],
      [a, 1],
      [a + d, s / 100],
      [a + d + r, 0],
    ];
    points
      .map(([x, y]) => [x * pixelPerSec, (1 - y) * 0.8 * rowheight].join(","))
      .join(" ");
    this.polylines[0].setAttribute("points", points);
  }
}

function mkui(eventPipe, container) {
  const controllers = [];
  let refcnt = 0,
    activeChannel = 0;
  const tb = mkdiv("div", {
    border: 1,
    style: `height:500px;overflow-y:scroll`,
  });

  for (let i = 0; i < 16; i++) {
    const trackrow = new TrackUI(i, eventPipe.postMessage);
    controllers.push(trackrow);
    tb.append(trackrow.container);
    trackrow.container.onclick = (e) => {
      e.target.style.background_color = "pink";
      ControllerState.activeChannelUserInput = i;
    };
  }
  const mkKeyboard = mkdiv(
    "div",
    { class: "keyboards" },
    range(48, 72).map((midi, i) =>
      mkdiv(
        "a",
        {
          midi,
          onmousedown: (e) => {
            refcnt++;
            eventPipe.postMessage([0x90 | activeChannel, midi, 120]);
            e.target.addEventListener(
              "mouseup",
              () =>
                refcnt >= 0 &&
                eventPipe.postMessage([0x80 | activeChannel, midi, 88]),
              { once: true }
            );
          },
        },
        [i % 12 ? " " : mkdiv("br"), midi]
      )
    )
  );
  const keyboard = mkKeyboard;
  mkdiv("div");
  ControllerState = new Proxy(
    {
      channels: {},
      activeChannelUserInput: 1,
      activeZoneDebug: 1,
    },
    {
      async set(obj, prop, value) {
        console.log(prop, value);

        switch (prop) {
          case "channels":
            console.log(prop, value);
            break;
        }
      },
    }
  );
  const cpanel = mkdiv2({
    tag: "div",
    border: 1,
    style: `height:500px;8display:grid;grid-area:a a a, b c c`,
    children: [tb, keyboard, mkdiv()],
  });

  cpanel.attachTo(container);
  return controllers;
}


const range = (x, y) =>
  Array.from(
    (function* _(x, y) {
      while (x < y) yield x++;
    })(x, y)
  );

const midi_ch_cmds = {
  change_program: 0xc0,
  continuous_change: 0xb0,
  note_on: 0x90,
  note_off: 0x80,
  keyaftertouch: 0xa0, // 10
  pitchbend: 0xe0, // 14
};
var xml_attr = [
  "Name",
  "Url",
  "LastModified",
  "Etag",
  "Size",
  "ContentType",
  "ContentEncoding",
  "ContentLanguage",
];


function fetchmidilist(
  url = "https://grep32bit.blob.core.windows.net/midi?resttype=container&comp=list"
) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "document";
    xhr.send();
    xhr.onload = function () {
      if (xhr.responseXML) {
        const blobs = Array.from(xhr.responseXML.querySelectorAll("Blob"));
        resolve(
          blobs
            .map(function (b) {
              var ff = new Map();
              xml_attr.forEach(function (attr) {
                ff.set(attr, b.querySelector(attr).textContent);
              });
              return ff;
            })
            .sort((a, b) =>
              new Date(a.LastModified) < new Date(b.lastModified) ? -1 : 1
            )
        );
      }
    };
    xhr.onerror = reject;
    xhr.ontimeout = reject;
  });
}

function fetchSF2List(
  url = "https://grep32bit.blob.core.windows.net/sf2?resttype=container&comp=list"
) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "document";
    xhr.send();
    xhr.onload = function () {
      if (xhr.responseXML) {
        const blobs = Array.from(xhr.responseXML.querySelectorAll("Blob"));
        resolve(
          blobs.map((b) => {
            return {
              url: b.querySelector("Url").textContent,
              name: b.querySelector("Name").textContent,
            };
          })
        );
      }
    };
    xhr.onerror = reject;
    xhr.ontimeout = reject;
  });
}

function mkeventsPipe() {
  const _arr = [];
  let _fn;
  return {
    onmessage(fn) {
      _fn = fn;
    },
    postMessage(item) {
      _arr.push(item);
      if (_fn) _fn(_arr.shift());
    },
  };
}

function createChannel(uiController, channelId, sf2, spinner) {
  let _sf2 = sf2;
  let program;

  return {
    setSF2(sf2) {
      _sf2 = sf2;
    },
    async setProgram(pid, bid) {
      program = _sf2.loadProgram(pid, bid);
      await spinner.shipProgram(program, pid | bid);
      uiController.name = program.name;
      uiController.presetId = pid;
    },
    setCC({ key, vel }) {
      spinner.port.postMessage([0xb0, channelId, key, vel]);
      uiController.CC = { key, value: vel };
    },
    keyOn(key, vel) {
      const zones = program.filterKV(key, vel);
      zones.slice(0, 2).map((zone, i) => {
        spinner.keyOn(channelId * 2 + i, zone, key, vel);
      });

      if (!zones[0]) return;
      requestAnimationFrame(() => {
        uiController.active = true;
        uiController.velocity = vel;
        uiController.midi = key;
        //  uiController.zone = zones[0];
      });
    },
    keyOff(key, vel) {
      spinner.keyOff(channelId * 2, key, vel);
      spinner.keyOff(channelId * 2 + 1, key, vel);

      requestAnimationFrame(() => (uiController.active = false));
    },
  };
}

const getParams = new URLSearchParams(document.location.search);
main(
  getParams.get("sf2file") || "file.sf2",
  getParams.get("midifile") || "song.mid");

async function main(sf2file, midifile) {
  // Cross-browser AudioContext support for Safari and other browsers
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let sf2,
    uiControllers,
    ctx = new AudioContextClass({ sampleRate: 48000 }),
    midiworker = new Worker("src/midiworker.js", {
      type: "module",
    });

  const channels = [];
  const $ = (sel) => document.querySelector(sel);
  const sf2select = $("#sf2select"),
    timeslide = $("#timeSlider"),
    playBtn = $("#play"),
    pauseBtn = $("#stop"),
    timeNow = $("#timeNow"),
    tempo = $("#tempo"),
    duration = $("#duration");
    $("#timeSig");
    const msel = $("#msel");

  const drumList = document.querySelector("#drums");
  const programList = document.querySelector("#programs");
  const {infoPanel,errPanel,stdout,stderr} = logdiv();
  infoPanel.attachTo(document.querySelector("#stdout"));
  errPanel.attachTo(document.querySelector("#stderr"));

  midiworker.addEventListener("message", async function (e) {
    if (e.data.midifile) {
      const { totalTicks, tracks, presets } = e.data.midifile;
      const queues=[[],[],[]];
      const [l1,l2,l3]=queues;
      for (const preset of presets) {
        const { pid, channel } = preset;
        const bkid = channel == 9 ? 128 : 0;
        queues[pid%3].push(channels[channel].setProgram(pid, bkid));
      }
      duration.innerHTML = totalTicks / 4;
      timeslide.setAttribute("max", totalTicks);
      //load sf2 files in 3 batchesd
      await Promise.all(l1);
      await Promise.all(l2);
      await Promise.all(l3);
      
      playBtn.removeAttribute("disabled");
    } else if (e.data.channel) {
      eventPipe.postMessage(e.data.channel);
    } else if (e.data.qn) {
      timeslide.value = e.data.qn;
      timeNow.innerHTML = e.data.qn;
      if (e.data.qn % 4) return;
      const seqrow = new Array(88).fill(" ");
      for (const c of uiControllers) {
        if (c.active && c.midi) seqrow[c.midi - 21] = "#";
      }
      stdout(seqrow.join(""));
    } else if (e.data.tempo) {
      tempo.innerHTML = e.data.tempo;
    } else if (e.data.t) ; else if (e.data.meta) {
      onMidiMeta(stderr, e);
    }
  });

  playBtn.onclick = () => midiworker.postMessage({ cmd: "start" });
  pauseBtn.onclick = () => midiworker.postMessage({ cmd: "pause" });
  midiworker.postMessage({ cmd: "inited" });

  const midiList = await fetchmidilist();
  const midiSelect = mkdiv2({
    tag: "select",
    style: "width:300px",
    value: midifile,
    onchange: (e) =>{
      document.location.href=`?midifile=${e.target.value}&sf2file=${sf2file}`;
    },
    children: midiList.map((f) =>
      mkdiv("option", { value: f.get("Url"), seleced: f.get("Url")===midifile }, f.get("Name").substring(0, 80))
    ),
  });
  midiSelect.attachTo(msel);

  const sf2List = await fetchSF2List();
  sf2select.onchange = (e) =>  document.location.href=`?midifile=${midifile}&sf2file=${e.target.value}`;
  for (const f of sf2List)
    sf2select.append(mkdiv("option", { value: f.url }, f.name));

  const eventPipe = mkeventsPipe();
  uiControllers = mkui(eventPipe, $("#channelContainer"));
  await SpinNode.init(ctx);
  const spinner = new SpinNode(ctx, 16);
  const merger = new GainNode(ctx);
  const masterMixer = new GainNode(ctx, { gain: 1.0 });
  for (let i = 0; i < 16; i++) {
    spinner.connect(merger, i, 0);
  }
  merger.connect(masterMixer).connect(ctx.destination);
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
        channels[ch].setCC({ key, vel: velocity });
        stdout("midi set cc " + [ch, cmd, key, velocity].join("/"));
        break;
      case midi_ch_cmds.change_program: //change porg
        stdout("midi change program " + [ch, cmd, key, velocity].join("/"));

        channels[ch].setProgram(key, ch == 9 ? 128 : 0);
        break;
      case midi_ch_cmds.note_off:
        channels[ch].keyOff(key, velocity);
        break;
      case midi_ch_cmds.note_on:
        if (velocity == 0) {
          channels[ch].keyOff(key, velocity);
        } else {
          //stdout([ch, cmd, key, velocity].join("/"));
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
  ctx.onstatechange = () => stdout("ctx state " + ctx.state);
  window.addEventListener("click", () => ctx.resume(), { once: true });
  async function loadSF2File(sf2url) {
    sf2 = new SF2Service(sf2url);
    await sf2.load();
    programList.innerHTML = "";
    drumList.innerHTML = "";
    sf2.programNames.forEach((n, presetIdx) => {
      if (presetIdx < 128) {
        mkdiv2({ tag: "option", value: n, children: n }).attachTo(programList);
      } else {
        mkdiv2({ tag: "option", value: n, children: n }).attachTo(drumList);
      }
    });
    channels.forEach((c) => c.setSF2(sf2));
    for (const [section, text] of sf2.meta) {
      stderr(section + ": " + text);
    }
  }
  playBtn.setAttribute("disabled",true);
  await loadSF2File(sf2file);  
  midiworker.postMessage({cmd:"load",url:midifile});
}

function onMidiMeta(stderr, e) {
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
      case 0x2f:
        return "end of tack";
      case 0x51:
        return "tempo";
      case 0x54:
        return "SMPTE offset";
      case 0x58:
        return "time signature";
      case 0x59:
        return "Key Sig";
      default:
        return parseInt(num).toString(16);
    }
  };
  stderr(metaDisplay(e.data.meta) + ": " + e.data.payload);
}
