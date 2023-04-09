
function mkdiv(type, attr, children) {
  switch (arguments.length) {
    case 1:
      return mkdiv(type, {}, "");
    case 2:
      return Array.isArray(attr) || typeof attr === "string"
        ? mkdiv(type, {}, attr)
        : mkdiv(type, attr, []);
  }
  const div = document.createElement(type);
  for (const key in attr) {
    if (key.match(/on(.*)/)) {
      div.addEventListener(key.match(/on(.*)/)[1], attr[key]);
    } else {
      div.setAttribute(key, attr[key]);
    }
  }
  const charray = !Array.isArray(children) ? [children] : children;
  charray.forEach((c) => {
    typeof c == "string" ? (div.innerHTML += c) : div.append(c);
  });
  div.attachTo = function (parent) {
    parent.append(this);
    return this;
  };
  return div;
}

const logDivStyle = "width:40vw;height:280px;overflow-y:scroll";
function logdiv() {
  const logs = [],
    errLogs = [],
    infoPanel = mkdiv("textarea", {
      rows: 50,
      style: logDivStyle,
    }),
    errPanel = mkdiv("textarea", {
      style: logDivStyle,
    });

  const stdout = (log) => pushLog(log, logs, infoPanel);
  const stderr = (log) => pushLog(log, errLogs, errPanel);

  function pushLog(str, logArr, destination) {
    logArr.push((performance.now() / 1e3).toFixed(3) + ": " + str);
    if (logArr.length > 100) logArr.shift();
    destination.innerHTML = logs.join("\n");
    // requestAnimationFrame(()=>destination.scrollTop = destination.scrollHeight);
  } 
  return {
    stderr,
    stdout,
    infoPanel,
    errPanel,
  };
}
function mkdiv2({tag, children, ...attr}) {
  return mkdiv(tag, attr, children);
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

/* eslint-disable no-unused-vars */
const attributeKeys$1 = [
  "StartAddrOfs",
  "EndAddrOfs",
  "StartLoopAddrOfs",
  "EndLoopAddrOfs",
  "StartAddrCoarseOfs",
  "ModLFO2Pitch",
  "VibLFO2Pitch",
  "ModEnv2Pitch",
  "FilterFc",
  "FilterQ",
  "ModLFO2FilterFc",
  "ModEnv2FilterFc",
  "EndAddrCoarseOfs",
  "ModLFO2Vol",
  "Unused1",
  "ChorusSend",
  "ReverbSend",
  "Pan",
  "Unused2",
  "Unused3",
  "Unused4",
  "ModLFODelay",
  "ModLFOFreq",
  "VibLFODelay",
  "VibLFOFreq",
  "ModEnvDelay",
  "ModEnvAttack",
  "ModEnvHold",
  "ModEnvDecay",
  "ModEnvSustain",
  "ModEnvRelease",
  "Key2ModEnvHold",
  "Key2ModEnvDecay",
  "VolEnvDelay",
  "VolEnvAttack",
  "VolEnvHold",
  "VolEnvDecay",
  "VolEnvSustain",
  "VolEnvRelease",
  "Key2VolEnvHold",
  "Key2VolEnvDecay",
  "Instrument",
  "Reserved1",
  "KeyRange",
  "VelRange",
  "StartLoopAddrCoarseOfs",
  "Keynum",
  "Velocity",
  "Attenuation",
  "Reserved2",
  "EndLoopAddrCoarseOfs",
  "CoarseTune",
  "FineTune",
  "SampleId",
  "SampleModes",
  "Reserved3",
  "ScaleTune",
  "ExclusiveClass",
  "OverrideRootKey",
  "Dummy",
];

function newSFZoneMap$1(ref, attrs) {
  var obj = {ref};
  for (let i = 0;i < 60;i++) {
    if (attributeKeys$1[i] == "VelRange" || attributeKeys$1[i] == "KeyRange") {
      obj[attributeKeys$1[i]] = {
        hi: (attrs[i] & 0x7f00) >> 8,
        lo: attrs[i] & 0x007f,
      };
    } else {
      obj[attributeKeys$1[i]] = attrs[i];
    }
  }
  obj.arr = attrs;
  return obj;
}

/* eslint-disable react/prop-types */

const rowheight = 40;
const pixelPerSec = 12;

function mkui(
  eventPipe,
  container,
  {onTrackClick, onTrackDoubleClick, onEditZone}
) {
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
          cb([midi_ch_cmds.change_program | idx, pid, idx == 9 ? 128 : 0]);
          e.target.blur();
        },
      });
      this.led = mkdiv("input", {type: "checkbox"});
      this.zoneEdit = mkdiv("div", {
        style: "background-color:black;color:white;display:none",
      });
      this.zoneEdit.innerHTML = `          
      <label for="modal-control${idx}"><a>zedit</a></label>
      <input type="checkbox" id="modal-control${idx}" class="modal">
      <div>
      <label for="modal-control${idx}" class="modal-close" >Close Modal</label>
      <p class='editTable'></p>
      </div>`;

      const newLocal = "amp-indicate";
      const meterDiv = mkdiv(
        "span",
        {
          style: "display:grid; grid-template-columns:1fr 1fr",
          class: "instrPanels",
        },
        [
          this.led,
          this.nameLabel,
          mkdiv("label", {for: "mkey"}, "key"),
          mkdiv("meter", {
            min: 0,
            max: 127,
            id: "mkey",
            aria: "key",
          }),
          mkdiv("label", {for: "velin"}, "velocity"),

          mkdiv("meter", {
            type: "range",
            id: "velin",
            min: 1,
            max: 127,
            step: 1,
            aria: "vel",
            value: 60,
          }),
          mkdiv("label", {for: "vol"}, "volume"),

          mkdiv("input", {
            min: 0,
            max: 127,
            value: 100,
            step: 1,
            id: "vol",
            type: "range",
            oninput: (e) => cb([0xb0 | idx, 7, e.target.value]),
          }),
          mkdiv("label", {for: "pan"}, "pan"),
          mkdiv("input", {
            min: 0,
            max: 127,
            step: 1,
            type: "range",
            value: 64,
            oninput: (e) => cb([0xb0 | idx, 10, e.target.value]),
          }),
          mkdiv("label", {for: "expression"}, "expression"),
          mkdiv("input", {
            min: 0,
            max: 127,
            step: 1,
            value: 127,
            type: "range",
            oninput: (e) => cb([0xb0 | idx, 11, e.target.value]),
          }),

          mkdiv("label", {for: "filterFC"}, "filterFC"),
          mkdiv("input", {
            min: 1000,
            id: "filterFC",
            max: 13700,
            step: 10,
            value: 13700,
            type: "range",
            "data-path_cmd": "lpf",
            "data-p1": idx,
          }),
          mkdiv("div", [
            mkdiv("input", {
              type: "checkbox",
              id: "mute",
              "data-path_cmd": "mute",
              "data-p1": idx,
            }),
            mkdiv("label", {for: "mute"}, "mute"),
          ]),
          mkdiv("div", [
            mkdiv(
              "input",
              {type: "checkbox", "data-path_cmd": "solo", "data-p1": idx},
              "solo"
            ),
            mkdiv("label", {for: "solo"}, "solo"),
          ]),
          mkdiv(
            "span",
            {
              class: newLocal,
            },
            ""
          ),
        ]
      );
      const container = mkdiv("div", [meterDiv, this.zoneEdit]);

      this.meters = container.querySelectorAll("meter");

      this.sliders = Array.from(
        container.querySelectorAll("input[type='range']")
      );
      const [keyLabel, velLabel, ...ccLabels] =
        container.querySelectorAll("label");
      this.ccLabels = ccLabels;

      this.polylines = Array.from(container.querySelectorAll("polyline"));
      this.container = container;
      this._active = false;
      this._midi = null;
    }
    set hidden(h) {
      this.container.style.display = h ? "none" : "grid";
    }
    set presetId(presetId) {
      this._pid = presetId;
    }
    set name(id) {
      this.nameLabel.value = id;
    }
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
    set CC({key, value}) {
      switch (key) {
        case midi_effects.volumecoarse:
          this.sliders[0].value = value;
          this.ccLabels[0].innerHTML = "volume" + value;
          break;
        case midi_effects.pancoarse:
          this.sliders[1].value = value;
          this.ccLabels[1].innerHTML = "pan" + value;
          break;
        case midi_effects.expressioncoarse:
          this.sliders[2].value = value;
          this.ccLabels[2].innerHTML = "exp" + value;
          break;
        // case effects.pitchbendcoarse:
        //   this.sliders[3].value = "midi " + key;
        //   this.ccLabels[3].innerHTML = "value" + value;
        //   break;
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
    set zone(z) {
      const {arr, ref} = z;
      const zmap = newSFZoneMap$1(ref, new Uint16Array(arr));
      this._zone = {
        arr,
        ref,
      };
      this.zoneEdit.style.display = "grid";
      this.zoneEdit.querySelector(".editTable").replaceChildren(
        mkdiv(
          "form",
          {
            onsubmit: (e) => {
              e.preventDefault();
              const atts = new Int16Array(
                Array.from(new FormData(e.target).values())
              );
              z.arr.set(atts);
              onEditZone({
                arr: atts,
                update: [this._pid, ref],

              }).then((confirmation1) => {
                console.log(confirmation1);
              });
            },
          },
          mkdiv("table", {border: 1}, [
            mkdiv("thead", [
              mkdiv("tr", {class: "sticky"}, [
                mkdiv("th", [
                  mkdiv("input", {
                    role: "button",
                    value: "save",
                    type: "submit",
                  }),
                ]),
                mkdiv("th", {}, [ref]),
              ]),
            ]),
            ...Array.from(this._zone.arr).map((attr, index) =>
              mkdiv("tr", [
                mkdiv("td", {}, attributeKeys$1[index]),
                mkdiv("td", {}, [
                  mkdiv("input", {
                    value: attr,
                    name: index,
                    placeholder: "a",
                  }),
                  ...(index == 43 || index == 44
                    ? [
                      zmap[attributeKeys$1[index]].lo,
                      "-",
                      zmap[attributeKeys$1[index]].hi,
                    ]
                    : []),
                ]),
              ])
            ),
          ])
        )
      );
    }
    set env1([a, h, d, s, r]) {
      const points = [
        [0, 0],
        [a, 1],
        [a + d, s / 100],
        [a + d + r, 0],
      ]
        .map(([x, y]) => [x * pixelPerSec, (1 - y) * 0.8 * rowheight].join(","))
        .join(" ");
      this.polylines[0].setAttribute("points", points);
    }
  }
  const controllers = [];
  let refcnt = 0;
  let _activeChannel = 0;
  const tb = mkdiv("div", {
    border: 1,
    style: `display:flex;flex-direction:row; grid-gap:20px;flex-wrap:wrap`,
  });

  for (let i = 0; i < 16; i++) {
    const trackrow = new TrackUI(i, eventPipe.postMessage);
    controllers.push(trackrow);
    tb.append(trackrow.container);
    trackrow.container.classList.add("channelCard");
    trackrow.container.addEventListener(
      "mouseenter",
      (e) => {
        _activeChannel = i;
        e.target.parentElement
          .querySelectorAll(".active")
          .forEach((e) => e.classList.remove("active"));
        trackrow.container.classList.add("active");
      },
      false
    );
    trackrow.container.addEventListener("dblclick", (e) => {
      onTrackDoubleClick(i, e);
    });
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
            eventPipe.postMessage([0x90 | _activeChannel, midi, 120]);
            e.target.addEventListener(
              "mouseup",
              () =>
                refcnt >= 0 &&
                eventPipe.postMessage([0x80 | _activeChannel, midi, 88]),
              { once: true }
            );
          },
        },
        [i % 12 ? " " : mkdiv("br"), midi]
      )
    )
  );
  const cpanel = mkdiv("div", [tb, mkKeyboard]);

  cpanel.attachTo(container);

  return {
    controllers,
    get activeChannel() {
      return _activeChannel;
    },
    set activeChannel(c) {
      _activeChannel = c;
    },
  };
}

async function sfbkstream(url) {
  const res = await fetch(url, {headers: {Range: "bytes=0-6400"}}).catch(e => console.trace(e));
  if (!res.ok) return false;

  const ab = await res.arrayBuffer();

  const [infos, readOffset, meta] = readInfoSection(ab);
  const sdtaSize = readOffset.get32();
  if (bytesToString(readOffset.readNString(4)) !== "sdta")
    throw new Error("read failed " + url);
  console.assert(bytesToString(readOffset.readNString(4)) === "smpl");

  const sdtaStart = readOffset.offset;
  const pdtastart = sdtaStart + sdtaSize + 4;

  const pdtaHeader = {
    headers: {Range: "bytes=" + pdtastart + "-"},
  };

  return {
    nsamples: (pdtastart - sdtaStart) / 2,
    sdtaStart,
    infos,
    meta,
    pdtaBuffer: new Uint8Array(
      await (await fetch(url, pdtaHeader)).arrayBuffer()
    ),
    fullUrl: res.url,
  };
}
function readInfoSection(ab) {
  const infosection = new Uint8Array(ab);
  const r = readAB(infosection);
  const [riff, filesize, sig, list] = [
    r.readNString(4),
    r.get32(),
    r.readNString(4),
    r.readNString(4),
  ];
  console.log([riff, filesize, sig, list]);
  let infosize = r.get32();
  console.assert(bytesToString(r.readNString(4)) === "INFO");

  const infos = [];
  console.assert(infosize < 10000);
  while (infosize >= 8) {
    const [sb, size] = [r.readNString(4), r.get32()];
    const section = bytesToString(sb);
    const val = bytesToString(r.readNString(size));

    infos.push([section, val]);
    infosize = infosize - 8 - size;
  }
  const meta = {
    riff: bytesToString(riff),
    filesize,
    sig,
  };

  console.assert(bytesToString(r.readNString(4)) === "LIST");
  return [infos, r, meta];
}
function bytesToString(ab) {
  let str = "";
  for (const b of Object.values(ab)) {
    if (!b) break;
    if (b < 10) str += b.toString();
    else str += String.fromCharCode(b);
  }
  return str;
}
function readAB(arb) {
  const u8b = new Uint8Array(arb);
  let _offset = 0;
  function get8() {
    return u8b[_offset++];
  }
  function getStr(n) {
    const str = u8b.subarray(_offset, _offset + n); //.map((v) => atob(v));
    _offset += n;
    return str;
  }
  function get32() {
    return get8() | (get8() << 8) | (get8() << 16) | (get8() << 24);
  }
  const get16 = () => get8() | (get8() << 8);
  const getS16 = () => {
    const u16 = get16();
    if (u16 & 0x8000) return -0x10000 + u16;
    else return u16;
  };
  const readN = (n) => {
    const ret = u8b.slice(_offset, n);
    _offset += n;
    return ret;
  };
  function varLenInt() {
    let n = get8();
    while (n & 0x80) {
      n = get8();
    }
    return n;
  }
  const skip = (n) => {
    _offset = _offset + n;
  };
  const read32String = () => getStr(4);
  const readNString = (n) => getStr(n);
  return {
    skip,
    get8,
    get16,
    getS16,
    readN,
    read32String,
    varLenInt,
    get32,
    readNString,
    get offset() {
      return _offset;
    },
    set offset(n) {
      _offset = n;
    },
  };
}

/* eslint-disable no-unused-vars */
const attributeKeys = [
  "StartAddrOfs",
  "EndAddrOfs",
  "StartLoopAddrOfs",
  "EndLoopAddrOfs",
  "StartAddrCoarseOfs",
  "ModLFO2Pitch",
  "VibLFO2Pitch",
  "ModEnv2Pitch",
  "FilterFc",
  "FilterQ",
  "ModLFO2FilterFc",
  "ModEnv2FilterFc",
  "EndAddrCoarseOfs",
  "ModLFO2Vol",
  "Unused1",
  "ChorusSend",
  "ReverbSend",
  "Pan",
  "IbagId",
  "PBagId",
  "Unused4",
  "ModLFODelay",
  "ModLFOFreq",
  "VibLFODelay",
  "VibLFOFreq",
  "ModEnvDelay",
  "ModEnvAttack",
  "ModEnvHold",
  "ModEnvDecay",
  "ModEnvSustain",
  "ModEnvRelease",
  "Key2ModEnvHold",
  "Key2ModEnvDecay",
  "VolEnvDelay",
  "VolEnvAttack",
  "VolEnvHold",
  "VolEnvDecay",
  "VolEnvSustain",
  "VolEnvRelease",
  "Key2VolEnvHold",
  "Key2VolEnvDecay",
  "Instrument",
  "Reserved1",
  "KeyRange",
  "VelRange",
  "StartLoopAddrCoarseOfs",
  "Keynum",
  "Velocity",
  "Attenuation",
  "Reserved2",
  "EndLoopAddrCoarseOfs",
  "CoarseTune",
  "FineTune",
  "SampleId",
  "SampleModes",
  "Reserved3",
  "ScaleTune",
  "ExclusiveClass",
  "OverrideRootKey",
  "Dummy",
];

function newSFZoneMap(ref, attrs) {
  var obj = {ref};
  for (let i = 0;i < 60;i++) {
    if (attributeKeys[i] == "VelRange" || attributeKeys[i] == "KeyRange") {
      obj[attributeKeys[i]] = {
        hi: (attrs[i] & 0x7f00) >> 8,
        lo: attrs[i] & 0x007f,
      };
    } else {
      obj[attributeKeys[i]] = attrs[i];
    }
  }
  obj.arr = attrs;
  return obj;
}

function s16ArrayBuffer2f32(ab) {
  const b16 = new Int16Array(ab);

  const f32 = new Float32Array(ab.byteLength / 2);
  for (let i = 0;i < b16.length;i++) {
    //} of b16){
    f32[i] = b16[i] / 0xffff;
  }
  return f32;
}

class SF2Service {
  constructor(url) {
    this.url = url;
  }
  async load({onHeader, onSample, onZone} = {}) {
    const Module = await import('./pdta-24193848.js');
    const module = await Module.default();
    const {pdtaBuffer, sdtaStart, infos} = await sfbkstream(this.url);
    const programNames = [];

    function devnull() { }
    const pdtaRef = module._malloc(pdtaBuffer.byteLength);

    module.onHeader = (pid, bid, name) => {
      programNames[pid | bid] = name;
      if (onHeader) onHeader(pid, bid, name);
    };
    module.onSample = (...args) => {
      if (onSample) onSample(args);
    };
    module.onZone = onZone || devnull;
    module.HEAPU8.set(pdtaBuffer, pdtaRef);
    const memend = module._loadpdta(pdtaRef);
    const instRef = (instid) => module._instRef(instid);
    const shdrref = module._shdrref(pdtaRef);
    const presetRefs = new Uint32Array(
      module.HEAPU32.buffer,
      module._presetRef(),
      255
    );
    const heap = module.HEAPU8.buffer.slice(0, memend);
    const heapref = new WeakRef(heap);
    this.state = {
      pdtaRef,
      heapref,
      instRef,
      presetRefs,
      heap,
      shdrref,
      programNames,
      sdtaStart,
      infos,
    };
    return this.state;
  }
  get meta() {
    return this.state.infos;
  }
  get programNames() {
    return this.state.programNames;
  }
  get presets() {
    return this.state.presetRefs;
  }
  loadProgram(pid, bkid) {
    const {presetRefs, heap, shdrref, sdtaStart, programNames, instRef} =
      this.state;
    const rootRef = presetRefs[pid | bkid];
    const gRefRoot = presetRefs[0];

    const zMap = [];
    const shdrMap = {};
    let url = this.url;
    for (
      let zref = rootRef, zone = zref2Zone(zref);
      zone && zone.SampleId != -1;
      zone = zref2Zone((zref += 120))
    ) {
      if (zone.SampleId == 0) continue;
      const mapKey = zone.SampleId;
      if (!shdrMap[mapKey]) {
        shdrMap[mapKey] = getShdr(zone.SampleId);
      }
      zMap.push({
        pid,
        bkid,
        ...zone,
        get shdr() {
          return shdrMap[zone.SampleId];
        },
        // get pcm() {
        //   return shdrMap[zone.SampleId].data();
        // },
        get instrument() {
          const instREf = instRef(zone.Instrument);
          return readASCIIHIlariously(heap, instREf);
        },
        calcPitchRatio(key, sr) {
          const rootkey =
            zone.OverrideRootKey > -1
              ? zone.OverrideRootKey
              : shdrMap[zone.SampleId].originalPitch;
          const samplePitch =
            rootkey * 100 + zone.CoarseTune * 100 + zone.FineTune * 1;
          const pitchDiff = (key * 100 - samplePitch) / 1200;
          const r =
            Math.pow(2, pitchDiff) * (shdrMap[zone.SampleId].sampleRate / sr);
          return r;
        },
      });
    }
    async function preload() {
      await Promise.all(
        Object.keys(shdrMap).map((sampleId) => shdrMap[sampleId].data())
      );
    }
    function zref2Zone(zref) {
      const zone = new Int16Array(heap, zref, 60);
      return newSFZoneMap(zref - gRefRoot, zone);
    }
    function getShdr(SampleId) {
      const hdrRef = shdrref + SampleId * 46;
      const dv = heap.slice(hdrRef, hdrRef + 46);
      const nameStr = readASCIIHIlariously(heap, hdrRef);

      const [start, end, startloop, endloop, sampleRate] = new Uint32Array(
        dv,
        20,
        5
      );
      const [originalPitch, pitchCorrection] = new Uint8Array(
        dv,
        20 + 5 * 4,
        2
      );
      const range = [sdtaStart + start * 2, sdtaStart + end * 2 + 1];
      const loops = [startloop - start, endloop - start];
      return {
        nsamples: end - start + 1,
        range,
        loops,
        SampleId,
        sampleRate,
        originalPitch,
        url,
        name: nameStr,
        data: async () => {
          if (shdrMap[SampleId].pcm) return shdrMap[SampleId].pcm;
          const res = await fetch(url, {
            headers: {
              Range: `bytes=${shdrMap[SampleId].range.join("-")}`,
            },
          });
          const ab = await res.arrayBuffer();
          shdrMap[SampleId].pcm = s16ArrayBuffer2f32(ab);
          return shdrMap[SampleId].pcm;
        },
      };
    }
    return {
      zMap,
      pid,
      bkid,
      preload,
      shdrMap,
      url: this.url,
      zref: rootRef,
      get sampleSet() {
        return new Set(zMap.map((z) => z.SampleId));
      },
      fetch_drop_ship_to(port) {
        return Promise.all(
          Array.from(new Set(zMap.map((z) => z.SampleId)))
            .map((sampleId) => this.shdrMap[sampleId])
            .map((shdr) =>
              fetch(url, {
                headers: {
                  Range: `bytes=${shdr.range.join("-")}`,
                },
              }).then((res) => {
                port.postMessage(
                  {
                    segments: shdrSegment(),
                    stream: res.body,
                  },
                  [res.body]
                );
                return res.body.closed;

                function shdrSegment() {
                  return {
                    sampleId: shdr.SampleId,
                    nSamples: (shdr.range[1] + 1 - shdr.range[0]) / 2,
                    loops: shdr.loops,
                    sampleRate: shdr.sampleRate,
                  };
                }
              })
            )
        );
      },
      get name() {
        return programNames[pid | bkid];
      },
      filterKV: function (key, vel) {
        const f = zMap.filter(
          (z) =>
            (vel == -1 || (z.VelRange.lo <= vel && z.VelRange.hi >= vel)) &&
            (key == -1 || (z.KeyRange.lo <= key && z.KeyRange.hi >= key))
        );
        return f;
      },
    };
  }
}
function readASCIIHIlariously(heap, instREf) {
  try {
    const dv = heap.slice(instREf, instREf + 20);
    const ascii = new Uint8Array(dv, 0, 20);
    let nameStr = "";
    for (const b of ascii) {
      if (!b) break;
      nameStr += String.fromCharCode(b);
    }
    return nameStr;
  } catch (e) {
    return "xxxxdasfsaf";
  }
}

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

function createChannel(uiController, channelId, sf2, apath) {
  let _sf2 = sf2;
  let program;
  const spinner = apath.spinner;

  return {
    setSF2(sf2) {
      _sf2 = sf2;
    },
    async setProgram(pid, bid) {
      this.presetId = pid | bid;
      program = _sf2.loadProgram(pid, bid);
      uiController.hidden = false;

      if (!program) {
        alert(bid + " " + pid + " no found");
        return;
      }
      await spinner.shipProgram(program, pid | bid);
      uiController.hidden = false;
      uiController.name = program.name;
      uiController.presetId = this.presetId;
    },
    setCC({ key, vel }) {
      spinner.port.postMessage([0xb0, channelId, key, vel]);
      uiController.CC = { key, value: vel };
    },
    keyOn(key, vel) {
      const zones = program.filterKV(key, vel);
      zones.slice(0, 2).map((zone, i) => {
        spinner.port.postMessage([
          midi_ch_cmds.note_on,
          channelId * 2 + i,
          zone.calcPitchRatio(key, spinner.context.sampleRate),
          vel,
          [this.presetId, zone.ref],
        ]);
        if (zone.FilterFC < 13500) {
          apath.lowPassFilter(channelId * 2 + 1, zone.FilterFc);
        }
      });
      if (!zones[0]) return;
      requestAnimationFrame(() => {
        uiController.active = true;
        uiController.velocity = vel;
        uiController.midi = key;
        uiController.zone = zones[0];
      });
      return zones[0];
    },
    keyOff(key, vel) {
      spinner.keyOff(channelId * 2 + 1, key, vel);
      spinner.keyOff(channelId * 2, key, vel);
      requestAnimationFrame(() => (uiController.active = false));
    },
  };
}

function readMidi(buffer) {
  const reader = bufferReader2(buffer);
  const {fgetc, btoa, read24, readString, read32, readVarLength, read16} =
    reader;
  [btoa(), btoa(), btoa(), btoa()].join("");
  read32();
  read16();
  const ntracks = read16();
  const division = read16();
  const tracks = [];
  const limit = buffer.byteLength;
  let lasttype;
  function readNextEvent() {
    const {fgetc, read24, readString, read32, readVarLength, read16} = reader;
    let type = fgetc();
    if (type == null) return [];
    if ((type & 0xf0) == 0xf0) {
      switch (type) {
        case 0xff: {
          const meta = fgetc();
          const len = readVarLength();
          switch (meta) {
            case 0x21:
              return {port: fgetc()};
            case 0x51:
              return {tempo: read24()};
            case 0x59:
              return {meta, payload: [fgetc(), fgetc()]};
            default:
              return {meta, payload: readString(len), len};
          }
        }
        case 0xf0:
        case 0xf7:
          return {sysex: readString(readVarLength())};
        default:
          return {type, system: readString(readVarLength())};
      }
    } else {
      let param;
      if (0 === (type & 0x80)) {
        param = type;
        type = lasttype;
      } else {
        param = fgetc();
        lasttype = type;
      }
      switch (type >> 4) {
        case 0x0c:
        case 0x0d:
          return {
            ch: type & 0x0f,
            cmd: (type >> 4).toString(16),
            channel: [type, param, 0],
          };
        default:
          return {
            ch: type & 0x0f,
            cmd: (type >> 4).toString(16),
            channel: [type, param, fgetc()],
          };
      }
    }
  }
  const presets = [];
  const tempos = [];
  while (reader.offset < limit) {
    fgetc(), fgetc(), fgetc(), fgetc();
    let t = 0;
    const mhrkLength = read32();
    const endofTrack = reader.offset + mhrkLength;
    const track = [];
    while (reader.offset < limit && reader.offset < endofTrack) {
      const delay = readVarLength();
      const nextEvent = readNextEvent();
      if (!nextEvent) break;
      if (nextEvent.eot) break;
      t += delay;
      if (nextEvent.tempo) {
        tempos.push({
          t,
          delay,
          track: track.length,
          ...nextEvent,
        });
        const evtObj = {offset: reader.offset, t, delay, ...nextEvent};
        track.push(evtObj);
      } else if (nextEvent.channel && nextEvent.channel[0] >> 4 == 0x0c) {
        presets.push({
          t,
          channel: nextEvent.channel[0] & 0x0f,
          pid: nextEvent.channel[1] & 0x7f,
        });
        const evtObj = {offset: reader.offset, t, delay, ...nextEvent};
        track.push(evtObj);
      } else {
        const evtObj = {offset: reader.offset, t, delay, ...nextEvent};
        track.push(evtObj);
      }
    }
    if (track.length) tracks.push(track);
    reader.offset = endofTrack;
  }
  return {division, tracks, ntracks, presets, tempos};
}
function bufferReader2(bytes) {
  let _offset = 0;
  const fgetc = () => bytes[_offset++];
  const read32 = () =>
    (fgetc() << 24) | (fgetc() << 16) | (fgetc() << 8) | fgetc();
  const read16 = () => (fgetc() << 8) | fgetc();
  const read24 = () => (fgetc() << 16) | (fgetc() << 8) | fgetc();
  function readVarLength() {
    let v = 0;
    let n = fgetc();
    v = n & 0x7f;
    while (n & 0x80) {
      n = fgetc();
      v = (v << 7) | (n & 0x7f);
    }
    return v;
  }
  function btoa() {
    const code = fgetc();
    return code >= 32 && code <= 122
      ? ` !"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[~]^_@abcdefghijklmnopqrstuvwxyz`.split(
        ""
      )[code - 32]
      : code;
  }
  const readString = (n) => {
    let str = "";
    while (n--) str += btoa();
    return str;
  };
  return {
    get offset() {
      return _offset;
    },
    set offset(o) {
      _offset = o;
    },
    fgetc,
    read32,
    read24,
    read16,
    readVarLength,
    readString,
    btoa,
  };
}

/* eslint-disable no-unused-vars */

async function runMidiPlayer(
  url,
  eventpipe,
  container,
  loadPresetFn
) {
  const {tempos, tracks, division, presets, ntracks, metas} = await readMidi(
    new Uint8Array(await (await fetch(url)).arrayBuffer())
  );
  await loadPresetFn(presets);
  const worker = new Worker("./src/timer.js");
  let msqn = tempos?.[0]?.tempo || 500000;
  let ppqn = division;
  // stdout("msqn" + msqn + " ppqn" + ppqn);
  worker.postMessage({tm: {msqn, ppqn}});

  const soundtracks = tracks.map((track) =>
    track.filter((event) => event.t && event.channel)
  );

  worker.onmessage = ({data}) => {
    const sysTick = data;

    for (let i = 0;i < soundtracks.length;i++) {
      const track = soundtracks[i];
      while (track.length && track[0].t <= sysTick) {
        const e = track.shift();
        if (e.meta) console.log(e.meta);
        else eventpipe.postMessage(e.channel);
      }
    }
  };
  document.querySelectorAll("#midi-player > button").forEach((b) => {
    b.addEventListener("click", (e) =>
      worker.postMessage({[e.target.dataset.cmd]: 1})
    );
    b.disabled = false;
  });
}

const sf2list = ["static/VintageDreamsWaves-v2.sf2", "static/SoundBlasterOld.sf2", "static/SalCSLight2.sf2", "static/GeneralUserGS.sf2", "static/FluidR3_GM.sf2"];

function chart(canvasCtx, dataArray) {
  resetCanvas(canvasCtx);
  const slider = canvasCtx.canvas.parentElement.querySelector(
    "input[type='range']"
  );
  slider.oninput = (e) => chart(canvasCtx, dataArray);
  const [_width, _height] = get_w_h(canvasCtx);
  let max = 0,
    x = 0;
  let iWIDTH = _width / dataArray.length; //strokeText(`r m s : ${sum / bufferLength}`, 10, 20, 100)
  for (let i = 1;i < dataArray.length;i++) {
    max = dataArray[i] > max ? dataArray[i] : max;
  }
  canvasCtx.beginPath();

  canvasCtx.lineWidth = 1;
  canvasCtx.strokeStyle = "white";
  canvasCtx.moveTo(0, _height / 2);
  const zoomY = slider.value;
  for (let i = 1;i < dataArray.length;i++) {
    x += iWIDTH;
    canvasCtx.lineTo(x, _height / 2 - zoomY * dataArray[i]);
  }
  canvasCtx.stroke();
  canvasCtx.font = "1em Arial";
}
function mkcanvas(params = {}) {
  const {width, height, container, title} = Object.assign(
    {
      container: document.body,
      title: "",
      width: 960,
      height: 320,
    },
    params
  );
  const canvas = document.createElement("canvas");
  canvas.setAttribute("width", `${width}`);
  canvas.setAttribute("height", `${height}`);
  const canvasCtx = canvas.getContext("2d");
  canvasCtx.lineWidth = 1;
  canvasCtx.strokeStyle = "white";
  canvasCtx.fillStyle = "black";
  canvasCtx.font = "2em";
  const wrap = mkdiv("div", {style: "padding:2px"}, [
    title ? mkdiv("h5", {}, title) : "",
    mkdiv("div", {class: "cp", style: "position:absolute"}, [
      "y-zoom",
      mkdiv("input", {
        type: "range",
        value: 0.5 * height,
        max: 3 * height,
        min: 0,
      }),
    ]),
    canvas,
  ]);
  container.append(wrap);
  canvas.ondblclick = () => resetCanvas(canvasCtx);
  return canvasCtx;
}
function get_w_h(canvasCtx) {
  return [
    canvasCtx.canvas.getAttribute("width")
      ? parseInt(canvasCtx.canvas.getAttribute("width"))
      : WIDTH,
    canvasCtx.canvas.getAttribute("height")
      ? parseInt(canvasCtx.canvas.getAttribute("height"))
      : HEIGHT,
  ];
}
function resetCanvas(c) {
  if (!c) return;
  const canvasCtx = c;
  const [_width, _height] = get_w_h(canvasCtx);
  canvasCtx.clearRect(0, 0, _width, _height);
  canvasCtx.fillStyle = "black";
  canvasCtx.fillRect(0, 0, _width, _height);
}

const $ = (sel) => document.querySelector(sel);

const sf2select = $("#sf2select"),
  col4 = $("#col4"),
  col5 = $("#col5");

const drumList = document.querySelector("#drums");
const programList = document.querySelector("#programs");
const navhead = document.querySelector("#navhead");

const {infoPanel, stdout} = logdiv();
infoPanel.attachTo(document.querySelector("#info"));
window.stdout = stdout;
window.stderr = (str) => (document.querySelector("footer").innerHTML = str);
// mkdiv(
//   "button",
//   {
//     onclick: (e) => {
//       main("./sf2-service/file.sf2");
//       e.target.style.display = "none";
//     },
//   },
//   "start"
// ).attachTo(document.querySelector("main"));
main("./sf2-service/file.sf2");

const appState = {};
globalThis.appState = new Proxy(appState, {
  get(target, attr) {
    return target[attr];
  },
  set(target, attr, value) {
    target[attr] = value;
    infoPanel.innerHTML = JSON.stringify(appState);
    return true;
  },
});
function updateAppState(newArr) {
  try {
    globalThis.appState = Object.assign({}, globalThis.appState, newArr);
  } catch (e) {
    console.error(e);
    console.error(newArr);
    console.error(e);
  }
}
async function main(sf2file) {
  let sf2, uiControllers, ctx;
  stdout("start");

  const channels = [];

  const midiList = await fetchmidilist();
  const midiSelect = mkdiv2({
    tag: "select",
    style: "width:300px",
    oninput: (e) => {
      e.preventDefault();
    },
    children: [
      mkdiv("option", {name: "select midi", value: null}, "select midi file"),
      ...midiList.map((f) =>
        mkdiv("option", {value: f.get("Url")}, f.get("Name").substring(0, 80))
      ),
    ],
  });
  midiSelect.attachTo($("footer"));
  midiSelect.addEventListener("input", (e) => onMidiSelect(e.target.value));

  for (const f of sf2list) sf2select.append(mkdiv("option", {value: f}, f));

  sf2select.onchange = (e) => {
    loadSF2File(e.target.value);
  };
  const {mkpath} = await import('./mkpath-ee34b563.js');

  ctx = new AudioContext();
  const apath = await mkpath(ctx);
  const spinner = apath.spinner;
  sf2select.value = sf2file;

  const eventPipe = mkeventsPipe();
  const ui = mkui(eventPipe, $("#channelContainer"), {
    onTrackDoubleClick: async (channelId, e) => {
      const sp1 = await apath.querySpState({query: 2 * channelId});
      globalThis.stderr(JSON.stringify(sp1, null, 1));
    },
    onEditZone: (editData) => {
      spinner.port.postMessage(editData);
      return apath.subscribeNextMsg((data) => {
        console.log(data);
        return data.zack == "update" && data.ref == editData.update[1];
      });
    },
  });
  uiControllers = ui.controllers;
  for (let i = 0; i < 16; i++) {
    uiControllers[i].hidden = true;

    channels.push(createChannel(uiControllers[i], i, sf2, apath));
  }

  //link pipes

  eventPipe.onmessage(eventsHandler(channels));
  initNavigatorMidiAccess();
  async function initNavigatorMidiAccess() {
    let midiAccess = await navigator.requestMIDIAccess();
    if (!midiAccess) {
      // eslint-disable-next-line no-unused-vars
      midiAccess = await new Promise((resolve, reject) => {
        mkdiv(
          "button",
          {
            onclick: async (e) => {
              e.target.parentElement.removeChild(e.target);
              resolve(await navigator.requestMIDIAccess());
            },
          },
          "link midi"
        ).attachTo(navhead);
      });
    }
    if (midiAccess) {
      const misel = mkdiv(
        "select",
        {
          oninput: (e) => {
            Array.from(midiAccess.inputs.values()).find(
              (i) => i.name === e.target.value
            ).onmidimessage = ({data}) => eventPipe.postMessage(data);
          },
        },
        [
          mkdiv("option", {value: null}, "select input"),
          ...Array.from(midiAccess.inputs.values()).map((input) =>
            mkdiv(
              "option",
              {
                value: input.name,
                text: input.name,
              },
              input.name
            )
          ),
        ]
      ); misel.attachTo(navhead);
      Array.from(midiAccess.inputs.values()).forEach(e => {
        e.onmidimessage = e => eventPipe.postMessage(e.data);
      });
    }
  }
  ctx.onstatechange = () => updateAppState({audioStatus: ctx.state});

  window.addEventListener(
    "click",
    async () => ctx.state !== "running" && (await ctx.resume()),
    {once: true}
  );

  const ampIndictators = document.querySelectorAll(".amp-indicate");
  spinner.port.onmessage = ({data}) => {
    if (data.spState) col5.innerHTML = JSON.stringify(data.spState);
    if (data.egStages) col4.innerHTML = Object.values(data.egStages).join(" ");
    if (data.queryResponse)
      window.stderr(JSON.stringify(data.queryResponse, null, 1));
    if (data.sp_reflect) {
      for (let i = 0;i < 16;i++) {
        ampIndictators[i].style.setProperty(
          "--db",
          (data.sp_reflect[2 * i * 4] + 960) / 960
        );
      }

      window.stderr(Object.values(data.sp_reflect).join("\n"));
    }
  };
  apath.bindKeyboard(() => ui.activeChannel, eventPipe);
  async function loadSF2File(sf2url) {
    sf2 = new SF2Service(sf2url);
    await sf2.load();
    programList.innerHTML = "";
    drumList.innerHTML = "";
    sf2.programNames.forEach((n, presetIdx) => {
      if (presetIdx < 128) {
        mkdiv2({tag: "option", value: n, children: n}).attachTo(programList);
      } else {
        mkdiv2({tag: "option", value: n, children: n}).attachTo(drumList);
      }
    });
    channels.forEach((c, i) => {
      c.setSF2(sf2);
      if (i != 9) {
        c.setProgram(i << 3, 0);
      } else {
        c.setProgram(0, 128);
      }
    });
    for (const [section, text] of sf2.meta) {
      stdout(section + ": " + text);
    }
  }
  function onMidiSelect(url) {
    runMidiPlayer(url, eventPipe, $("#midiPlayer"), async function (presets) {
      for (const preset of presets) {
        const {pid, channel} = preset;
        const bkid = channel == 10 ? 128 : 0;
        await channels[channel].setProgram(pid, bkid);
      }
    });
  }
  apath.ctrl_bar(document.getElementById("ctrls"));
  apath.bindToolbar();
  await loadSF2File("sf2-service/file.sf2");
  const cv = mkcanvas({container: $("#stdout")});
  const wvform = mkcanvas({container: $("#stdout")});

  function draw() {
    chart(cv, apath.analysis.frequencyBins);
    chart(wvform, apath.analysis.waveForm);
    requestAnimationFrame(draw);
  }
  draw();
}

function eventsHandler(channels) {
  return function (data) {
    stdout(data);
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
        stdout([cmd, ch, key, velocity, "off"].join("|"));

        break;
      case midi_ch_cmds.note_on:
        if (velocity == 0) {
          stdout([cmd.toString(), ch, key, velocity, "off"].join("/"));
          channels[ch].keyOff(key, velocity);
        } else {
          stdout([cmd, ch, key, velocity].join("/"));
          channels[ch].keyOn(key, velocity);
          //requestAnimationFrame(() => renderZ(panel2, canvas1, zone));
        }
        break;
      default:
        stdout("midi cmd: " + [ch, cmd, b, c].join("/"));
        break;
    }
  };
}

export {mkdiv as m};

import {m as mkdiv} from './index.js';

let k;

class SpinNode extends AudioWorkletNode {
  static async init(ctx) {
    await ctx.audioWorklet.addModule("spin/spin-proc.js");
  }
  static alloc(ctx) {
    if (!k) k = new SpinNode(ctx);
    return k;
  }
  constructor(ctx) {
    super(ctx, "spin-proc", {
      numberOfInputs: 0,
      numberOfOutputs: 16,
      outputChannelCount: new Array(16).fill(4),
    });
    this.port.onmessageerror = (e) => alert("adfasfd", e.message); // e; // e.message;
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
    await sf2program.fetch_drop_ship_to(this.port);
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

// @ts-ignore 
// @prettier-ignore 
const wasmbin$2 = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 35, 6, 96, 1, 125, 1, 125, 96, 0, 0, 96, 1, 127, 1, 125, 96, 2, 125, 127, 1, 125, 96, 2, 127, 125, 1, 127, 96, 5, 127, 125, 125, 125, 125, 1, 127, 2, 35, 3, 3, 101, 110, 118, 4, 115, 105, 110, 102, 0, 0, 3, 101, 110, 118, 4, 99, 111, 115, 102, 0, 0, 3, 101, 110, 118, 5, 115, 105, 110, 104, 102, 0, 0, 3, 7, 6, 1, 2, 2, 3, 4, 5, 5, 3, 1, 0, 2, 6, 75, 12, 127, 1, 65, 128, 174, 4, 11, 127, 0, 65, 128, 8, 11, 127, 0, 65, 208, 45, 11, 127, 0, 65, 128, 8, 11, 127, 0, 65, 244, 45, 11, 127, 0, 65, 128, 46, 11, 127, 0, 65, 128, 174, 4, 11, 127, 0, 65, 128, 8, 11, 127, 0, 65, 128, 174, 4, 11, 127, 0, 65, 128, 128, 8, 11, 127, 0, 65, 0, 11, 127, 0, 65, 1, 11, 7, 232, 1, 18, 6, 109, 101, 109, 111, 114, 121, 2, 0, 17, 95, 95, 119, 97, 115, 109, 95, 99, 97, 108, 108, 95, 99, 116, 111, 114, 115, 0, 3, 5, 99, 116, 50, 104, 122, 0, 4, 10, 112, 50, 111, 118, 101, 114, 49, 50, 48, 48, 3, 1, 9, 103, 101, 116, 95, 111, 109, 101, 103, 97, 0, 5, 6, 66, 105, 81, 117, 97, 100, 0, 6, 6, 115, 101, 116, 76, 80, 70, 0, 7, 4, 108, 112, 102, 115, 3, 2, 10, 66, 105, 81, 117, 97, 100, 95, 110, 101, 119, 0, 8, 12, 95, 95, 100, 115, 111, 95, 104, 97, 110, 100, 108, 101, 3, 3, 10, 95, 95, 100, 97, 116, 97, 95, 101, 110, 100, 3, 4, 11, 95, 95, 115, 116, 97, 99, 107, 95, 108, 111, 119, 3, 5, 12, 95, 95, 115, 116, 97, 99, 107, 95, 104, 105, 103, 104, 3, 6, 13, 95, 95, 103, 108, 111, 98, 97, 108, 95, 98, 97, 115, 101, 3, 7, 11, 95, 95, 104, 101, 97, 112, 95, 98, 97, 115, 101, 3, 8, 10, 95, 95, 104, 101, 97, 112, 95, 101, 110, 100, 3, 9, 13, 95, 95, 109, 101, 109, 111, 114, 121, 95, 98, 97, 115, 101, 3, 10, 12, 95, 95, 116, 97, 98, 108, 101, 95, 98, 97, 115, 101, 3, 11, 10, 215, 20, 6, 2, 0, 11, 207, 3, 7, 22, 127, 3, 125, 19, 127, 3, 125, 8, 127, 4, 125, 2, 127, 35, 128, 128, 128, 128, 0, 33, 1, 65, 16, 33, 2, 32, 1, 32, 2, 107, 33, 3, 32, 3, 36, 128, 128, 128, 128, 0, 32, 3, 32, 0, 59, 1, 10, 32, 3, 47, 1, 10, 33, 4, 65, 16, 33, 5, 32, 4, 32, 5, 116, 33, 6, 32, 6, 32, 5, 117, 33, 7, 65, 0, 33, 8, 32, 7, 33, 9, 32, 8, 33, 10, 32, 9, 32, 10, 72, 33, 11, 65, 1, 33, 12, 32, 11, 32, 12, 113, 33, 13, 2, 64, 2, 64, 32, 13, 69, 13, 0, 32, 3, 47, 1, 10, 33, 14, 65, 16, 33, 15, 32, 14, 32, 15, 116, 33, 16, 32, 16, 32, 15, 117, 33, 17, 65, 127, 33, 18, 32, 17, 32, 18, 108, 33, 19, 65, 16, 33, 20, 32, 19, 32, 20, 116, 33, 21, 32, 21, 32, 20, 117, 33, 22, 32, 22, 16, 132, 128, 128, 128, 0, 33, 23, 67, 0, 0, 128, 63, 33, 24, 32, 24, 32, 23, 149, 33, 25, 32, 3, 32, 25, 56, 2, 12, 12, 1, 11, 32, 3, 47, 1, 10, 33, 26, 65, 16, 33, 27, 32, 26, 32, 27, 116, 33, 28, 32, 28, 32, 27, 117, 33, 29, 65, 176, 9, 33, 30, 32, 29, 33, 31, 32, 30, 33, 32, 32, 31, 32, 32, 74, 33, 33, 65, 1, 33, 34, 32, 33, 32, 34, 113, 33, 35, 2, 64, 32, 35, 69, 13, 0, 32, 3, 47, 1, 10, 33, 36, 65, 16, 33, 37, 32, 36, 32, 37, 116, 33, 38, 32, 38, 32, 37, 117, 33, 39, 65, 176, 9, 33, 40, 32, 39, 32, 40, 107, 33, 41, 65, 16, 33, 42, 32, 41, 32, 42, 116, 33, 43, 32, 43, 32, 42, 117, 33, 44, 32, 44, 16, 132, 128, 128, 128, 0, 33, 45, 67, 0, 0, 0, 64, 33, 46, 32, 46, 32, 45, 148, 33, 47, 32, 3, 32, 47, 56, 2, 12, 12, 1, 11, 32, 3, 47, 1, 10, 33, 48, 65, 16, 33, 49, 32, 48, 32, 49, 116, 33, 50, 32, 50, 32, 49, 117, 33, 51, 65, 128, 136, 128, 128, 0, 33, 52, 65, 2, 33, 53, 32, 51, 32, 53, 116, 33, 54, 32, 52, 32, 54, 106, 33, 55, 32, 55, 42, 2, 0, 33, 56, 67, 229, 208, 2, 65, 33, 57, 32, 56, 32, 57, 148, 33, 58, 32, 3, 32, 58, 56, 2, 12, 11, 32, 3, 42, 2, 12, 33, 59, 65, 16, 33, 60, 32, 3, 32, 60, 106, 33, 61, 32, 61, 36, 128, 128, 128, 128, 0, 32, 59, 15, 11, 131, 1, 5, 4, 127, 1, 125, 5, 124, 1, 125, 2, 127, 35, 128, 128, 128, 128, 0, 33, 1, 65, 16, 33, 2, 32, 1, 32, 2, 107, 33, 3, 32, 3, 36, 128, 128, 128, 128, 0, 32, 3, 32, 0, 54, 2, 12, 32, 3, 46, 1, 12, 33, 4, 32, 4, 16, 132, 128, 128, 128, 0, 33, 5, 32, 5, 187, 33, 6, 68, 24, 45, 68, 84, 251, 33, 25, 64, 33, 7, 32, 6, 32, 7, 162, 33, 8, 68, 0, 0, 0, 0, 0, 112, 231, 64, 33, 9, 32, 8, 32, 9, 163, 33, 10, 32, 10, 182, 33, 11, 65, 16, 33, 12, 32, 3, 32, 12, 106, 33, 13, 32, 13, 36, 128, 128, 128, 128, 0, 32, 11, 15, 11, 156, 3, 28, 4, 127, 2, 125, 1, 127, 1, 125, 1, 127, 4, 125, 1, 127, 1, 125, 1, 127, 3, 125, 1, 127, 1, 125, 1, 127, 4, 125, 1, 127, 1, 125, 1, 127, 4, 125, 1, 127, 1, 125, 1, 127, 1, 125, 2, 127, 1, 125, 1, 127, 1, 125, 1, 127, 1, 125, 35, 128, 128, 128, 128, 0, 33, 2, 65, 16, 33, 3, 32, 2, 32, 3, 107, 33, 4, 32, 4, 32, 0, 56, 2, 12, 32, 4, 32, 1, 54, 2, 8, 32, 4, 40, 2, 8, 33, 5, 32, 5, 42, 2, 0, 33, 6, 32, 4, 42, 2, 12, 33, 7, 32, 4, 40, 2, 8, 33, 8, 32, 8, 42, 2, 4, 33, 9, 32, 4, 40, 2, 8, 33, 10, 32, 10, 42, 2, 20, 33, 11, 32, 9, 32, 11, 148, 33, 12, 32, 6, 32, 7, 148, 33, 13, 32, 13, 32, 12, 146, 33, 14, 32, 4, 40, 2, 8, 33, 15, 32, 15, 42, 2, 8, 33, 16, 32, 4, 40, 2, 8, 33, 17, 32, 17, 42, 2, 24, 33, 18, 32, 16, 32, 18, 148, 33, 19, 32, 19, 32, 14, 146, 33, 20, 32, 4, 40, 2, 8, 33, 21, 32, 21, 42, 2, 12, 33, 22, 32, 4, 40, 2, 8, 33, 23, 32, 23, 42, 2, 28, 33, 24, 32, 22, 140, 33, 25, 32, 25, 32, 24, 148, 33, 26, 32, 26, 32, 20, 146, 33, 27, 32, 4, 40, 2, 8, 33, 28, 32, 28, 42, 2, 16, 33, 29, 32, 4, 40, 2, 8, 33, 30, 32, 30, 42, 2, 32, 33, 31, 32, 29, 140, 33, 32, 32, 32, 32, 31, 148, 33, 33, 32, 33, 32, 27, 146, 33, 34, 32, 4, 32, 34, 56, 2, 4, 32, 4, 40, 2, 8, 33, 35, 32, 35, 42, 2, 20, 33, 36, 32, 4, 40, 2, 8, 33, 37, 32, 37, 32, 36, 56, 2, 24, 32, 4, 42, 2, 12, 33, 38, 32, 4, 40, 2, 8, 33, 39, 32, 39, 32, 38, 56, 2, 20, 32, 4, 40, 2, 8, 33, 40, 32, 40, 42, 2, 28, 33, 41, 32, 4, 40, 2, 8, 33, 42, 32, 42, 32, 41, 56, 2, 32, 32, 4, 42, 2, 4, 33, 43, 32, 4, 40, 2, 8, 33, 44, 32, 44, 32, 43, 56, 2, 28, 32, 4, 42, 2, 4, 33, 45, 32, 45, 15, 11, 131, 6, 25, 4, 127, 1, 125, 1, 127, 6, 125, 3, 124, 1, 125, 4, 124, 28, 125, 1, 127, 3, 125, 1, 127, 3, 125, 1, 127, 3, 125, 1, 127, 3, 125, 3, 127, 1, 125, 2, 127, 1, 125, 2, 127, 1, 125, 2, 127, 1, 125, 3, 127, 35, 128, 128, 128, 128, 0, 33, 2, 65, 192, 0, 33, 3, 32, 2, 32, 3, 107, 33, 4, 32, 4, 36, 128, 128, 128, 128, 0, 32, 4, 32, 0, 59, 1, 62, 32, 4, 32, 1, 56, 2, 56, 32, 4, 46, 1, 62, 33, 5, 32, 5, 16, 133, 128, 128, 128, 0, 33, 6, 32, 4, 32, 6, 56, 2, 52, 65, 208, 173, 128, 128, 0, 33, 7, 32, 4, 32, 7, 54, 2, 48, 32, 4, 42, 2, 52, 33, 8, 32, 8, 16, 128, 128, 128, 128, 0, 33, 9, 32, 4, 32, 9, 56, 2, 16, 32, 4, 42, 2, 52, 33, 10, 32, 10, 16, 129, 128, 128, 128, 0, 33, 11, 32, 4, 32, 11, 56, 2, 12, 32, 4, 42, 2, 16, 33, 12, 32, 4, 42, 2, 56, 33, 13, 32, 13, 187, 33, 14, 68, 239, 57, 250, 254, 66, 46, 214, 63, 33, 15, 32, 14, 32, 15, 162, 33, 16, 32, 4, 42, 2, 52, 33, 17, 32, 17, 187, 33, 18, 32, 16, 32, 18, 162, 33, 19, 32, 12, 187, 33, 20, 32, 19, 32, 20, 163, 33, 21, 32, 21, 182, 33, 22, 32, 22, 16, 130, 128, 128, 128, 0, 33, 23, 32, 12, 32, 23, 148, 33, 24, 32, 4, 32, 24, 56, 2, 8, 32, 4, 42, 2, 12, 33, 25, 67, 0, 0, 128, 63, 33, 26, 32, 26, 32, 25, 147, 33, 27, 67, 0, 0, 0, 64, 33, 28, 32, 27, 32, 28, 149, 33, 29, 32, 4, 32, 29, 56, 2, 32, 32, 4, 42, 2, 12, 33, 30, 67, 0, 0, 128, 63, 33, 31, 32, 31, 32, 30, 147, 33, 32, 32, 4, 32, 32, 56, 2, 28, 32, 4, 42, 2, 12, 33, 33, 67, 0, 0, 128, 63, 33, 34, 32, 34, 32, 33, 147, 33, 35, 67, 0, 0, 0, 64, 33, 36, 32, 35, 32, 36, 149, 33, 37, 32, 4, 32, 37, 56, 2, 24, 32, 4, 42, 2, 8, 33, 38, 67, 0, 0, 128, 63, 33, 39, 32, 39, 32, 38, 146, 33, 40, 32, 4, 32, 40, 56, 2, 44, 32, 4, 42, 2, 12, 33, 41, 67, 0, 0, 0, 192, 33, 42, 32, 42, 32, 41, 148, 33, 43, 32, 4, 32, 43, 56, 2, 40, 32, 4, 42, 2, 8, 33, 44, 67, 0, 0, 128, 63, 33, 45, 32, 45, 32, 44, 147, 33, 46, 32, 4, 32, 46, 56, 2, 36, 32, 4, 42, 2, 32, 33, 47, 32, 4, 42, 2, 44, 33, 48, 32, 47, 32, 48, 149, 33, 49, 32, 4, 40, 2, 48, 33, 50, 32, 50, 32, 49, 56, 2, 0, 32, 4, 42, 2, 28, 33, 51, 32, 4, 42, 2, 44, 33, 52, 32, 51, 32, 52, 149, 33, 53, 32, 4, 40, 2, 48, 33, 54, 32, 54, 32, 53, 56, 2, 4, 32, 4, 42, 2, 24, 33, 55, 32, 4, 42, 2, 44, 33, 56, 32, 55, 32, 56, 149, 33, 57, 32, 4, 40, 2, 48, 33, 58, 32, 58, 32, 57, 56, 2, 8, 32, 4, 42, 2, 40, 33, 59, 32, 4, 42, 2, 44, 33, 60, 32, 59, 32, 60, 149, 33, 61, 32, 4, 40, 2, 48, 33, 62, 32, 62, 32, 61, 56, 2, 12, 32, 4, 42, 2, 36, 33, 63, 32, 4, 42, 2, 44, 33, 64, 32, 63, 32, 64, 149, 33, 65, 32, 4, 40, 2, 48, 33, 66, 32, 66, 32, 65, 56, 2, 16, 32, 4, 40, 2, 48, 33, 67, 65, 0, 33, 68, 32, 68, 178, 33, 69, 32, 67, 32, 69, 56, 2, 24, 32, 4, 40, 2, 48, 33, 70, 65, 0, 33, 71, 32, 71, 178, 33, 72, 32, 70, 32, 72, 56, 2, 20, 32, 4, 40, 2, 48, 33, 73, 65, 0, 33, 74, 32, 74, 178, 33, 75, 32, 73, 32, 75, 56, 2, 32, 32, 4, 40, 2, 48, 33, 76, 65, 0, 33, 77, 32, 77, 178, 33, 78, 32, 76, 32, 78, 56, 2, 28, 32, 4, 40, 2, 48, 33, 79, 65, 192, 0, 33, 80, 32, 4, 32, 80, 106, 33, 81, 32, 81, 36, 128, 128, 128, 128, 0, 32, 79, 15, 11, 216, 6, 29, 4, 127, 1, 125, 3, 124, 1, 125, 2, 124, 7, 125, 3, 124, 1, 125, 4, 124, 3, 125, 1, 127, 25, 125, 1, 127, 3, 125, 1, 127, 3, 125, 1, 127, 3, 125, 1, 127, 3, 125, 3, 127, 1, 125, 2, 127, 1, 125, 2, 127, 1, 125, 2, 127, 1, 125, 3, 127, 35, 128, 128, 128, 128, 0, 33, 5, 65, 208, 0, 33, 6, 32, 5, 32, 6, 107, 33, 7, 32, 7, 36, 128, 128, 128, 128, 0, 32, 7, 32, 0, 54, 2, 76, 32, 7, 32, 1, 56, 2, 72, 32, 7, 32, 2, 56, 2, 68, 32, 7, 32, 3, 56, 2, 64, 32, 7, 32, 4, 56, 2, 60, 65, 208, 173, 128, 128, 0, 33, 8, 32, 7, 32, 8, 54, 2, 56, 32, 7, 42, 2, 68, 33, 9, 32, 9, 187, 33, 10, 68, 24, 45, 68, 84, 251, 33, 25, 64, 33, 11, 32, 10, 32, 11, 162, 33, 12, 32, 7, 42, 2, 64, 33, 13, 32, 13, 187, 33, 14, 32, 12, 32, 14, 163, 33, 15, 32, 15, 182, 33, 16, 32, 7, 32, 16, 56, 2, 48, 32, 7, 42, 2, 48, 33, 17, 32, 17, 16, 128, 128, 128, 128, 0, 33, 18, 32, 7, 32, 18, 56, 2, 44, 32, 7, 42, 2, 48, 33, 19, 32, 19, 16, 129, 128, 128, 128, 0, 33, 20, 32, 7, 32, 20, 56, 2, 40, 32, 7, 42, 2, 44, 33, 21, 32, 7, 42, 2, 60, 33, 22, 32, 22, 187, 33, 23, 68, 239, 57, 250, 254, 66, 46, 214, 63, 33, 24, 32, 23, 32, 24, 162, 33, 25, 32, 7, 42, 2, 48, 33, 26, 32, 26, 187, 33, 27, 32, 25, 32, 27, 162, 33, 28, 32, 21, 187, 33, 29, 32, 28, 32, 29, 163, 33, 30, 32, 30, 182, 33, 31, 32, 31, 16, 130, 128, 128, 128, 0, 33, 32, 32, 21, 32, 32, 148, 33, 33, 32, 7, 32, 33, 56, 2, 36, 32, 7, 40, 2, 76, 33, 34, 2, 64, 2, 64, 32, 34, 13, 0, 32, 7, 42, 2, 40, 33, 35, 67, 0, 0, 128, 63, 33, 36, 32, 36, 32, 35, 147, 33, 37, 67, 0, 0, 0, 64, 33, 38, 32, 37, 32, 38, 149, 33, 39, 32, 7, 32, 39, 56, 2, 16, 32, 7, 42, 2, 40, 33, 40, 67, 0, 0, 128, 63, 33, 41, 32, 41, 32, 40, 147, 33, 42, 32, 7, 32, 42, 56, 2, 12, 32, 7, 42, 2, 40, 33, 43, 67, 0, 0, 128, 63, 33, 44, 32, 44, 32, 43, 147, 33, 45, 67, 0, 0, 0, 64, 33, 46, 32, 45, 32, 46, 149, 33, 47, 32, 7, 32, 47, 56, 2, 8, 32, 7, 42, 2, 36, 33, 48, 67, 0, 0, 128, 63, 33, 49, 32, 49, 32, 48, 146, 33, 50, 32, 7, 32, 50, 56, 2, 28, 32, 7, 42, 2, 40, 33, 51, 67, 0, 0, 0, 192, 33, 52, 32, 52, 32, 51, 148, 33, 53, 32, 7, 32, 53, 56, 2, 24, 32, 7, 42, 2, 36, 33, 54, 67, 0, 0, 128, 63, 33, 55, 32, 55, 32, 54, 147, 33, 56, 32, 7, 32, 56, 56, 2, 20, 12, 1, 11, 11, 32, 7, 42, 2, 16, 33, 57, 32, 7, 42, 2, 28, 33, 58, 32, 57, 32, 58, 149, 33, 59, 32, 7, 40, 2, 56, 33, 60, 32, 60, 32, 59, 56, 2, 0, 32, 7, 42, 2, 12, 33, 61, 32, 7, 42, 2, 28, 33, 62, 32, 61, 32, 62, 149, 33, 63, 32, 7, 40, 2, 56, 33, 64, 32, 64, 32, 63, 56, 2, 4, 32, 7, 42, 2, 8, 33, 65, 32, 7, 42, 2, 28, 33, 66, 32, 65, 32, 66, 149, 33, 67, 32, 7, 40, 2, 56, 33, 68, 32, 68, 32, 67, 56, 2, 8, 32, 7, 42, 2, 24, 33, 69, 32, 7, 42, 2, 28, 33, 70, 32, 69, 32, 70, 149, 33, 71, 32, 7, 40, 2, 56, 33, 72, 32, 72, 32, 71, 56, 2, 12, 32, 7, 42, 2, 20, 33, 73, 32, 7, 42, 2, 28, 33, 74, 32, 73, 32, 74, 149, 33, 75, 32, 7, 40, 2, 56, 33, 76, 32, 76, 32, 75, 56, 2, 16, 32, 7, 40, 2, 56, 33, 77, 65, 0, 33, 78, 32, 78, 178, 33, 79, 32, 77, 32, 79, 56, 2, 24, 32, 7, 40, 2, 56, 33, 80, 65, 0, 33, 81, 32, 81, 178, 33, 82, 32, 80, 32, 82, 56, 2, 20, 32, 7, 40, 2, 56, 33, 83, 65, 0, 33, 84, 32, 84, 178, 33, 85, 32, 83, 32, 85, 56, 2, 32, 32, 7, 40, 2, 56, 33, 86, 65, 0, 33, 87, 32, 87, 178, 33, 88, 32, 86, 32, 88, 56, 2, 28, 32, 7, 40, 2, 56, 33, 89, 65, 208, 0, 33, 90, 32, 7, 32, 90, 106, 33, 91, 32, 91, 36, 128, 128, 128, 128, 0, 32, 89, 15, 11, 11, 204, 37, 1, 0, 65, 128, 8, 11, 196, 37, 0, 0, 128, 63, 241, 18, 128, 63, 225, 37, 128, 63, 210, 56, 128, 63, 203, 75, 128, 63, 196, 94, 128, 63, 197, 113, 128, 63, 199, 132, 128, 63, 200, 151, 128, 63, 201, 170, 128, 63, 211, 189, 128, 63, 221, 208, 128, 63, 239, 227, 128, 63, 249, 246, 128, 63, 11, 10, 129, 63, 38, 29, 129, 63, 64, 48, 129, 63, 91, 67, 129, 63, 117, 86, 129, 63, 152, 105, 129, 63, 187, 124, 129, 63, 231, 143, 129, 63, 18, 163, 129, 63, 61, 182, 129, 63, 113, 201, 129, 63, 156, 220, 129, 63, 208, 239, 129, 63, 12, 3, 130, 63, 72, 22, 130, 63, 132, 41, 130, 63, 201, 60, 130, 63, 13, 80, 130, 63, 82, 99, 130, 63, 150, 118, 130, 63, 227, 137, 130, 63, 57, 157, 130, 63, 133, 176, 130, 63, 219, 195, 130, 63, 48, 215, 130, 63, 142, 234, 130, 63, 235, 253, 130, 63, 73, 17, 131, 63, 175, 36, 131, 63, 21, 56, 131, 63, 123, 75, 131, 63, 234, 94, 131, 63, 88, 114, 131, 63, 198, 133, 131, 63, 61, 153, 131, 63, 180, 172, 131, 63, 43, 192, 131, 63, 170, 211, 131, 63, 41, 231, 131, 63, 169, 250, 131, 63, 48, 14, 132, 63, 184, 33, 132, 63, 72, 53, 132, 63, 216, 72, 132, 63, 104, 92, 132, 63, 248, 111, 132, 63, 144, 131, 132, 63, 41, 151, 132, 63, 201, 170, 132, 63, 98, 190, 132, 63, 11, 210, 132, 63, 172, 229, 132, 63, 85, 249, 132, 63, 254, 12, 133, 63, 176, 32, 133, 63, 97, 52, 133, 63, 19, 72, 133, 63, 205, 91, 133, 63, 135, 111, 133, 63, 65, 131, 133, 63, 3, 151, 133, 63, 197, 170, 133, 63, 136, 190, 133, 63, 82, 210, 133, 63, 29, 230, 133, 63, 232, 249, 133, 63, 187, 13, 134, 63, 142, 33, 134, 63, 105, 53, 134, 63, 69, 73, 134, 63, 32, 93, 134, 63, 252, 112, 134, 63, 224, 132, 134, 63, 196, 152, 134, 63, 176, 172, 134, 63, 156, 192, 134, 63, 137, 212, 134, 63, 125, 232, 134, 63, 114, 252, 134, 63, 102, 16, 135, 63, 100, 36, 135, 63, 97, 56, 135, 63, 94, 76, 135, 63, 99, 96, 135, 63, 105, 116, 135, 63, 110, 136, 135, 63, 124, 156, 135, 63, 138, 176, 135, 63, 160, 196, 135, 63, 182, 216, 135, 63, 204, 236, 135, 63, 226, 0, 136, 63, 1, 21, 136, 63, 40, 41, 136, 63, 71, 61, 136, 63, 110, 81, 136, 63, 157, 101, 136, 63, 196, 121, 136, 63, 243, 141, 136, 63, 43, 162, 136, 63, 91, 182, 136, 63, 155, 202, 136, 63, 211, 222, 136, 63, 19, 243, 136, 63, 83, 7, 137, 63, 155, 27, 137, 63, 220, 47, 137, 63, 44, 68, 137, 63, 117, 88, 137, 63, 198, 108, 137, 63, 31, 129, 137, 63, 112, 149, 137, 63, 202, 169, 137, 63, 43, 190, 137, 63, 141, 210, 137, 63, 239, 230, 137, 63, 80, 251, 137, 63, 187, 15, 138, 63, 37, 36, 138, 63, 151, 56, 138, 63, 10, 77, 138, 63, 124, 97, 138, 63, 247, 117, 138, 63, 114, 138, 138, 63, 237, 158, 138, 63, 112, 179, 138, 63, 243, 199, 138, 63, 119, 220, 138, 63, 2, 241, 138, 63, 142, 5, 139, 63, 34, 26, 139, 63, 182, 46, 139, 63, 74, 67, 139, 63, 230, 87, 139, 63, 131, 108, 139, 63, 31, 129, 139, 63, 196, 149, 139, 63, 105, 170, 139, 63, 14, 191, 139, 63, 187, 211, 139, 63, 104, 232, 139, 63, 30, 253, 139, 63, 211, 17, 140, 63, 137, 38, 140, 63, 71, 59, 140, 63, 5, 80, 140, 63, 195, 100, 140, 63, 137, 121, 140, 63, 80, 142, 140, 63, 22, 163, 140, 63, 229, 183, 140, 63, 180, 204, 140, 63, 139, 225, 140, 63, 98, 246, 140, 63, 57, 11, 141, 63, 25, 32, 141, 63, 248, 52, 141, 63, 216, 73, 141, 63, 192, 94, 141, 63, 168, 115, 141, 63, 152, 136, 141, 63, 128, 157, 141, 63, 121, 178, 141, 63, 105, 199, 141, 63, 98, 220, 141, 63, 99, 241, 141, 63, 91, 6, 142, 63, 101, 27, 142, 63, 102, 48, 142, 63, 111, 69, 142, 63, 121, 90, 142, 63, 139, 111, 142, 63, 157, 132, 142, 63, 175, 153, 142, 63, 201, 174, 142, 63, 227, 195, 142, 63, 253, 216, 142, 63, 32, 238, 142, 63, 67, 3, 143, 63, 110, 24, 143, 63, 153, 45, 143, 63, 196, 66, 143, 63, 247, 87, 143, 63, 43, 109, 143, 63, 94, 130, 143, 63, 154, 151, 143, 63, 214, 172, 143, 63, 26, 194, 143, 63, 94, 215, 143, 63, 162, 236, 143, 63, 239, 1, 144, 63, 60, 23, 144, 63, 136, 44, 144, 63, 221, 65, 144, 63, 50, 87, 144, 63, 135, 108, 144, 63, 228, 129, 144, 63, 74, 151, 144, 63, 168, 172, 144, 63, 13, 194, 144, 63, 123, 215, 144, 63, 234, 236, 144, 63, 88, 2, 145, 63, 198, 23, 145, 63, 60, 45, 145, 63, 187, 66, 145, 63, 50, 88, 145, 63, 177, 109, 145, 63, 56, 131, 145, 63, 191, 152, 145, 63, 71, 174, 145, 63, 215, 195, 145, 63, 102, 217, 145, 63, 246, 238, 145, 63, 142, 4, 146, 63, 38, 26, 146, 63, 190, 47, 146, 63, 95, 69, 146, 63, 255, 90, 146, 63, 168, 112, 146, 63, 81, 134, 146, 63, 2, 156, 146, 63, 171, 177, 146, 63, 101, 199, 146, 63, 22, 221, 146, 63, 208, 242, 146, 63, 137, 8, 147, 63, 75, 30, 147, 63, 13, 52, 147, 63, 216, 73, 147, 63, 162, 95, 147, 63, 109, 117, 147, 63, 55, 139, 147, 63, 10, 161, 147, 63, 229, 182, 147, 63, 184, 204, 147, 63, 155, 226, 147, 63, 119, 248, 147, 63, 90, 14, 148, 63, 70, 36, 148, 63, 42, 58, 148, 63, 22, 80, 148, 63, 10, 102, 148, 63, 254, 123, 148, 63, 243, 145, 148, 63, 240, 167, 148, 63, 236, 189, 148, 63, 233, 211, 148, 63, 238, 233, 148, 63, 243, 255, 148, 63, 1, 22, 149, 63, 14, 44, 149, 63, 28, 66, 149, 63, 50, 88, 149, 63, 72, 110, 149, 63, 94, 132, 149, 63, 124, 154, 149, 63, 163, 176, 149, 63, 193, 198, 149, 63, 232, 220, 149, 63, 23, 243, 149, 63, 70, 9, 150, 63, 117, 31, 150, 63, 173, 53, 150, 63, 228, 75, 150, 63, 27, 98, 150, 63, 91, 120, 150, 63, 155, 142, 150, 63, 227, 164, 150, 63, 44, 187, 150, 63, 116, 209, 150, 63, 197, 231, 150, 63, 21, 254, 150, 63, 110, 20, 151, 63, 199, 42, 151, 63, 32, 65, 151, 63, 130, 87, 151, 63, 227, 109, 151, 63, 77, 132, 151, 63, 174, 154, 151, 63, 33, 177, 151, 63, 147, 199, 151, 63, 5, 222, 151, 63, 119, 244, 151, 63, 242, 10, 152, 63, 108, 33, 152, 63, 239, 55, 152, 63, 114, 78, 152, 63, 254, 100, 152, 63, 137, 123, 152, 63, 20, 146, 152, 63, 168, 168, 152, 63, 60, 191, 152, 63, 208, 213, 152, 63, 108, 236, 152, 63, 8, 3, 153, 63, 172, 25, 153, 63, 81, 48, 153, 63, 254, 70, 153, 63, 171, 93, 153, 63, 88, 116, 153, 63, 13, 139, 153, 63, 194, 161, 153, 63, 120, 184, 153, 63, 53, 207, 153, 63, 243, 229, 153, 63, 185, 252, 153, 63, 127, 19, 154, 63, 78, 42, 154, 63, 28, 65, 154, 63, 235, 87, 154, 63, 193, 110, 154, 63, 152, 133, 154, 63, 111, 156, 154, 63, 78, 179, 154, 63, 46, 202, 154, 63, 21, 225, 154, 63, 253, 247, 154, 63, 237, 14, 155, 63, 221, 37, 155, 63, 205, 60, 155, 63, 197, 83, 155, 63, 190, 106, 155, 63, 182, 129, 155, 63, 183, 152, 155, 63, 192, 175, 155, 63, 193, 198, 155, 63, 211, 221, 155, 63, 220, 244, 155, 63, 237, 11, 156, 63, 7, 35, 156, 63, 25, 58, 156, 63, 59, 81, 156, 63, 85, 104, 156, 63, 120, 127, 156, 63, 162, 150, 156, 63, 205, 173, 156, 63, 248, 196, 156, 63, 35, 220, 156, 63, 94, 243, 156, 63, 145, 10, 157, 63, 205, 33, 157, 63, 8, 57, 157, 63, 76, 80, 157, 63, 144, 103, 157, 63, 212, 126, 157, 63, 32, 150, 157, 63, 117, 173, 157, 63, 202, 196, 157, 63, 30, 220, 157, 63, 115, 243, 157, 63, 208, 10, 158, 63, 54, 34, 158, 63, 155, 57, 158, 63, 1, 81, 158, 63, 102, 104, 158, 63, 212, 127, 158, 63, 74, 151, 158, 63, 192, 174, 158, 63, 55, 198, 158, 63, 181, 221, 158, 63, 52, 245, 158, 63, 179, 12, 159, 63, 58, 36, 159, 63, 201, 59, 159, 63, 80, 83, 159, 63, 232, 106, 159, 63, 119, 130, 159, 63, 15, 154, 159, 63, 175, 177, 159, 63, 79, 201, 159, 63, 240, 224, 159, 63, 152, 248, 159, 63, 65, 16, 160, 63, 233, 39, 160, 63, 154, 63, 160, 63, 75, 87, 160, 63, 5, 111, 160, 63, 190, 134, 160, 63, 128, 158, 160, 63, 65, 182, 160, 63, 12, 206, 160, 63, 205, 229, 160, 63, 160, 253, 160, 63, 106, 21, 161, 63, 69, 45, 161, 63, 23, 69, 161, 63, 242, 92, 161, 63, 205, 116, 161, 63, 176, 140, 161, 63, 156, 164, 161, 63, 127, 188, 161, 63, 107, 212, 161, 63, 95, 236, 161, 63, 83, 4, 162, 63, 71, 28, 162, 63, 68, 52, 162, 63, 64, 76, 162, 63, 69, 100, 162, 63, 74, 124, 162, 63, 79, 148, 162, 63, 92, 172, 162, 63, 105, 196, 162, 63, 127, 220, 162, 63, 149, 244, 162, 63, 179, 12, 163, 63, 209, 36, 163, 63, 239, 60, 163, 63, 21, 85, 163, 63, 59, 109, 163, 63, 106, 133, 163, 63, 153, 157, 163, 63, 208, 181, 163, 63, 7, 206, 163, 63, 63, 230, 163, 63, 126, 254, 163, 63, 190, 22, 164, 63, 6, 47, 164, 63, 78, 71, 164, 63, 150, 95, 164, 63, 230, 119, 164, 63, 63, 144, 164, 63, 151, 168, 164, 63, 240, 192, 164, 63, 81, 217, 164, 63, 178, 241, 164, 63, 19, 10, 165, 63, 125, 34, 165, 63, 239, 58, 165, 63, 97, 83, 165, 63, 211, 107, 165, 63, 77, 132, 165, 63, 199, 156, 165, 63, 66, 181, 165, 63, 196, 205, 165, 63, 79, 230, 165, 63, 218, 254, 165, 63, 101, 23, 166, 63, 249, 47, 166, 63, 140, 72, 166, 63, 32, 97, 166, 63, 188, 121, 166, 63, 96, 146, 166, 63, 4, 171, 166, 63, 168, 195, 166, 63, 85, 220, 166, 63, 2, 245, 166, 63, 183, 13, 167, 63, 108, 38, 167, 63, 33, 63, 167, 63, 222, 87, 167, 63, 164, 112, 167, 63, 97, 137, 167, 63, 47, 162, 167, 63, 245, 186, 167, 63, 204, 211, 167, 63, 154, 236, 167, 63, 113, 5, 168, 63, 79, 30, 168, 63, 38, 55, 168, 63, 13, 80, 168, 63, 245, 104, 168, 63, 220, 129, 168, 63, 195, 154, 168, 63, 179, 179, 168, 63, 171, 204, 168, 63, 163, 229, 168, 63, 155, 254, 168, 63, 156, 23, 169, 63, 156, 48, 169, 63, 165, 73, 169, 63, 174, 98, 169, 63, 192, 123, 169, 63, 209, 148, 169, 63, 226, 173, 169, 63, 252, 198, 169, 63, 30, 224, 169, 63, 64, 249, 169, 63, 98, 18, 170, 63, 132, 43, 170, 63, 183, 68, 170, 63, 225, 93, 170, 63, 20, 119, 170, 63, 79, 144, 170, 63, 139, 169, 170, 63, 198, 194, 170, 63, 10, 220, 170, 63, 77, 245, 170, 63, 153, 14, 171, 63, 229, 39, 171, 63, 58, 65, 171, 63, 142, 90, 171, 63, 226, 115, 171, 63, 63, 141, 171, 63, 156, 166, 171, 63, 1, 192, 171, 63, 111, 217, 171, 63, 212, 242, 171, 63, 65, 12, 172, 63, 183, 37, 172, 63, 45, 63, 172, 63, 172, 88, 172, 63, 42, 114, 172, 63, 168, 139, 172, 63, 47, 165, 172, 63, 182, 190, 172, 63, 69, 216, 172, 63, 212, 241, 172, 63, 107, 11, 173, 63, 3, 37, 173, 63, 163, 62, 173, 63, 67, 88, 173, 63, 227, 113, 173, 63, 139, 139, 173, 63, 51, 165, 173, 63, 228, 190, 173, 63, 149, 216, 173, 63, 78, 242, 173, 63, 7, 12, 174, 63, 200, 37, 174, 63, 138, 63, 174, 63, 83, 89, 174, 63, 29, 115, 174, 63, 231, 140, 174, 63, 185, 166, 174, 63, 139, 192, 174, 63, 102, 218, 174, 63, 73, 244, 174, 63, 36, 14, 175, 63, 15, 40, 175, 63, 242, 65, 175, 63, 221, 91, 175, 63, 209, 117, 175, 63, 197, 143, 175, 63, 185, 169, 175, 63, 181, 195, 175, 63, 186, 221, 175, 63, 190, 247, 175, 63, 195, 17, 176, 63, 208, 43, 176, 63, 221, 69, 176, 63, 242, 95, 176, 63, 7, 122, 176, 63, 29, 148, 176, 63, 58, 174, 176, 63, 96, 200, 176, 63, 134, 226, 176, 63, 173, 252, 176, 63, 219, 22, 177, 63, 18, 49, 177, 63, 64, 75, 177, 63, 128, 101, 177, 63, 191, 127, 177, 63, 254, 153, 177, 63, 62, 180, 177, 63, 142, 206, 177, 63, 213, 232, 177, 63, 37, 3, 178, 63, 126, 29, 178, 63, 214, 55, 178, 63, 47, 82, 178, 63, 143, 108, 178, 63, 249, 134, 178, 63, 98, 161, 178, 63, 203, 187, 178, 63, 61, 214, 178, 63, 174, 240, 178, 63, 40, 11, 179, 63, 162, 37, 179, 63, 37, 64, 179, 63, 167, 90, 179, 63, 41, 117, 179, 63, 180, 143, 179, 63, 71, 170, 179, 63, 219, 196, 179, 63, 110, 223, 179, 63, 9, 250, 179, 63, 173, 20, 180, 63, 81, 47, 180, 63, 245, 73, 180, 63, 161, 100, 180, 63, 78, 127, 180, 63, 2, 154, 180, 63, 183, 180, 180, 63, 116, 207, 180, 63, 49, 234, 180, 63, 247, 4, 181, 63, 188, 31, 181, 63, 130, 58, 181, 63, 80, 85, 181, 63, 38, 112, 181, 63, 252, 138, 181, 63, 211, 165, 181, 63, 177, 192, 181, 63, 152, 219, 181, 63, 127, 246, 181, 63, 102, 17, 182, 63, 86, 44, 182, 63, 69, 71, 182, 63, 61, 98, 182, 63, 53, 125, 182, 63, 53, 152, 182, 63, 53, 179, 182, 63, 62, 206, 182, 63, 71, 233, 182, 63, 87, 4, 183, 63, 104, 31, 183, 63, 130, 58, 183, 63, 155, 85, 183, 63, 181, 112, 183, 63, 214, 139, 183, 63, 1, 167, 183, 63, 43, 194, 183, 63, 85, 221, 183, 63, 135, 248, 183, 63, 194, 19, 184, 63, 253, 46, 184, 63, 56, 74, 184, 63, 124, 101, 184, 63, 191, 128, 184, 63, 11, 156, 184, 63, 86, 183, 184, 63, 170, 210, 184, 63, 254, 237, 184, 63, 91, 9, 185, 63, 192, 36, 185, 63, 28, 64, 185, 63, 129, 91, 185, 63, 238, 118, 185, 63, 92, 146, 185, 63, 209, 173, 185, 63, 71, 201, 185, 63, 197, 228, 185, 63, 67, 0, 186, 63, 202, 27, 186, 63, 80, 55, 186, 63, 214, 82, 186, 63, 101, 110, 186, 63, 252, 137, 186, 63, 148, 165, 186, 63, 43, 193, 186, 63, 202, 220, 186, 63, 114, 248, 186, 63, 26, 20, 187, 63, 194, 47, 187, 63, 115, 75, 187, 63, 44, 103, 187, 63, 228, 130, 187, 63, 157, 158, 187, 63, 94, 186, 187, 63, 31, 214, 187, 63, 233, 241, 187, 63, 187, 13, 188, 63, 141, 41, 188, 63, 95, 69, 188, 63, 57, 97, 188, 63, 19, 125, 188, 63, 246, 152, 188, 63, 217, 180, 188, 63, 196, 208, 188, 63, 175, 236, 188, 63, 162, 8, 189, 63, 150, 36, 189, 63, 146, 64, 189, 63, 150, 92, 189, 63, 146, 120, 189, 63, 159, 148, 189, 63, 163, 176, 189, 63, 184, 204, 189, 63, 196, 232, 189, 63, 226, 4, 190, 63, 247, 32, 190, 63, 29, 61, 190, 63, 58, 89, 190, 63, 96, 117, 190, 63, 142, 145, 190, 63, 188, 173, 190, 63, 243, 201, 190, 63, 42, 230, 190, 63, 105, 2, 191, 63, 168, 30, 191, 63, 239, 58, 191, 63, 54, 87, 191, 63, 134, 115, 191, 63, 214, 143, 191, 63, 46, 172, 191, 63, 134, 200, 191, 63, 231, 228, 191, 63, 71, 1, 192, 63, 176, 29, 192, 63, 25, 58, 192, 63, 138, 86, 192, 63, 252, 114, 192, 63, 109, 143, 192, 63, 239, 171, 192, 63, 105, 200, 192, 63, 243, 228, 192, 63, 117, 1, 193, 63, 8, 30, 193, 63, 147, 58, 193, 63, 46, 87, 193, 63, 193, 115, 193, 63, 100, 144, 193, 63, 0, 173, 193, 63, 172, 201, 193, 63, 79, 230, 193, 63, 4, 3, 194, 63, 176, 31, 194, 63, 109, 60, 194, 63, 33, 89, 194, 63, 230, 117, 194, 63, 163, 146, 194, 63, 113, 175, 194, 63, 62, 204, 194, 63, 12, 233, 194, 63, 226, 5, 195, 63, 184, 34, 195, 63, 150, 63, 195, 63, 116, 92, 195, 63, 91, 121, 195, 63, 66, 150, 195, 63, 49, 179, 195, 63, 41, 208, 195, 63, 32, 237, 195, 63, 24, 10, 196, 63, 24, 39, 196, 63, 24, 68, 196, 63, 32, 97, 196, 63, 49, 126, 196, 63, 65, 155, 196, 63, 82, 184, 196, 63, 107, 213, 196, 63, 140, 242, 196, 63, 174, 15, 197, 63, 207, 44, 197, 63, 249, 73, 197, 63, 44, 103, 197, 63, 94, 132, 197, 63, 144, 161, 197, 63, 211, 190, 197, 63, 14, 220, 197, 63, 81, 249, 197, 63, 156, 22, 198, 63, 232, 51, 198, 63, 59, 81, 198, 63, 143, 110, 198, 63, 235, 139, 198, 63, 72, 169, 198, 63, 172, 198, 198, 63, 17, 228, 198, 63, 126, 1, 199, 63, 235, 30, 199, 63, 96, 60, 199, 63, 213, 89, 199, 63, 83, 119, 199, 63, 209, 148, 199, 63, 87, 178, 199, 63, 230, 207, 199, 63, 116, 237, 199, 63, 3, 11, 200, 63, 153, 40, 200, 63, 57, 70, 200, 63, 216, 99, 200, 63, 119, 129, 200, 63, 31, 159, 200, 63, 207, 188, 200, 63, 127, 218, 200, 63, 56, 248, 200, 63, 240, 21, 201, 63, 177, 51, 201, 63, 114, 81, 201, 63, 59, 111, 201, 63, 4, 141, 201, 63, 214, 170, 201, 63, 168, 200, 201, 63, 130, 230, 201, 63, 92, 4, 202, 63, 62, 34, 202, 63, 41, 64, 202, 63, 20, 94, 202, 63, 254, 123, 202, 63, 242, 153, 202, 63, 237, 183, 202, 63, 233, 213, 202, 63, 228, 243, 202, 63, 232, 17, 203, 63, 245, 47, 203, 63, 1, 78, 203, 63, 22, 108, 203, 63, 43, 138, 203, 63, 72, 168, 203, 63, 101, 198, 203, 63, 138, 228, 203, 63, 176, 2, 204, 63, 222, 32, 204, 63, 20, 63, 204, 63, 74, 93, 204, 63, 129, 123, 204, 63, 191, 153, 204, 63, 6, 184, 204, 63, 77, 214, 204, 63, 157, 244, 204, 63, 236, 18, 205, 63, 60, 49, 205, 63, 156, 79, 205, 63, 244, 109, 205, 63, 93, 140, 205, 63, 197, 170, 205, 63, 46, 201, 205, 63, 159, 231, 205, 63, 16, 6, 206, 63, 137, 36, 206, 63, 11, 67, 206, 63, 141, 97, 206, 63, 23, 128, 206, 63, 161, 158, 206, 63, 43, 189, 206, 63, 198, 219, 206, 63, 89, 250, 206, 63, 252, 24, 207, 63, 151, 55, 207, 63, 67, 86, 207, 63, 239, 116, 207, 63, 154, 147, 207, 63, 79, 178, 207, 63, 11, 209, 207, 63, 200, 239, 207, 63, 132, 14, 208, 63, 81, 45, 208, 63, 22, 76, 208, 63, 236, 106, 208, 63, 185, 137, 208, 63, 151, 168, 208, 63, 109, 199, 208, 63, 84, 230, 208, 63, 58, 5, 209, 63, 32, 36, 209, 63, 15, 67, 209, 63, 7, 98, 209, 63, 254, 128, 209, 63, 253, 159, 209, 63, 253, 190, 209, 63, 5, 222, 209, 63, 13, 253, 209, 63, 29, 28, 210, 63, 54, 59, 210, 63, 79, 90, 210, 63, 104, 121, 210, 63, 137, 152, 210, 63, 179, 183, 210, 63, 220, 214, 210, 63, 14, 246, 210, 63, 64, 21, 211, 63, 122, 52, 211, 63, 181, 83, 211, 63, 247, 114, 211, 63, 67, 146, 211, 63, 142, 177, 211, 63, 217, 208, 211, 63, 44, 240, 211, 63, 136, 15, 212, 63, 228, 46, 212, 63, 72, 78, 212, 63, 181, 109, 212, 63, 25, 141, 212, 63, 142, 172, 212, 63, 3, 204, 212, 63, 121, 235, 212, 63, 246, 10, 213, 63, 124, 42, 213, 63, 2, 74, 213, 63, 144, 105, 213, 63, 30, 137, 213, 63, 181, 168, 213, 63, 84, 200, 213, 63, 243, 231, 213, 63, 146, 7, 214, 63, 66, 39, 214, 63, 233, 70, 214, 63, 161, 102, 214, 63, 81, 134, 214, 63, 17, 166, 214, 63, 210, 197, 214, 63, 147, 229, 214, 63, 92, 5, 215, 63, 45, 37, 215, 63, 254, 68, 215, 63, 216, 100, 215, 63, 178, 132, 215, 63, 148, 164, 215, 63, 118, 196, 215, 63, 96, 228, 215, 63, 83, 4, 216, 63, 70, 36, 216, 63, 57, 68, 216, 63, 61, 100, 216, 63, 56, 132, 216, 63, 68, 164, 216, 63, 80, 196, 216, 63, 92, 228, 216, 63, 113, 4, 217, 63, 141, 36, 217, 63, 170, 68, 217, 63, 208, 100, 217, 63, 245, 132, 217, 63, 34, 165, 217, 63, 80, 197, 217, 63, 134, 229, 217, 63, 196, 5, 218, 63, 3, 38, 218, 63, 74, 70, 218, 63, 144, 102, 218, 63, 224, 134, 218, 63, 47, 167, 218, 63, 134, 199, 218, 63, 230, 231, 218, 63, 70, 8, 219, 63, 174, 40, 219, 63, 23, 73, 219, 63, 136, 105, 219, 63, 248, 137, 219, 63, 113, 170, 219, 63, 243, 202, 219, 63, 116, 235, 219, 63, 254, 11, 220, 63, 136, 44, 220, 63, 26, 77, 220, 63, 173, 109, 220, 63, 71, 142, 220, 63, 234, 174, 220, 63, 141, 207, 220, 63, 57, 240, 220, 63, 228, 16, 221, 63, 152, 49, 221, 63, 76, 82, 221, 63, 17, 115, 221, 63, 205, 147, 221, 63, 145, 180, 221, 63, 94, 213, 221, 63, 43, 246, 221, 63, 1, 23, 222, 63, 223, 55, 222, 63, 188, 88, 222, 63, 163, 121, 222, 63, 137, 154, 222, 63, 119, 187, 222, 63, 102, 220, 222, 63, 93, 253, 222, 63, 92, 30, 223, 63, 91, 63, 223, 63, 99, 96, 223, 63, 107, 129, 223, 63, 123, 162, 223, 63, 139, 195, 223, 63, 164, 228, 223, 63, 196, 5, 224, 63, 229, 38, 224, 63, 15, 72, 224, 63, 56, 105, 224, 63, 105, 138, 224, 63, 164, 171, 224, 63, 222, 204, 224, 63, 32, 238, 224, 63, 98, 15, 225, 63, 173, 48, 225, 63, 0, 82, 225, 63, 84, 115, 225, 63, 167, 148, 225, 63, 11, 182, 225, 63, 111, 215, 225, 63, 211, 248, 225, 63, 63, 26, 226, 63, 180, 59, 226, 63, 41, 93, 226, 63, 166, 126, 226, 63, 35, 160, 226, 63, 169, 193, 226, 63, 55, 227, 226, 63, 197, 4, 227, 63, 91, 38, 227, 63, 241, 71, 227, 63, 144, 105, 227, 63, 47, 139, 227, 63, 222, 172, 227, 63, 133, 206, 227, 63, 61, 240, 227, 63, 237, 17, 228, 63, 173, 51, 228, 63, 109, 85, 228, 63, 54, 119, 228, 63, 254, 152, 228, 63, 207, 186, 228, 63, 160, 220, 228, 63, 122, 254, 228, 63, 92, 32, 229, 63, 62, 66, 229, 63, 40, 100, 229, 63, 26, 134, 229, 63, 13, 168, 229, 63, 8, 202, 229, 63, 3, 236, 229, 63, 6, 14, 230, 63, 10, 48, 230, 63, 21, 82, 230, 63, 42, 116, 230, 63, 62, 150, 230, 63, 90, 184, 230, 63, 119, 218, 230, 63, 164, 252, 230, 63, 201, 30, 231, 63, 246, 64, 231, 63, 44, 99, 231, 63, 106, 133, 231, 63, 168, 167, 231, 63, 239, 201, 231, 63, 53, 236, 231, 63, 132, 14, 232, 63, 211, 48, 232, 63, 42, 83, 232, 63, 138, 117, 232, 63, 234, 151, 232, 63, 82, 186, 232, 63, 194, 220, 232, 63, 50, 255, 232, 63, 171, 33, 233, 63, 36, 68, 233, 63, 165, 102, 233, 63, 47, 137, 233, 63, 185, 171, 233, 63, 66, 206, 233, 63, 220, 240, 233, 63, 119, 19, 234, 63, 26, 54, 234, 63, 188, 88, 234, 63, 103, 123, 234, 63, 19, 158, 234, 63, 198, 192, 234, 63, 130, 227, 234, 63, 62, 6, 235, 63, 2, 41, 235, 63, 199, 75, 235, 63, 156, 110, 235, 63, 104, 145, 235, 63, 70, 180, 235, 63, 35, 215, 235, 63, 1, 250, 235, 63, 231, 28, 236, 63, 213, 63, 236, 63, 204, 98, 236, 63, 194, 133, 236, 63, 185, 168, 236, 63, 192, 203, 236, 63, 191, 238, 236, 63, 207, 17, 237, 63, 223, 52, 237, 63, 247, 87, 237, 63, 15, 123, 237, 63, 48, 158, 237, 63, 89, 193, 237, 63, 130, 228, 237, 63, 179, 7, 238, 63, 229, 42, 238, 63, 30, 78, 238, 63, 97, 113, 238, 63, 163, 148, 238, 63, 237, 183, 238, 63, 64, 219, 238, 63, 147, 254, 238, 63, 238, 33, 239, 63, 74, 69, 239, 63, 173, 104, 239, 63, 25, 140, 239, 63, 134, 175, 239, 63, 250, 210, 239, 63, 119, 246, 239, 63, 244, 25, 240, 63, 121, 61, 240, 63, 254, 96, 240, 63, 140, 132, 240, 63, 34, 168, 240, 63, 192, 203, 240, 63, 95, 239, 240, 63, 253, 18, 241, 63, 164, 54, 241, 63, 83, 90, 241, 63, 11, 126, 241, 63, 194, 161, 241, 63, 122, 197, 241, 63, 66, 233, 241, 63, 11, 13, 242, 63, 211, 48, 242, 63, 172, 84, 242, 63, 125, 120, 242, 63, 94, 156, 242, 63, 64, 192, 242, 63, 42, 228, 242, 63, 20, 8, 243, 63, 6, 44, 243, 63, 1, 80, 243, 63, 251, 115, 243, 63, 255, 151, 243, 63, 10, 188, 243, 63, 21, 224, 243, 63, 41, 4, 244, 63, 61, 40, 244, 63, 89, 76, 244, 63, 126, 112, 244, 63, 171, 148, 244, 63, 216, 184, 244, 63, 5, 221, 244, 63, 67, 1, 245, 63, 129, 37, 245, 63, 191, 73, 245, 63, 5, 110, 245, 63, 83, 146, 245, 63, 170, 182, 245, 63, 1, 219, 245, 63, 97, 255, 245, 63, 192, 35, 246, 63, 40, 72, 246, 63, 152, 108, 246, 63, 8, 145, 246, 63, 128, 181, 246, 63, 1, 218, 246, 63, 130, 254, 246, 63, 12, 35, 247, 63, 157, 71, 247, 63, 47, 108, 247, 63, 201, 144, 247, 63, 99, 181, 247, 63, 6, 218, 247, 63, 176, 254, 247, 63, 100, 35, 248, 63, 23, 72, 248, 63, 202, 108, 248, 63, 142, 145, 248, 63, 82, 182, 248, 63, 31, 219, 248, 63, 235, 255, 248, 63, 192, 36, 249, 63, 157, 73, 249, 63, 122, 110, 249, 63, 96, 147, 249, 63, 69, 184, 249, 63, 51, 221, 249, 63, 42, 2, 250, 63, 40, 39, 250, 63, 39, 76, 250, 63, 46, 113, 250, 63, 53, 150, 250, 63, 77, 187, 250, 63, 93, 224, 250, 63, 125, 5, 251, 63, 157, 42, 251, 63, 198, 79, 251, 63, 239, 116, 251, 63, 32, 154, 251, 63, 89, 191, 251, 63, 147, 228, 251, 63, 213, 9, 252, 63, 31, 47, 252, 63, 105, 84, 252, 63, 188, 121, 252, 63, 23, 159, 252, 63, 114, 196, 252, 63, 213, 233, 252, 63, 65, 15, 253, 63, 173, 52, 253, 63, 33, 90, 253, 63, 157, 127, 253, 63, 26, 165, 253, 63, 159, 202, 253, 63, 44, 240, 253, 63, 186, 21, 254, 63, 79, 59, 254, 63, 238, 96, 254, 63, 140, 134, 254, 63, 50, 172, 254, 63, 217, 209, 254, 63, 144, 247, 254, 63, 63, 29, 255, 63, 255, 66, 255, 63, 190, 104, 255, 63, 134, 142, 255, 63, 87, 180, 255, 63, 39, 218, 255, 63, 0, 0, 0, 64, 0, 122, 4, 110, 97, 109, 101, 1, 85, 9, 0, 4, 115, 105, 110, 102, 1, 4, 99, 111, 115, 102, 2, 5, 115, 105, 110, 104, 102, 3, 17, 95, 95, 119, 97, 115, 109, 95, 99, 97, 108, 108, 95, 99, 116, 111, 114, 115, 4, 5, 99, 116, 50, 104, 122, 5, 9, 103, 101, 116, 95, 111, 109, 101, 103, 97, 6, 6, 66, 105, 81, 117, 97, 100, 7, 6, 115, 101, 116, 76, 80, 70, 8, 10, 66, 105, 81, 117, 97, 100, 95, 110, 101, 119, 7, 18, 1, 0, 15, 95, 95, 115, 116, 97, 99, 107, 95, 112, 111, 105, 110, 116, 101, 114, 9, 8, 1, 0, 5, 46, 100, 97, 116, 97, 0, 47, 9, 112, 114, 111, 100, 117, 99, 101, 114, 115, 1, 12, 112, 114, 111, 99, 101, 115, 115, 101, 100, 45, 98, 121, 1, 14, 72, 111, 109, 101, 98, 114, 101, 119, 32, 99, 108, 97, 110, 103, 6, 49, 54, 46, 48, 46, 48, 0, 44, 15, 116, 97, 114, 103, 101, 116, 95, 102, 101, 97, 116, 117, 114, 101, 115, 2, 43, 15, 109, 117, 116, 97, 98, 108, 101, 45, 103, 108, 111, 98, 97, 108, 115, 43, 8, 115, 105, 103, 110, 45, 101, 120, 116]);

class LowPassFilterNode extends AudioWorkletNode {
  static param_defaults = {frequency: 13500, Q: 1.0};
  static async init(ctx) {
    try {
      await ctx.audioWorklet
        .addModule("lpf-proc.js");
    } catch (e) {
      await ctx.audioWorklet.addModule('lpf/lpf-proc.js');

    }
  }
  constructor(ctx, options = {}) {
    super(ctx, "lpf-proc", {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      processorOptions: {
        ...{frequency: 13500, Q: .8},
        ...options,
        wasmbin: wasmbin$2,
      },
    });
  }
  set frequency(freq) {
    this.port.postMessage(freq / this.context.sampleRate);
  }
}

// @ts-ignore 
// @prettier-ignore 
const wasmbin$1 = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 42, 8, 96, 1, 127, 1, 127, 96, 0, 1, 127, 96, 0, 0, 96, 1, 127, 0, 96, 3, 127, 127, 127, 0, 96, 2, 127, 127, 0, 96, 3, 127, 127, 127, 1, 127, 96, 3, 127, 126, 127, 1, 126, 3, 25, 24, 2, 4, 4, 5, 2, 1, 1, 0, 0, 0, 2, 1, 1, 1, 3, 0, 0, 3, 3, 3, 1, 2, 0, 0, 4, 5, 1, 112, 1, 2, 2, 5, 6, 1, 1, 128, 2, 128, 2, 6, 19, 3, 127, 1, 65, 144, 140, 192, 2, 11, 127, 1, 65, 0, 11, 127, 1, 65, 0, 11, 7, 235, 1, 15, 6, 109, 101, 109, 111, 114, 121, 2, 0, 3, 70, 70, 84, 0, 1, 4, 105, 70, 70, 84, 0, 2, 11, 98, 105, 116, 95, 114, 101, 118, 101, 114, 115, 101, 0, 3, 11, 95, 105, 110, 105, 116, 105, 97, 108, 105, 122, 101, 0, 4, 25, 95, 95, 105, 110, 100, 105, 114, 101, 99, 116, 95, 102, 117, 110, 99, 116, 105, 111, 110, 95, 116, 97, 98, 108, 101, 1, 0, 16, 95, 95, 101, 114, 114, 110, 111, 95, 108, 111, 99, 97, 116, 105, 111, 110, 0, 6, 6, 102, 102, 108, 117, 115, 104, 0, 22, 9, 115, 116, 97, 99, 107, 83, 97, 118, 101, 0, 13, 12, 115, 116, 97, 99, 107, 82, 101, 115, 116, 111, 114, 101, 0, 14, 10, 115, 116, 97, 99, 107, 65, 108, 108, 111, 99, 0, 15, 21, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 95, 115, 116, 97, 99, 107, 95, 105, 110, 105, 116, 0, 10, 25, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 95, 115, 116, 97, 99, 107, 95, 103, 101, 116, 95, 102, 114, 101, 101, 0, 11, 24, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 95, 115, 116, 97, 99, 107, 95, 103, 101, 116, 95, 101, 110, 100, 0, 12, 6, 109, 97, 108, 108, 111, 99, 0, 9, 9, 7, 1, 0, 65, 1, 11, 1, 0, 10, 164, 102, 24, 4, 0, 16, 10, 11, 220, 22, 3, 220, 1, 127, 88, 124, 6, 126, 35, 0, 33, 3, 65, 192, 0, 33, 4, 32, 3, 32, 4, 107, 33, 5, 32, 5, 32, 0, 54, 2, 60, 32, 5, 32, 1, 54, 2, 56, 32, 5, 32, 2, 54, 2, 52, 32, 5, 40, 2, 56, 33, 6, 65, 2, 33, 7, 32, 6, 32, 7, 107, 33, 8, 65, 1, 33, 9, 32, 9, 32, 8, 116, 33, 10, 32, 5, 32, 10, 54, 2, 48, 32, 5, 40, 2, 60, 33, 11, 32, 5, 40, 2, 48, 33, 12, 65, 6, 33, 13, 32, 12, 32, 13, 116, 33, 14, 32, 11, 32, 14, 106, 33, 15, 32, 5, 32, 15, 54, 2, 32, 32, 5, 40, 2, 48, 33, 16, 32, 5, 32, 16, 54, 2, 44, 65, 1, 33, 17, 32, 5, 32, 17, 54, 2, 36, 2, 64, 3, 64, 32, 5, 40, 2, 44, 33, 18, 65, 1, 33, 19, 32, 18, 33, 20, 32, 19, 33, 21, 32, 20, 32, 21, 78, 33, 22, 65, 1, 33, 23, 32, 22, 32, 23, 113, 33, 24, 32, 24, 69, 13, 1, 32, 5, 40, 2, 60, 33, 25, 32, 5, 32, 25, 54, 2, 28, 2, 64, 3, 64, 32, 5, 40, 2, 28, 33, 26, 32, 5, 40, 2, 32, 33, 27, 32, 26, 33, 28, 32, 27, 33, 29, 32, 28, 32, 29, 72, 33, 30, 65, 1, 33, 31, 32, 30, 32, 31, 113, 33, 32, 32, 32, 69, 13, 1, 32, 5, 40, 2, 28, 33, 33, 32, 5, 40, 2, 44, 33, 34, 65, 1, 33, 35, 32, 34, 32, 35, 116, 33, 36, 65, 4, 33, 37, 32, 36, 32, 37, 116, 33, 38, 32, 33, 32, 38, 106, 33, 39, 32, 5, 32, 39, 54, 2, 24, 32, 5, 40, 2, 28, 33, 40, 32, 40, 43, 3, 0, 33, 223, 1, 32, 5, 40, 2, 24, 33, 41, 32, 41, 43, 3, 0, 33, 224, 1, 32, 223, 1, 32, 224, 1, 161, 33, 225, 1, 32, 5, 32, 225, 1, 57, 3, 8, 32, 5, 40, 2, 28, 33, 42, 32, 42, 43, 3, 8, 33, 226, 1, 32, 5, 40, 2, 24, 33, 43, 32, 43, 43, 3, 8, 33, 227, 1, 32, 226, 1, 32, 227, 1, 161, 33, 228, 1, 32, 5, 32, 228, 1, 57, 3, 16, 32, 5, 40, 2, 24, 33, 44, 32, 44, 43, 3, 0, 33, 229, 1, 32, 5, 40, 2, 28, 33, 45, 32, 45, 43, 3, 0, 33, 230, 1, 32, 230, 1, 32, 229, 1, 160, 33, 231, 1, 32, 45, 32, 231, 1, 57, 3, 0, 32, 5, 40, 2, 24, 33, 46, 32, 46, 43, 3, 8, 33, 232, 1, 32, 5, 40, 2, 28, 33, 47, 32, 47, 43, 3, 8, 33, 233, 1, 32, 233, 1, 32, 232, 1, 160, 33, 234, 1, 32, 47, 32, 234, 1, 57, 3, 8, 32, 5, 40, 2, 24, 33, 48, 65, 8, 33, 49, 32, 5, 32, 49, 106, 33, 50, 32, 50, 33, 51, 32, 51, 41, 3, 0, 33, 183, 2, 32, 48, 32, 183, 2, 55, 3, 0, 65, 8, 33, 52, 32, 48, 32, 52, 106, 33, 53, 32, 51, 32, 52, 106, 33, 54, 32, 54, 41, 3, 0, 33, 184, 2, 32, 53, 32, 184, 2, 55, 3, 0, 32, 5, 40, 2, 28, 33, 55, 65, 16, 33, 56, 32, 55, 32, 56, 106, 33, 57, 32, 5, 32, 57, 54, 2, 28, 32, 5, 40, 2, 24, 33, 58, 65, 16, 33, 59, 32, 58, 32, 59, 106, 33, 60, 32, 5, 32, 60, 54, 2, 24, 32, 5, 40, 2, 36, 33, 61, 32, 5, 32, 61, 54, 2, 40, 2, 64, 3, 64, 32, 5, 40, 2, 40, 33, 62, 32, 5, 40, 2, 48, 33, 63, 32, 62, 33, 64, 32, 63, 33, 65, 32, 64, 32, 65, 72, 33, 66, 65, 1, 33, 67, 32, 66, 32, 67, 113, 33, 68, 32, 68, 69, 13, 1, 32, 5, 40, 2, 28, 33, 69, 32, 69, 43, 3, 0, 33, 235, 1, 32, 5, 40, 2, 24, 33, 70, 32, 70, 43, 3, 0, 33, 236, 1, 32, 235, 1, 32, 236, 1, 161, 33, 237, 1, 32, 5, 32, 237, 1, 57, 3, 8, 32, 5, 40, 2, 28, 33, 71, 32, 71, 43, 3, 8, 33, 238, 1, 32, 5, 40, 2, 24, 33, 72, 32, 72, 43, 3, 8, 33, 239, 1, 32, 238, 1, 32, 239, 1, 161, 33, 240, 1, 32, 5, 32, 240, 1, 57, 3, 16, 32, 5, 40, 2, 24, 33, 73, 32, 73, 43, 3, 0, 33, 241, 1, 32, 5, 40, 2, 28, 33, 74, 32, 74, 43, 3, 0, 33, 242, 1, 32, 242, 1, 32, 241, 1, 160, 33, 243, 1, 32, 74, 32, 243, 1, 57, 3, 0, 32, 5, 40, 2, 24, 33, 75, 32, 75, 43, 3, 8, 33, 244, 1, 32, 5, 40, 2, 28, 33, 76, 32, 76, 43, 3, 8, 33, 245, 1, 32, 245, 1, 32, 244, 1, 160, 33, 246, 1, 32, 76, 32, 246, 1, 57, 3, 8, 32, 5, 43, 3, 8, 33, 247, 1, 32, 5, 40, 2, 52, 33, 77, 32, 5, 40, 2, 48, 33, 78, 32, 5, 40, 2, 40, 33, 79, 32, 78, 32, 79, 107, 33, 80, 65, 3, 33, 81, 32, 80, 32, 81, 116, 33, 82, 32, 77, 32, 82, 106, 33, 83, 32, 83, 43, 3, 0, 33, 248, 1, 32, 247, 1, 32, 248, 1, 162, 33, 249, 1, 32, 5, 43, 3, 16, 33, 250, 1, 32, 5, 40, 2, 52, 33, 84, 32, 5, 40, 2, 40, 33, 85, 65, 3, 33, 86, 32, 85, 32, 86, 116, 33, 87, 32, 84, 32, 87, 106, 33, 88, 32, 88, 43, 3, 0, 33, 251, 1, 32, 250, 1, 32, 251, 1, 162, 33, 252, 1, 32, 249, 1, 32, 252, 1, 160, 33, 253, 1, 32, 5, 40, 2, 24, 33, 89, 32, 89, 32, 253, 1, 57, 3, 0, 32, 5, 43, 3, 16, 33, 254, 1, 32, 5, 40, 2, 52, 33, 90, 32, 5, 40, 2, 48, 33, 91, 32, 5, 40, 2, 40, 33, 92, 32, 91, 32, 92, 107, 33, 93, 65, 3, 33, 94, 32, 93, 32, 94, 116, 33, 95, 32, 90, 32, 95, 106, 33, 96, 32, 96, 43, 3, 0, 33, 255, 1, 32, 254, 1, 32, 255, 1, 162, 33, 128, 2, 32, 5, 43, 3, 8, 33, 129, 2, 32, 5, 40, 2, 52, 33, 97, 32, 5, 40, 2, 40, 33, 98, 65, 3, 33, 99, 32, 98, 32, 99, 116, 33, 100, 32, 97, 32, 100, 106, 33, 101, 32, 101, 43, 3, 0, 33, 130, 2, 32, 129, 2, 32, 130, 2, 162, 33, 131, 2, 32, 128, 2, 32, 131, 2, 161, 33, 132, 2, 32, 5, 40, 2, 24, 33, 102, 32, 102, 32, 132, 2, 57, 3, 8, 32, 5, 40, 2, 28, 33, 103, 65, 16, 33, 104, 32, 103, 32, 104, 106, 33, 105, 32, 5, 32, 105, 54, 2, 28, 32, 5, 40, 2, 24, 33, 106, 65, 16, 33, 107, 32, 106, 32, 107, 106, 33, 108, 32, 5, 32, 108, 54, 2, 24, 32, 5, 40, 2, 36, 33, 109, 32, 5, 40, 2, 40, 33, 110, 32, 110, 32, 109, 106, 33, 111, 32, 5, 32, 111, 54, 2, 40, 12, 0, 11, 0, 11, 32, 5, 40, 2, 28, 33, 112, 32, 112, 43, 3, 8, 33, 133, 2, 32, 5, 40, 2, 24, 33, 113, 32, 113, 43, 3, 8, 33, 134, 2, 32, 133, 2, 32, 134, 2, 161, 33, 135, 2, 32, 5, 32, 135, 2, 57, 3, 8, 32, 5, 40, 2, 24, 33, 114, 32, 114, 43, 3, 0, 33, 136, 2, 32, 5, 40, 2, 28, 33, 115, 32, 115, 43, 3, 0, 33, 137, 2, 32, 136, 2, 32, 137, 2, 161, 33, 138, 2, 32, 5, 32, 138, 2, 57, 3, 16, 32, 5, 40, 2, 24, 33, 116, 32, 116, 43, 3, 0, 33, 139, 2, 32, 5, 40, 2, 28, 33, 117, 32, 117, 43, 3, 0, 33, 140, 2, 32, 140, 2, 32, 139, 2, 160, 33, 141, 2, 32, 117, 32, 141, 2, 57, 3, 0, 32, 5, 40, 2, 24, 33, 118, 32, 118, 43, 3, 8, 33, 142, 2, 32, 5, 40, 2, 28, 33, 119, 32, 119, 43, 3, 8, 33, 143, 2, 32, 143, 2, 32, 142, 2, 160, 33, 144, 2, 32, 119, 32, 144, 2, 57, 3, 8, 32, 5, 40, 2, 24, 33, 120, 65, 8, 33, 121, 32, 5, 32, 121, 106, 33, 122, 32, 122, 33, 123, 32, 123, 41, 3, 0, 33, 185, 2, 32, 120, 32, 185, 2, 55, 3, 0, 65, 8, 33, 124, 32, 120, 32, 124, 106, 33, 125, 32, 123, 32, 124, 106, 33, 126, 32, 126, 41, 3, 0, 33, 186, 2, 32, 125, 32, 186, 2, 55, 3, 0, 32, 5, 40, 2, 28, 33, 127, 65, 16, 33, 128, 1, 32, 127, 32, 128, 1, 106, 33, 129, 1, 32, 5, 32, 129, 1, 54, 2, 28, 32, 5, 40, 2, 24, 33, 130, 1, 65, 16, 33, 131, 1, 32, 130, 1, 32, 131, 1, 106, 33, 132, 1, 32, 5, 32, 132, 1, 54, 2, 24, 32, 5, 40, 2, 36, 33, 133, 1, 32, 5, 32, 133, 1, 54, 2, 40, 2, 64, 3, 64, 32, 5, 40, 2, 40, 33, 134, 1, 32, 5, 40, 2, 48, 33, 135, 1, 32, 134, 1, 33, 136, 1, 32, 135, 1, 33, 137, 1, 32, 136, 1, 32, 137, 1, 72, 33, 138, 1, 65, 1, 33, 139, 1, 32, 138, 1, 32, 139, 1, 113, 33, 140, 1, 32, 140, 1, 69, 13, 1, 32, 5, 40, 2, 28, 33, 141, 1, 32, 141, 1, 43, 3, 8, 33, 145, 2, 32, 5, 40, 2, 24, 33, 142, 1, 32, 142, 1, 43, 3, 8, 33, 146, 2, 32, 145, 2, 32, 146, 2, 161, 33, 147, 2, 32, 5, 32, 147, 2, 57, 3, 8, 32, 5, 40, 2, 24, 33, 143, 1, 32, 143, 1, 43, 3, 0, 33, 148, 2, 32, 5, 40, 2, 28, 33, 144, 1, 32, 144, 1, 43, 3, 0, 33, 149, 2, 32, 148, 2, 32, 149, 2, 161, 33, 150, 2, 32, 5, 32, 150, 2, 57, 3, 16, 32, 5, 40, 2, 24, 33, 145, 1, 32, 145, 1, 43, 3, 0, 33, 151, 2, 32, 5, 40, 2, 28, 33, 146, 1, 32, 146, 1, 43, 3, 0, 33, 152, 2, 32, 152, 2, 32, 151, 2, 160, 33, 153, 2, 32, 146, 1, 32, 153, 2, 57, 3, 0, 32, 5, 40, 2, 24, 33, 147, 1, 32, 147, 1, 43, 3, 8, 33, 154, 2, 32, 5, 40, 2, 28, 33, 148, 1, 32, 148, 1, 43, 3, 8, 33, 155, 2, 32, 155, 2, 32, 154, 2, 160, 33, 156, 2, 32, 148, 1, 32, 156, 2, 57, 3, 8, 32, 5, 43, 3, 8, 33, 157, 2, 32, 5, 40, 2, 52, 33, 149, 1, 32, 5, 40, 2, 48, 33, 150, 1, 32, 5, 40, 2, 40, 33, 151, 1, 32, 150, 1, 32, 151, 1, 107, 33, 152, 1, 65, 3, 33, 153, 1, 32, 152, 1, 32, 153, 1, 116, 33, 154, 1, 32, 149, 1, 32, 154, 1, 106, 33, 155, 1, 32, 155, 1, 43, 3, 0, 33, 158, 2, 32, 157, 2, 32, 158, 2, 162, 33, 159, 2, 32, 5, 43, 3, 16, 33, 160, 2, 32, 5, 40, 2, 52, 33, 156, 1, 32, 5, 40, 2, 40, 33, 157, 1, 65, 3, 33, 158, 1, 32, 157, 1, 32, 158, 1, 116, 33, 159, 1, 32, 156, 1, 32, 159, 1, 106, 33, 160, 1, 32, 160, 1, 43, 3, 0, 33, 161, 2, 32, 160, 2, 32, 161, 2, 162, 33, 162, 2, 32, 159, 2, 32, 162, 2, 160, 33, 163, 2, 32, 5, 40, 2, 24, 33, 161, 1, 32, 161, 1, 32, 163, 2, 57, 3, 0, 32, 5, 43, 3, 16, 33, 164, 2, 32, 5, 40, 2, 52, 33, 162, 1, 32, 5, 40, 2, 48, 33, 163, 1, 32, 5, 40, 2, 40, 33, 164, 1, 32, 163, 1, 32, 164, 1, 107, 33, 165, 1, 65, 3, 33, 166, 1, 32, 165, 1, 32, 166, 1, 116, 33, 167, 1, 32, 162, 1, 32, 167, 1, 106, 33, 168, 1, 32, 168, 1, 43, 3, 0, 33, 165, 2, 32, 164, 2, 32, 165, 2, 162, 33, 166, 2, 32, 5, 43, 3, 8, 33, 167, 2, 32, 5, 40, 2, 52, 33, 169, 1, 32, 5, 40, 2, 40, 33, 170, 1, 65, 3, 33, 171, 1, 32, 170, 1, 32, 171, 1, 116, 33, 172, 1, 32, 169, 1, 32, 172, 1, 106, 33, 173, 1, 32, 173, 1, 43, 3, 0, 33, 168, 2, 32, 167, 2, 32, 168, 2, 162, 33, 169, 2, 32, 166, 2, 32, 169, 2, 161, 33, 170, 2, 32, 5, 40, 2, 24, 33, 174, 1, 32, 174, 1, 32, 170, 2, 57, 3, 8, 32, 5, 40, 2, 28, 33, 175, 1, 65, 16, 33, 176, 1, 32, 175, 1, 32, 176, 1, 106, 33, 177, 1, 32, 5, 32, 177, 1, 54, 2, 28, 32, 5, 40, 2, 24, 33, 178, 1, 65, 16, 33, 179, 1, 32, 178, 1, 32, 179, 1, 106, 33, 180, 1, 32, 5, 32, 180, 1, 54, 2, 24, 32, 5, 40, 2, 36, 33, 181, 1, 32, 5, 40, 2, 40, 33, 182, 1, 32, 182, 1, 32, 181, 1, 106, 33, 183, 1, 32, 5, 32, 183, 1, 54, 2, 40, 12, 0, 11, 0, 11, 32, 5, 40, 2, 24, 33, 184, 1, 32, 5, 32, 184, 1, 54, 2, 28, 12, 0, 11, 0, 11, 32, 5, 40, 2, 44, 33, 185, 1, 65, 1, 33, 186, 1, 32, 185, 1, 32, 186, 1, 117, 33, 187, 1, 32, 5, 32, 187, 1, 54, 2, 44, 32, 5, 40, 2, 36, 33, 188, 1, 65, 1, 33, 189, 1, 32, 188, 1, 32, 189, 1, 116, 33, 190, 1, 32, 5, 32, 190, 1, 54, 2, 36, 12, 0, 11, 0, 11, 32, 5, 40, 2, 60, 33, 191, 1, 32, 5, 32, 191, 1, 54, 2, 28, 32, 5, 40, 2, 60, 33, 192, 1, 65, 16, 33, 193, 1, 32, 192, 1, 32, 193, 1, 106, 33, 194, 1, 32, 5, 32, 194, 1, 54, 2, 24, 2, 64, 3, 64, 32, 5, 40, 2, 28, 33, 195, 1, 32, 5, 40, 2, 32, 33, 196, 1, 32, 195, 1, 33, 197, 1, 32, 196, 1, 33, 198, 1, 32, 197, 1, 32, 198, 1, 72, 33, 199, 1, 65, 1, 33, 200, 1, 32, 199, 1, 32, 200, 1, 113, 33, 201, 1, 32, 201, 1, 69, 13, 1, 32, 5, 40, 2, 28, 33, 202, 1, 32, 202, 1, 43, 3, 0, 33, 171, 2, 32, 5, 40, 2, 24, 33, 203, 1, 32, 203, 1, 43, 3, 0, 33, 172, 2, 32, 171, 2, 32, 172, 2, 161, 33, 173, 2, 32, 5, 32, 173, 2, 57, 3, 8, 32, 5, 40, 2, 28, 33, 204, 1, 32, 204, 1, 43, 3, 8, 33, 174, 2, 32, 5, 40, 2, 24, 33, 205, 1, 32, 205, 1, 43, 3, 8, 33, 175, 2, 32, 174, 2, 32, 175, 2, 161, 33, 176, 2, 32, 5, 32, 176, 2, 57, 3, 16, 32, 5, 40, 2, 24, 33, 206, 1, 32, 206, 1, 43, 3, 0, 33, 177, 2, 32, 5, 40, 2, 28, 33, 207, 1, 32, 207, 1, 43, 3, 0, 33, 178, 2, 32, 178, 2, 32, 177, 2, 160, 33, 179, 2, 32, 207, 1, 32, 179, 2, 57, 3, 0, 32, 5, 40, 2, 24, 33, 208, 1, 32, 208, 1, 43, 3, 8, 33, 180, 2, 32, 5, 40, 2, 28, 33, 209, 1, 32, 209, 1, 43, 3, 8, 33, 181, 2, 32, 181, 2, 32, 180, 2, 160, 33, 182, 2, 32, 209, 1, 32, 182, 2, 57, 3, 8, 32, 5, 40, 2, 24, 33, 210, 1, 65, 8, 33, 211, 1, 32, 5, 32, 211, 1, 106, 33, 212, 1, 32, 212, 1, 33, 213, 1, 32, 213, 1, 41, 3, 0, 33, 187, 2, 32, 210, 1, 32, 187, 2, 55, 3, 0, 65, 8, 33, 214, 1, 32, 210, 1, 32, 214, 1, 106, 33, 215, 1, 32, 213, 1, 32, 214, 1, 106, 33, 216, 1, 32, 216, 1, 41, 3, 0, 33, 188, 2, 32, 215, 1, 32, 188, 2, 55, 3, 0, 32, 5, 40, 2, 28, 33, 217, 1, 65, 32, 33, 218, 1, 32, 217, 1, 32, 218, 1, 106, 33, 219, 1, 32, 5, 32, 219, 1, 54, 2, 28, 32, 5, 40, 2, 24, 33, 220, 1, 65, 32, 33, 221, 1, 32, 220, 1, 32, 221, 1, 106, 33, 222, 1, 32, 5, 32, 222, 1, 54, 2, 24, 12, 0, 11, 0, 11, 15, 11, 138, 23, 3, 210, 1, 127, 103, 124, 4, 126, 35, 0, 33, 3, 65, 192, 0, 33, 4, 32, 3, 32, 4, 107, 33, 5, 32, 5, 32, 0, 54, 2, 60, 32, 5, 32, 1, 54, 2, 56, 32, 5, 32, 2, 54, 2, 52, 32, 5, 40, 2, 56, 33, 6, 65, 2, 33, 7, 32, 6, 32, 7, 107, 33, 8, 65, 1, 33, 9, 32, 9, 32, 8, 116, 33, 10, 32, 5, 32, 10, 54, 2, 48, 32, 5, 40, 2, 60, 33, 11, 32, 5, 40, 2, 48, 33, 12, 65, 6, 33, 13, 32, 12, 32, 13, 116, 33, 14, 32, 11, 32, 14, 106, 33, 15, 32, 5, 32, 15, 54, 2, 32, 32, 5, 40, 2, 48, 33, 16, 32, 16, 183, 33, 213, 1, 68, 0, 0, 0, 0, 0, 0, 208, 63, 33, 214, 1, 32, 214, 1, 32, 213, 1, 163, 33, 215, 1, 32, 5, 32, 215, 1, 57, 3, 24, 32, 5, 40, 2, 60, 33, 17, 32, 5, 32, 17, 54, 2, 20, 32, 5, 40, 2, 60, 33, 18, 65, 16, 33, 19, 32, 18, 32, 19, 106, 33, 20, 32, 5, 32, 20, 54, 2, 16, 2, 64, 3, 64, 32, 5, 40, 2, 20, 33, 21, 32, 5, 40, 2, 32, 33, 22, 32, 21, 33, 23, 32, 22, 33, 24, 32, 23, 32, 24, 72, 33, 25, 65, 1, 33, 26, 32, 25, 32, 26, 113, 33, 27, 32, 27, 69, 13, 1, 32, 5, 40, 2, 20, 33, 28, 32, 28, 43, 3, 0, 33, 216, 1, 32, 5, 40, 2, 16, 33, 29, 32, 29, 43, 3, 0, 33, 217, 1, 32, 216, 1, 32, 217, 1, 161, 33, 218, 1, 32, 5, 43, 3, 24, 33, 219, 1, 32, 218, 1, 32, 219, 1, 162, 33, 220, 1, 32, 5, 32, 220, 1, 57, 3, 0, 32, 5, 40, 2, 20, 33, 30, 32, 30, 43, 3, 8, 33, 221, 1, 32, 5, 40, 2, 16, 33, 31, 32, 31, 43, 3, 8, 33, 222, 1, 32, 221, 1, 32, 222, 1, 161, 33, 223, 1, 32, 5, 43, 3, 24, 33, 224, 1, 32, 223, 1, 32, 224, 1, 162, 33, 225, 1, 32, 5, 32, 225, 1, 57, 3, 8, 32, 5, 40, 2, 20, 33, 32, 32, 32, 43, 3, 0, 33, 226, 1, 32, 5, 40, 2, 16, 33, 33, 32, 33, 43, 3, 0, 33, 227, 1, 32, 226, 1, 32, 227, 1, 160, 33, 228, 1, 32, 5, 43, 3, 24, 33, 229, 1, 32, 228, 1, 32, 229, 1, 162, 33, 230, 1, 32, 5, 40, 2, 20, 33, 34, 32, 34, 32, 230, 1, 57, 3, 0, 32, 5, 40, 2, 20, 33, 35, 32, 35, 43, 3, 8, 33, 231, 1, 32, 5, 40, 2, 16, 33, 36, 32, 36, 43, 3, 8, 33, 232, 1, 32, 231, 1, 32, 232, 1, 160, 33, 233, 1, 32, 5, 43, 3, 24, 33, 234, 1, 32, 233, 1, 32, 234, 1, 162, 33, 235, 1, 32, 5, 40, 2, 20, 33, 37, 32, 37, 32, 235, 1, 57, 3, 8, 32, 5, 40, 2, 16, 33, 38, 32, 5, 33, 39, 32, 39, 41, 3, 0, 33, 188, 2, 32, 38, 32, 188, 2, 55, 3, 0, 65, 8, 33, 40, 32, 38, 32, 40, 106, 33, 41, 32, 39, 32, 40, 106, 33, 42, 32, 42, 41, 3, 0, 33, 189, 2, 32, 41, 32, 189, 2, 55, 3, 0, 32, 5, 40, 2, 20, 33, 43, 65, 32, 33, 44, 32, 43, 32, 44, 106, 33, 45, 32, 5, 32, 45, 54, 2, 20, 32, 5, 40, 2, 16, 33, 46, 65, 32, 33, 47, 32, 46, 32, 47, 106, 33, 48, 32, 5, 32, 48, 54, 2, 16, 12, 0, 11, 0, 11, 65, 1, 33, 49, 32, 5, 32, 49, 54, 2, 44, 32, 5, 40, 2, 48, 33, 50, 32, 5, 32, 50, 54, 2, 36, 2, 64, 3, 64, 32, 5, 40, 2, 36, 33, 51, 65, 1, 33, 52, 32, 51, 33, 53, 32, 52, 33, 54, 32, 53, 32, 54, 78, 33, 55, 65, 1, 33, 56, 32, 55, 32, 56, 113, 33, 57, 32, 57, 69, 13, 1, 32, 5, 40, 2, 60, 33, 58, 32, 5, 32, 58, 54, 2, 20, 2, 64, 3, 64, 32, 5, 40, 2, 20, 33, 59, 32, 5, 40, 2, 32, 33, 60, 32, 59, 33, 61, 32, 60, 33, 62, 32, 61, 32, 62, 72, 33, 63, 65, 1, 33, 64, 32, 63, 32, 64, 113, 33, 65, 32, 65, 69, 13, 1, 32, 5, 40, 2, 20, 33, 66, 32, 5, 40, 2, 44, 33, 67, 65, 1, 33, 68, 32, 67, 32, 68, 116, 33, 69, 65, 4, 33, 70, 32, 69, 32, 70, 116, 33, 71, 32, 66, 32, 71, 106, 33, 72, 32, 5, 32, 72, 54, 2, 16, 32, 5, 40, 2, 16, 33, 73, 32, 5, 33, 74, 32, 73, 41, 3, 0, 33, 190, 2, 32, 74, 32, 190, 2, 55, 3, 0, 65, 8, 33, 75, 32, 74, 32, 75, 106, 33, 76, 32, 73, 32, 75, 106, 33, 77, 32, 77, 41, 3, 0, 33, 191, 2, 32, 76, 32, 191, 2, 55, 3, 0, 32, 5, 40, 2, 20, 33, 78, 32, 78, 43, 3, 0, 33, 236, 1, 32, 5, 43, 3, 0, 33, 237, 1, 32, 236, 1, 32, 237, 1, 161, 33, 238, 1, 32, 5, 40, 2, 16, 33, 79, 32, 79, 32, 238, 1, 57, 3, 0, 32, 5, 40, 2, 20, 33, 80, 32, 80, 43, 3, 8, 33, 239, 1, 32, 5, 43, 3, 8, 33, 240, 1, 32, 239, 1, 32, 240, 1, 161, 33, 241, 1, 32, 5, 40, 2, 16, 33, 81, 32, 81, 32, 241, 1, 57, 3, 8, 32, 5, 43, 3, 0, 33, 242, 1, 32, 5, 40, 2, 20, 33, 82, 32, 82, 43, 3, 0, 33, 243, 1, 32, 243, 1, 32, 242, 1, 160, 33, 244, 1, 32, 82, 32, 244, 1, 57, 3, 0, 32, 5, 43, 3, 8, 33, 245, 1, 32, 5, 40, 2, 20, 33, 83, 32, 83, 43, 3, 8, 33, 246, 1, 32, 246, 1, 32, 245, 1, 160, 33, 247, 1, 32, 83, 32, 247, 1, 57, 3, 8, 32, 5, 40, 2, 20, 33, 84, 65, 16, 33, 85, 32, 84, 32, 85, 106, 33, 86, 32, 5, 32, 86, 54, 2, 20, 32, 5, 40, 2, 16, 33, 87, 65, 16, 33, 88, 32, 87, 32, 88, 106, 33, 89, 32, 5, 32, 89, 54, 2, 16, 32, 5, 40, 2, 36, 33, 90, 32, 5, 32, 90, 54, 2, 40, 2, 64, 3, 64, 32, 5, 40, 2, 40, 33, 91, 32, 5, 40, 2, 48, 33, 92, 32, 91, 33, 93, 32, 92, 33, 94, 32, 93, 32, 94, 72, 33, 95, 65, 1, 33, 96, 32, 95, 32, 96, 113, 33, 97, 32, 97, 69, 13, 1, 32, 5, 40, 2, 16, 33, 98, 32, 98, 43, 3, 0, 33, 248, 1, 32, 5, 40, 2, 52, 33, 99, 32, 5, 40, 2, 48, 33, 100, 32, 5, 40, 2, 40, 33, 101, 32, 100, 32, 101, 107, 33, 102, 65, 3, 33, 103, 32, 102, 32, 103, 116, 33, 104, 32, 99, 32, 104, 106, 33, 105, 32, 105, 43, 3, 0, 33, 249, 1, 32, 248, 1, 32, 249, 1, 162, 33, 250, 1, 32, 5, 40, 2, 16, 33, 106, 32, 106, 43, 3, 8, 33, 251, 1, 32, 5, 40, 2, 52, 33, 107, 32, 5, 40, 2, 40, 33, 108, 65, 3, 33, 109, 32, 108, 32, 109, 116, 33, 110, 32, 107, 32, 110, 106, 33, 111, 32, 111, 43, 3, 0, 33, 252, 1, 32, 251, 1, 32, 252, 1, 162, 33, 253, 1, 32, 250, 1, 32, 253, 1, 161, 33, 254, 1, 32, 5, 32, 254, 1, 57, 3, 0, 32, 5, 40, 2, 16, 33, 112, 32, 112, 43, 3, 8, 33, 255, 1, 32, 5, 40, 2, 52, 33, 113, 32, 5, 40, 2, 48, 33, 114, 32, 5, 40, 2, 40, 33, 115, 32, 114, 32, 115, 107, 33, 116, 65, 3, 33, 117, 32, 116, 32, 117, 116, 33, 118, 32, 113, 32, 118, 106, 33, 119, 32, 119, 43, 3, 0, 33, 128, 2, 32, 255, 1, 32, 128, 2, 162, 33, 129, 2, 32, 5, 40, 2, 16, 33, 120, 32, 120, 43, 3, 0, 33, 130, 2, 32, 5, 40, 2, 52, 33, 121, 32, 5, 40, 2, 40, 33, 122, 65, 3, 33, 123, 32, 122, 32, 123, 116, 33, 124, 32, 121, 32, 124, 106, 33, 125, 32, 125, 43, 3, 0, 33, 131, 2, 32, 130, 2, 32, 131, 2, 162, 33, 132, 2, 32, 129, 2, 32, 132, 2, 160, 33, 133, 2, 32, 5, 32, 133, 2, 57, 3, 8, 32, 5, 40, 2, 20, 33, 126, 32, 126, 43, 3, 0, 33, 134, 2, 32, 5, 43, 3, 0, 33, 135, 2, 32, 134, 2, 32, 135, 2, 161, 33, 136, 2, 32, 5, 40, 2, 16, 33, 127, 32, 127, 32, 136, 2, 57, 3, 0, 32, 5, 40, 2, 20, 33, 128, 1, 32, 128, 1, 43, 3, 8, 33, 137, 2, 32, 5, 43, 3, 8, 33, 138, 2, 32, 137, 2, 32, 138, 2, 161, 33, 139, 2, 32, 5, 40, 2, 16, 33, 129, 1, 32, 129, 1, 32, 139, 2, 57, 3, 8, 32, 5, 43, 3, 0, 33, 140, 2, 32, 5, 40, 2, 20, 33, 130, 1, 32, 130, 1, 43, 3, 0, 33, 141, 2, 32, 141, 2, 32, 140, 2, 160, 33, 142, 2, 32, 130, 1, 32, 142, 2, 57, 3, 0, 32, 5, 43, 3, 8, 33, 143, 2, 32, 5, 40, 2, 20, 33, 131, 1, 32, 131, 1, 43, 3, 8, 33, 144, 2, 32, 144, 2, 32, 143, 2, 160, 33, 145, 2, 32, 131, 1, 32, 145, 2, 57, 3, 8, 32, 5, 40, 2, 20, 33, 132, 1, 65, 16, 33, 133, 1, 32, 132, 1, 32, 133, 1, 106, 33, 134, 1, 32, 5, 32, 134, 1, 54, 2, 20, 32, 5, 40, 2, 16, 33, 135, 1, 65, 16, 33, 136, 1, 32, 135, 1, 32, 136, 1, 106, 33, 137, 1, 32, 5, 32, 137, 1, 54, 2, 16, 32, 5, 40, 2, 36, 33, 138, 1, 32, 5, 40, 2, 40, 33, 139, 1, 32, 139, 1, 32, 138, 1, 106, 33, 140, 1, 32, 5, 32, 140, 1, 54, 2, 40, 12, 0, 11, 0, 11, 32, 5, 40, 2, 16, 33, 141, 1, 32, 141, 1, 43, 3, 8, 33, 146, 2, 32, 146, 2, 154, 33, 147, 2, 32, 5, 32, 147, 2, 57, 3, 0, 32, 5, 40, 2, 16, 33, 142, 1, 32, 142, 1, 43, 3, 0, 33, 148, 2, 32, 5, 32, 148, 2, 57, 3, 8, 32, 5, 40, 2, 20, 33, 143, 1, 32, 143, 1, 43, 3, 0, 33, 149, 2, 32, 5, 43, 3, 0, 33, 150, 2, 32, 149, 2, 32, 150, 2, 161, 33, 151, 2, 32, 5, 40, 2, 16, 33, 144, 1, 32, 144, 1, 32, 151, 2, 57, 3, 0, 32, 5, 40, 2, 20, 33, 145, 1, 32, 145, 1, 43, 3, 8, 33, 152, 2, 32, 5, 43, 3, 8, 33, 153, 2, 32, 152, 2, 32, 153, 2, 161, 33, 154, 2, 32, 5, 40, 2, 16, 33, 146, 1, 32, 146, 1, 32, 154, 2, 57, 3, 8, 32, 5, 43, 3, 0, 33, 155, 2, 32, 5, 40, 2, 20, 33, 147, 1, 32, 147, 1, 43, 3, 0, 33, 156, 2, 32, 156, 2, 32, 155, 2, 160, 33, 157, 2, 32, 147, 1, 32, 157, 2, 57, 3, 0, 32, 5, 43, 3, 8, 33, 158, 2, 32, 5, 40, 2, 20, 33, 148, 1, 32, 148, 1, 43, 3, 8, 33, 159, 2, 32, 159, 2, 32, 158, 2, 160, 33, 160, 2, 32, 148, 1, 32, 160, 2, 57, 3, 8, 32, 5, 40, 2, 20, 33, 149, 1, 65, 16, 33, 150, 1, 32, 149, 1, 32, 150, 1, 106, 33, 151, 1, 32, 5, 32, 151, 1, 54, 2, 20, 32, 5, 40, 2, 16, 33, 152, 1, 65, 16, 33, 153, 1, 32, 152, 1, 32, 153, 1, 106, 33, 154, 1, 32, 5, 32, 154, 1, 54, 2, 16, 32, 5, 40, 2, 36, 33, 155, 1, 32, 5, 32, 155, 1, 54, 2, 40, 2, 64, 3, 64, 32, 5, 40, 2, 40, 33, 156, 1, 32, 5, 40, 2, 48, 33, 157, 1, 32, 156, 1, 33, 158, 1, 32, 157, 1, 33, 159, 1, 32, 158, 1, 32, 159, 1, 72, 33, 160, 1, 65, 1, 33, 161, 1, 32, 160, 1, 32, 161, 1, 113, 33, 162, 1, 32, 162, 1, 69, 13, 1, 32, 5, 40, 2, 16, 33, 163, 1, 32, 163, 1, 43, 3, 8, 33, 161, 2, 32, 161, 2, 154, 33, 162, 2, 32, 5, 40, 2, 52, 33, 164, 1, 32, 5, 40, 2, 48, 33, 165, 1, 32, 5, 40, 2, 40, 33, 166, 1, 32, 165, 1, 32, 166, 1, 107, 33, 167, 1, 65, 3, 33, 168, 1, 32, 167, 1, 32, 168, 1, 116, 33, 169, 1, 32, 164, 1, 32, 169, 1, 106, 33, 170, 1, 32, 170, 1, 43, 3, 0, 33, 163, 2, 32, 162, 2, 32, 163, 2, 162, 33, 164, 2, 32, 5, 40, 2, 16, 33, 171, 1, 32, 171, 1, 43, 3, 0, 33, 165, 2, 32, 5, 40, 2, 52, 33, 172, 1, 32, 5, 40, 2, 40, 33, 173, 1, 65, 3, 33, 174, 1, 32, 173, 1, 32, 174, 1, 116, 33, 175, 1, 32, 172, 1, 32, 175, 1, 106, 33, 176, 1, 32, 176, 1, 43, 3, 0, 33, 166, 2, 32, 165, 2, 32, 166, 2, 162, 33, 167, 2, 32, 164, 2, 32, 167, 2, 161, 33, 168, 2, 32, 5, 32, 168, 2, 57, 3, 0, 32, 5, 40, 2, 16, 33, 177, 1, 32, 177, 1, 43, 3, 0, 33, 169, 2, 32, 5, 40, 2, 52, 33, 178, 1, 32, 5, 40, 2, 48, 33, 179, 1, 32, 5, 40, 2, 40, 33, 180, 1, 32, 179, 1, 32, 180, 1, 107, 33, 181, 1, 65, 3, 33, 182, 1, 32, 181, 1, 32, 182, 1, 116, 33, 183, 1, 32, 178, 1, 32, 183, 1, 106, 33, 184, 1, 32, 184, 1, 43, 3, 0, 33, 170, 2, 32, 169, 2, 32, 170, 2, 162, 33, 171, 2, 32, 5, 40, 2, 16, 33, 185, 1, 32, 185, 1, 43, 3, 8, 33, 172, 2, 32, 5, 40, 2, 52, 33, 186, 1, 32, 5, 40, 2, 40, 33, 187, 1, 65, 3, 33, 188, 1, 32, 187, 1, 32, 188, 1, 116, 33, 189, 1, 32, 186, 1, 32, 189, 1, 106, 33, 190, 1, 32, 190, 1, 43, 3, 0, 33, 173, 2, 32, 172, 2, 32, 173, 2, 162, 33, 174, 2, 32, 171, 2, 32, 174, 2, 161, 33, 175, 2, 32, 5, 32, 175, 2, 57, 3, 8, 32, 5, 40, 2, 20, 33, 191, 1, 32, 191, 1, 43, 3, 0, 33, 176, 2, 32, 5, 43, 3, 0, 33, 177, 2, 32, 176, 2, 32, 177, 2, 161, 33, 178, 2, 32, 5, 40, 2, 16, 33, 192, 1, 32, 192, 1, 32, 178, 2, 57, 3, 0, 32, 5, 40, 2, 20, 33, 193, 1, 32, 193, 1, 43, 3, 8, 33, 179, 2, 32, 5, 43, 3, 8, 33, 180, 2, 32, 179, 2, 32, 180, 2, 161, 33, 181, 2, 32, 5, 40, 2, 16, 33, 194, 1, 32, 194, 1, 32, 181, 2, 57, 3, 8, 32, 5, 43, 3, 0, 33, 182, 2, 32, 5, 40, 2, 20, 33, 195, 1, 32, 195, 1, 43, 3, 0, 33, 183, 2, 32, 183, 2, 32, 182, 2, 160, 33, 184, 2, 32, 195, 1, 32, 184, 2, 57, 3, 0, 32, 5, 43, 3, 8, 33, 185, 2, 32, 5, 40, 2, 20, 33, 196, 1, 32, 196, 1, 43, 3, 8, 33, 186, 2, 32, 186, 2, 32, 185, 2, 160, 33, 187, 2, 32, 196, 1, 32, 187, 2, 57, 3, 8, 32, 5, 40, 2, 20, 33, 197, 1, 65, 16, 33, 198, 1, 32, 197, 1, 32, 198, 1, 106, 33, 199, 1, 32, 5, 32, 199, 1, 54, 2, 20, 32, 5, 40, 2, 16, 33, 200, 1, 65, 16, 33, 201, 1, 32, 200, 1, 32, 201, 1, 106, 33, 202, 1, 32, 5, 32, 202, 1, 54, 2, 16, 32, 5, 40, 2, 36, 33, 203, 1, 32, 5, 40, 2, 40, 33, 204, 1, 32, 204, 1, 32, 203, 1, 106, 33, 205, 1, 32, 5, 32, 205, 1, 54, 2, 40, 12, 0, 11, 0, 11, 32, 5, 40, 2, 16, 33, 206, 1, 32, 5, 32, 206, 1, 54, 2, 20, 12, 0, 11, 0, 11, 32, 5, 40, 2, 44, 33, 207, 1, 65, 1, 33, 208, 1, 32, 207, 1, 32, 208, 1, 116, 33, 209, 1, 32, 5, 32, 209, 1, 54, 2, 44, 32, 5, 40, 2, 36, 33, 210, 1, 65, 1, 33, 211, 1, 32, 210, 1, 32, 211, 1, 117, 33, 212, 1, 32, 5, 32, 212, 1, 54, 2, 36, 12, 0, 11, 0, 11, 15, 11, 198, 5, 2, 85, 127, 6, 126, 35, 0, 33, 2, 65, 48, 33, 3, 32, 2, 32, 3, 107, 33, 4, 32, 4, 32, 0, 54, 2, 44, 32, 4, 32, 1, 54, 2, 40, 32, 4, 40, 2, 40, 33, 5, 65, 1, 33, 6, 32, 6, 32, 5, 116, 33, 7, 65, 1, 33, 8, 32, 7, 32, 8, 107, 33, 9, 32, 4, 32, 9, 54, 2, 8, 65, 1, 33, 10, 32, 4, 32, 10, 54, 2, 20, 2, 64, 3, 64, 32, 4, 40, 2, 20, 33, 11, 32, 4, 40, 2, 8, 33, 12, 32, 11, 33, 13, 32, 12, 33, 14, 32, 13, 32, 14, 72, 33, 15, 65, 1, 33, 16, 32, 15, 32, 16, 113, 33, 17, 32, 17, 69, 13, 1, 32, 4, 40, 2, 20, 33, 18, 32, 4, 32, 18, 54, 2, 16, 65, 0, 33, 19, 32, 4, 32, 19, 54, 2, 12, 32, 4, 40, 2, 40, 33, 20, 32, 4, 32, 20, 54, 2, 4, 2, 64, 3, 64, 32, 4, 40, 2, 4, 33, 21, 65, 0, 33, 22, 32, 21, 33, 23, 32, 22, 33, 24, 32, 23, 32, 24, 74, 33, 25, 65, 1, 33, 26, 32, 25, 32, 26, 113, 33, 27, 32, 27, 69, 13, 1, 32, 4, 40, 2, 12, 33, 28, 65, 1, 33, 29, 32, 28, 32, 29, 116, 33, 30, 32, 4, 32, 30, 54, 2, 12, 32, 4, 40, 2, 16, 33, 31, 65, 1, 33, 32, 32, 31, 32, 32, 113, 33, 33, 32, 4, 40, 2, 12, 33, 34, 32, 34, 32, 33, 106, 33, 35, 32, 4, 32, 35, 54, 2, 12, 32, 4, 40, 2, 16, 33, 36, 65, 1, 33, 37, 32, 36, 32, 37, 117, 33, 38, 32, 4, 32, 38, 54, 2, 16, 32, 4, 40, 2, 4, 33, 39, 65, 127, 33, 40, 32, 39, 32, 40, 106, 33, 41, 32, 4, 32, 41, 54, 2, 4, 12, 0, 11, 0, 11, 32, 4, 40, 2, 12, 33, 42, 32, 4, 40, 2, 20, 33, 43, 32, 42, 33, 44, 32, 43, 33, 45, 32, 44, 32, 45, 74, 33, 46, 65, 1, 33, 47, 32, 46, 32, 47, 113, 33, 48, 2, 64, 32, 48, 69, 13, 0, 32, 4, 40, 2, 44, 33, 49, 32, 4, 40, 2, 12, 33, 50, 65, 4, 33, 51, 32, 50, 32, 51, 116, 33, 52, 32, 49, 32, 52, 106, 33, 53, 65, 24, 33, 54, 32, 4, 32, 54, 106, 33, 55, 32, 55, 33, 56, 32, 53, 41, 3, 0, 33, 87, 32, 56, 32, 87, 55, 3, 0, 65, 8, 33, 57, 32, 56, 32, 57, 106, 33, 58, 32, 53, 32, 57, 106, 33, 59, 32, 59, 41, 3, 0, 33, 88, 32, 58, 32, 88, 55, 3, 0, 32, 4, 40, 2, 44, 33, 60, 32, 4, 40, 2, 12, 33, 61, 65, 4, 33, 62, 32, 61, 32, 62, 116, 33, 63, 32, 60, 32, 63, 106, 33, 64, 32, 4, 40, 2, 44, 33, 65, 32, 4, 40, 2, 20, 33, 66, 65, 4, 33, 67, 32, 66, 32, 67, 116, 33, 68, 32, 65, 32, 68, 106, 33, 69, 32, 69, 41, 3, 0, 33, 89, 32, 64, 32, 89, 55, 3, 0, 65, 8, 33, 70, 32, 64, 32, 70, 106, 33, 71, 32, 69, 32, 70, 106, 33, 72, 32, 72, 41, 3, 0, 33, 90, 32, 71, 32, 90, 55, 3, 0, 32, 4, 40, 2, 44, 33, 73, 32, 4, 40, 2, 20, 33, 74, 65, 4, 33, 75, 32, 74, 32, 75, 116, 33, 76, 32, 73, 32, 76, 106, 33, 77, 65, 24, 33, 78, 32, 4, 32, 78, 106, 33, 79, 32, 79, 33, 80, 32, 80, 41, 3, 0, 33, 91, 32, 77, 32, 91, 55, 3, 0, 65, 8, 33, 81, 32, 77, 32, 81, 106, 33, 82, 32, 80, 32, 81, 106, 33, 83, 32, 83, 41, 3, 0, 33, 92, 32, 82, 32, 92, 55, 3, 0, 11, 32, 4, 40, 2, 20, 33, 84, 65, 1, 33, 85, 32, 84, 32, 85, 106, 33, 86, 32, 4, 32, 86, 54, 2, 20, 12, 0, 11, 0, 11, 15, 11, 12, 0, 2, 64, 65, 1, 69, 13, 0, 16, 0, 11, 11, 7, 0, 63, 0, 65, 16, 116, 11, 5, 0, 65, 132, 8, 11, 4, 0, 65, 0, 11, 80, 1, 2, 127, 65, 0, 40, 2, 128, 8, 34, 1, 32, 0, 65, 3, 106, 65, 124, 113, 34, 2, 106, 33, 0, 2, 64, 2, 64, 32, 2, 69, 13, 0, 32, 0, 32, 1, 77, 13, 1, 11, 2, 64, 32, 0, 16, 5, 77, 13, 0, 32, 0, 16, 7, 69, 13, 1, 11, 65, 0, 32, 0, 54, 2, 128, 8, 32, 1, 15, 11, 16, 6, 65, 48, 54, 2, 0, 65, 127, 11, 253, 46, 1, 12, 127, 35, 0, 65, 16, 107, 34, 1, 36, 0, 2, 64, 2, 64, 2, 64, 2, 64, 2, 64, 2, 64, 2, 64, 2, 64, 2, 64, 2, 64, 2, 64, 2, 64, 2, 64, 32, 0, 65, 244, 1, 75, 13, 0, 2, 64, 65, 0, 40, 2, 136, 8, 34, 2, 65, 16, 32, 0, 65, 11, 106, 65, 120, 113, 32, 0, 65, 11, 73, 27, 34, 3, 65, 3, 118, 34, 4, 118, 34, 0, 65, 3, 113, 69, 13, 0, 32, 0, 65, 127, 115, 65, 1, 113, 32, 4, 106, 34, 5, 65, 3, 116, 34, 6, 65, 184, 8, 106, 40, 2, 0, 34, 4, 65, 8, 106, 33, 0, 2, 64, 2, 64, 32, 4, 40, 2, 8, 34, 3, 32, 6, 65, 176, 8, 106, 34, 6, 71, 13, 0, 65, 0, 32, 2, 65, 126, 32, 5, 119, 113, 54, 2, 136, 8, 12, 1, 11, 32, 3, 32, 6, 54, 2, 12, 32, 6, 32, 3, 54, 2, 8, 11, 32, 4, 32, 5, 65, 3, 116, 34, 5, 65, 3, 114, 54, 2, 4, 32, 4, 32, 5, 106, 34, 4, 32, 4, 40, 2, 4, 65, 1, 114, 54, 2, 4, 12, 13, 11, 32, 3, 65, 0, 40, 2, 144, 8, 34, 7, 77, 13, 1, 2, 64, 32, 0, 69, 13, 0, 2, 64, 2, 64, 32, 0, 32, 4, 116, 65, 2, 32, 4, 116, 34, 0, 65, 0, 32, 0, 107, 114, 113, 34, 0, 65, 0, 32, 0, 107, 113, 65, 127, 106, 34, 0, 32, 0, 65, 12, 118, 65, 16, 113, 34, 0, 118, 34, 4, 65, 5, 118, 65, 8, 113, 34, 5, 32, 0, 114, 32, 4, 32, 5, 118, 34, 0, 65, 2, 118, 65, 4, 113, 34, 4, 114, 32, 0, 32, 4, 118, 34, 0, 65, 1, 118, 65, 2, 113, 34, 4, 114, 32, 0, 32, 4, 118, 34, 0, 65, 1, 118, 65, 1, 113, 34, 4, 114, 32, 0, 32, 4, 118, 106, 34, 5, 65, 3, 116, 34, 6, 65, 184, 8, 106, 40, 2, 0, 34, 4, 40, 2, 8, 34, 0, 32, 6, 65, 176, 8, 106, 34, 6, 71, 13, 0, 65, 0, 32, 2, 65, 126, 32, 5, 119, 113, 34, 2, 54, 2, 136, 8, 12, 1, 11, 32, 0, 32, 6, 54, 2, 12, 32, 6, 32, 0, 54, 2, 8, 11, 32, 4, 65, 8, 106, 33, 0, 32, 4, 32, 3, 65, 3, 114, 54, 2, 4, 32, 4, 32, 3, 106, 34, 6, 32, 5, 65, 3, 116, 34, 8, 32, 3, 107, 34, 5, 65, 1, 114, 54, 2, 4, 32, 4, 32, 8, 106, 32, 5, 54, 2, 0, 2, 64, 32, 7, 69, 13, 0, 32, 7, 65, 3, 118, 34, 8, 65, 3, 116, 65, 176, 8, 106, 33, 3, 65, 0, 40, 2, 156, 8, 33, 4, 2, 64, 2, 64, 32, 2, 65, 1, 32, 8, 116, 34, 8, 113, 13, 0, 65, 0, 32, 2, 32, 8, 114, 54, 2, 136, 8, 32, 3, 33, 8, 12, 1, 11, 32, 3, 40, 2, 8, 33, 8, 11, 32, 3, 32, 4, 54, 2, 8, 32, 8, 32, 4, 54, 2, 12, 32, 4, 32, 3, 54, 2, 12, 32, 4, 32, 8, 54, 2, 8, 11, 65, 0, 32, 6, 54, 2, 156, 8, 65, 0, 32, 5, 54, 2, 144, 8, 12, 13, 11, 65, 0, 40, 2, 140, 8, 34, 9, 69, 13, 1, 32, 9, 65, 0, 32, 9, 107, 113, 65, 127, 106, 34, 0, 32, 0, 65, 12, 118, 65, 16, 113, 34, 0, 118, 34, 4, 65, 5, 118, 65, 8, 113, 34, 5, 32, 0, 114, 32, 4, 32, 5, 118, 34, 0, 65, 2, 118, 65, 4, 113, 34, 4, 114, 32, 0, 32, 4, 118, 34, 0, 65, 1, 118, 65, 2, 113, 34, 4, 114, 32, 0, 32, 4, 118, 34, 0, 65, 1, 118, 65, 1, 113, 34, 4, 114, 32, 0, 32, 4, 118, 106, 65, 2, 116, 65, 184, 10, 106, 40, 2, 0, 34, 6, 40, 2, 4, 65, 120, 113, 32, 3, 107, 33, 4, 32, 6, 33, 5, 2, 64, 3, 64, 2, 64, 32, 5, 40, 2, 16, 34, 0, 13, 0, 32, 5, 65, 20, 106, 40, 2, 0, 34, 0, 69, 13, 2, 11, 32, 0, 40, 2, 4, 65, 120, 113, 32, 3, 107, 34, 5, 32, 4, 32, 5, 32, 4, 73, 34, 5, 27, 33, 4, 32, 0, 32, 6, 32, 5, 27, 33, 6, 32, 0, 33, 5, 12, 0, 11, 0, 11, 32, 6, 32, 3, 106, 34, 10, 32, 6, 77, 13, 2, 32, 6, 40, 2, 24, 33, 11, 2, 64, 32, 6, 40, 2, 12, 34, 8, 32, 6, 70, 13, 0, 65, 0, 40, 2, 152, 8, 32, 6, 40, 2, 8, 34, 0, 75, 26, 32, 0, 32, 8, 54, 2, 12, 32, 8, 32, 0, 54, 2, 8, 12, 12, 11, 2, 64, 32, 6, 65, 20, 106, 34, 5, 40, 2, 0, 34, 0, 13, 0, 32, 6, 40, 2, 16, 34, 0, 69, 13, 4, 32, 6, 65, 16, 106, 33, 5, 11, 3, 64, 32, 5, 33, 12, 32, 0, 34, 8, 65, 20, 106, 34, 5, 40, 2, 0, 34, 0, 13, 0, 32, 8, 65, 16, 106, 33, 5, 32, 8, 40, 2, 16, 34, 0, 13, 0, 11, 32, 12, 65, 0, 54, 2, 0, 12, 11, 11, 65, 127, 33, 3, 32, 0, 65, 191, 127, 75, 13, 0, 32, 0, 65, 11, 106, 34, 0, 65, 120, 113, 33, 3, 65, 0, 40, 2, 140, 8, 34, 7, 69, 13, 0, 65, 31, 33, 12, 2, 64, 32, 3, 65, 255, 255, 255, 7, 75, 13, 0, 32, 0, 65, 8, 118, 34, 0, 32, 0, 65, 128, 254, 63, 106, 65, 16, 118, 65, 8, 113, 34, 0, 116, 34, 4, 32, 4, 65, 128, 224, 31, 106, 65, 16, 118, 65, 4, 113, 34, 4, 116, 34, 5, 32, 5, 65, 128, 128, 15, 106, 65, 16, 118, 65, 2, 113, 34, 5, 116, 65, 15, 118, 32, 0, 32, 4, 114, 32, 5, 114, 107, 34, 0, 65, 1, 116, 32, 3, 32, 0, 65, 21, 106, 118, 65, 1, 113, 114, 65, 28, 106, 33, 12, 11, 65, 0, 32, 3, 107, 33, 4, 2, 64, 2, 64, 2, 64, 2, 64, 32, 12, 65, 2, 116, 65, 184, 10, 106, 40, 2, 0, 34, 5, 13, 0, 65, 0, 33, 0, 65, 0, 33, 8, 12, 1, 11, 65, 0, 33, 0, 32, 3, 65, 0, 65, 25, 32, 12, 65, 1, 118, 107, 32, 12, 65, 31, 70, 27, 116, 33, 6, 65, 0, 33, 8, 3, 64, 2, 64, 32, 5, 40, 2, 4, 65, 120, 113, 32, 3, 107, 34, 2, 32, 4, 79, 13, 0, 32, 2, 33, 4, 32, 5, 33, 8, 32, 2, 13, 0, 65, 0, 33, 4, 32, 5, 33, 8, 32, 5, 33, 0, 12, 3, 11, 32, 0, 32, 5, 65, 20, 106, 40, 2, 0, 34, 2, 32, 2, 32, 5, 32, 6, 65, 29, 118, 65, 4, 113, 106, 65, 16, 106, 40, 2, 0, 34, 5, 70, 27, 32, 0, 32, 2, 27, 33, 0, 32, 6, 65, 1, 116, 33, 6, 32, 5, 13, 0, 11, 11, 2, 64, 32, 0, 32, 8, 114, 13, 0, 65, 2, 32, 12, 116, 34, 0, 65, 0, 32, 0, 107, 114, 32, 7, 113, 34, 0, 69, 13, 3, 32, 0, 65, 0, 32, 0, 107, 113, 65, 127, 106, 34, 0, 32, 0, 65, 12, 118, 65, 16, 113, 34, 0, 118, 34, 5, 65, 5, 118, 65, 8, 113, 34, 6, 32, 0, 114, 32, 5, 32, 6, 118, 34, 0, 65, 2, 118, 65, 4, 113, 34, 5, 114, 32, 0, 32, 5, 118, 34, 0, 65, 1, 118, 65, 2, 113, 34, 5, 114, 32, 0, 32, 5, 118, 34, 0, 65, 1, 118, 65, 1, 113, 34, 5, 114, 32, 0, 32, 5, 118, 106, 65, 2, 116, 65, 184, 10, 106, 40, 2, 0, 33, 0, 11, 32, 0, 69, 13, 1, 11, 3, 64, 32, 0, 40, 2, 4, 65, 120, 113, 32, 3, 107, 34, 2, 32, 4, 73, 33, 6, 2, 64, 32, 0, 40, 2, 16, 34, 5, 13, 0, 32, 0, 65, 20, 106, 40, 2, 0, 33, 5, 11, 32, 2, 32, 4, 32, 6, 27, 33, 4, 32, 0, 32, 8, 32, 6, 27, 33, 8, 32, 5, 33, 0, 32, 5, 13, 0, 11, 11, 32, 8, 69, 13, 0, 32, 4, 65, 0, 40, 2, 144, 8, 32, 3, 107, 79, 13, 0, 32, 8, 32, 3, 106, 34, 12, 32, 8, 77, 13, 1, 32, 8, 40, 2, 24, 33, 9, 2, 64, 32, 8, 40, 2, 12, 34, 6, 32, 8, 70, 13, 0, 65, 0, 40, 2, 152, 8, 32, 8, 40, 2, 8, 34, 0, 75, 26, 32, 0, 32, 6, 54, 2, 12, 32, 6, 32, 0, 54, 2, 8, 12, 10, 11, 2, 64, 32, 8, 65, 20, 106, 34, 5, 40, 2, 0, 34, 0, 13, 0, 32, 8, 40, 2, 16, 34, 0, 69, 13, 4, 32, 8, 65, 16, 106, 33, 5, 11, 3, 64, 32, 5, 33, 2, 32, 0, 34, 6, 65, 20, 106, 34, 5, 40, 2, 0, 34, 0, 13, 0, 32, 6, 65, 16, 106, 33, 5, 32, 6, 40, 2, 16, 34, 0, 13, 0, 11, 32, 2, 65, 0, 54, 2, 0, 12, 9, 11, 2, 64, 65, 0, 40, 2, 144, 8, 34, 0, 32, 3, 73, 13, 0, 65, 0, 40, 2, 156, 8, 33, 4, 2, 64, 2, 64, 32, 0, 32, 3, 107, 34, 5, 65, 16, 73, 13, 0, 65, 0, 32, 5, 54, 2, 144, 8, 65, 0, 32, 4, 32, 3, 106, 34, 6, 54, 2, 156, 8, 32, 6, 32, 5, 65, 1, 114, 54, 2, 4, 32, 4, 32, 0, 106, 32, 5, 54, 2, 0, 32, 4, 32, 3, 65, 3, 114, 54, 2, 4, 12, 1, 11, 65, 0, 65, 0, 54, 2, 156, 8, 65, 0, 65, 0, 54, 2, 144, 8, 32, 4, 32, 0, 65, 3, 114, 54, 2, 4, 32, 4, 32, 0, 106, 34, 0, 32, 0, 40, 2, 4, 65, 1, 114, 54, 2, 4, 11, 32, 4, 65, 8, 106, 33, 0, 12, 11, 11, 2, 64, 65, 0, 40, 2, 148, 8, 34, 6, 32, 3, 77, 13, 0, 65, 0, 32, 6, 32, 3, 107, 34, 4, 54, 2, 148, 8, 65, 0, 65, 0, 40, 2, 160, 8, 34, 0, 32, 3, 106, 34, 5, 54, 2, 160, 8, 32, 5, 32, 4, 65, 1, 114, 54, 2, 4, 32, 0, 32, 3, 65, 3, 114, 54, 2, 4, 32, 0, 65, 8, 106, 33, 0, 12, 11, 11, 2, 64, 2, 64, 65, 0, 40, 2, 224, 11, 69, 13, 0, 65, 0, 40, 2, 232, 11, 33, 4, 12, 1, 11, 65, 0, 66, 127, 55, 2, 236, 11, 65, 0, 66, 128, 160, 128, 128, 128, 128, 4, 55, 2, 228, 11, 65, 0, 32, 1, 65, 12, 106, 65, 112, 113, 65, 216, 170, 213, 170, 5, 115, 54, 2, 224, 11, 65, 0, 65, 0, 54, 2, 244, 11, 65, 0, 65, 0, 54, 2, 196, 11, 65, 128, 32, 33, 4, 11, 65, 0, 33, 0, 32, 4, 32, 3, 65, 47, 106, 34, 7, 106, 34, 2, 65, 0, 32, 4, 107, 34, 12, 113, 34, 8, 32, 3, 77, 13, 10, 65, 0, 33, 0, 2, 64, 65, 0, 40, 2, 192, 11, 34, 4, 69, 13, 0, 65, 0, 40, 2, 184, 11, 34, 5, 32, 8, 106, 34, 9, 32, 5, 77, 13, 11, 32, 9, 32, 4, 75, 13, 11, 11, 65, 0, 45, 0, 196, 11, 65, 4, 113, 13, 5, 2, 64, 2, 64, 2, 64, 65, 0, 40, 2, 160, 8, 34, 4, 69, 13, 0, 65, 200, 11, 33, 0, 3, 64, 2, 64, 32, 0, 40, 2, 0, 34, 5, 32, 4, 75, 13, 0, 32, 5, 32, 0, 40, 2, 4, 106, 32, 4, 75, 13, 3, 11, 32, 0, 40, 2, 8, 34, 0, 13, 0, 11, 11, 65, 0, 16, 8, 34, 6, 65, 127, 70, 13, 6, 32, 8, 33, 2, 2, 64, 65, 0, 40, 2, 228, 11, 34, 0, 65, 127, 106, 34, 4, 32, 6, 113, 69, 13, 0, 32, 8, 32, 6, 107, 32, 4, 32, 6, 106, 65, 0, 32, 0, 107, 113, 106, 33, 2, 11, 32, 2, 32, 3, 77, 13, 6, 32, 2, 65, 254, 255, 255, 255, 7, 75, 13, 6, 2, 64, 65, 0, 40, 2, 192, 11, 34, 0, 69, 13, 0, 65, 0, 40, 2, 184, 11, 34, 4, 32, 2, 106, 34, 5, 32, 4, 77, 13, 7, 32, 5, 32, 0, 75, 13, 7, 11, 32, 2, 16, 8, 34, 0, 32, 6, 71, 13, 1, 12, 8, 11, 32, 2, 32, 6, 107, 32, 12, 113, 34, 2, 65, 254, 255, 255, 255, 7, 75, 13, 5, 32, 2, 16, 8, 34, 6, 32, 0, 40, 2, 0, 32, 0, 40, 2, 4, 106, 70, 13, 4, 32, 6, 33, 0, 11, 2, 64, 32, 3, 65, 48, 106, 32, 2, 77, 13, 0, 32, 0, 65, 127, 70, 13, 0, 2, 64, 32, 7, 32, 2, 107, 65, 0, 40, 2, 232, 11, 34, 4, 106, 65, 0, 32, 4, 107, 113, 34, 4, 65, 254, 255, 255, 255, 7, 77, 13, 0, 32, 0, 33, 6, 12, 8, 11, 2, 64, 32, 4, 16, 8, 65, 127, 70, 13, 0, 32, 4, 32, 2, 106, 33, 2, 32, 0, 33, 6, 12, 8, 11, 65, 0, 32, 2, 107, 16, 8, 26, 12, 5, 11, 32, 0, 33, 6, 32, 0, 65, 127, 71, 13, 6, 12, 4, 11, 0, 11, 65, 0, 33, 8, 12, 7, 11, 65, 0, 33, 6, 12, 5, 11, 32, 6, 65, 127, 71, 13, 2, 11, 65, 0, 65, 0, 40, 2, 196, 11, 65, 4, 114, 54, 2, 196, 11, 11, 32, 8, 65, 254, 255, 255, 255, 7, 75, 13, 1, 32, 8, 16, 8, 33, 6, 65, 0, 16, 8, 33, 0, 32, 6, 65, 127, 70, 13, 1, 32, 0, 65, 127, 70, 13, 1, 32, 6, 32, 0, 79, 13, 1, 32, 0, 32, 6, 107, 34, 2, 32, 3, 65, 40, 106, 77, 13, 1, 11, 65, 0, 65, 0, 40, 2, 184, 11, 32, 2, 106, 34, 0, 54, 2, 184, 11, 2, 64, 32, 0, 65, 0, 40, 2, 188, 11, 77, 13, 0, 65, 0, 32, 0, 54, 2, 188, 11, 11, 2, 64, 2, 64, 2, 64, 2, 64, 65, 0, 40, 2, 160, 8, 34, 4, 69, 13, 0, 65, 200, 11, 33, 0, 3, 64, 32, 6, 32, 0, 40, 2, 0, 34, 5, 32, 0, 40, 2, 4, 34, 8, 106, 70, 13, 2, 32, 0, 40, 2, 8, 34, 0, 13, 0, 12, 3, 11, 0, 11, 2, 64, 2, 64, 65, 0, 40, 2, 152, 8, 34, 0, 69, 13, 0, 32, 6, 32, 0, 79, 13, 1, 11, 65, 0, 32, 6, 54, 2, 152, 8, 11, 65, 0, 33, 0, 65, 0, 32, 2, 54, 2, 204, 11, 65, 0, 32, 6, 54, 2, 200, 11, 65, 0, 65, 127, 54, 2, 168, 8, 65, 0, 65, 0, 40, 2, 224, 11, 54, 2, 172, 8, 65, 0, 65, 0, 54, 2, 212, 11, 3, 64, 32, 0, 65, 3, 116, 34, 4, 65, 184, 8, 106, 32, 4, 65, 176, 8, 106, 34, 5, 54, 2, 0, 32, 4, 65, 188, 8, 106, 32, 5, 54, 2, 0, 32, 0, 65, 1, 106, 34, 0, 65, 32, 71, 13, 0, 11, 65, 0, 32, 2, 65, 88, 106, 34, 0, 65, 120, 32, 6, 107, 65, 7, 113, 65, 0, 32, 6, 65, 8, 106, 65, 7, 113, 27, 34, 4, 107, 34, 5, 54, 2, 148, 8, 65, 0, 32, 6, 32, 4, 106, 34, 4, 54, 2, 160, 8, 32, 4, 32, 5, 65, 1, 114, 54, 2, 4, 32, 6, 32, 0, 106, 65, 40, 54, 2, 4, 65, 0, 65, 0, 40, 2, 240, 11, 54, 2, 164, 8, 12, 2, 11, 32, 6, 32, 4, 77, 13, 0, 32, 0, 40, 2, 12, 65, 8, 113, 13, 0, 32, 5, 32, 4, 75, 13, 0, 32, 0, 32, 8, 32, 2, 106, 54, 2, 4, 65, 0, 32, 4, 65, 120, 32, 4, 107, 65, 7, 113, 65, 0, 32, 4, 65, 8, 106, 65, 7, 113, 27, 34, 0, 106, 34, 5, 54, 2, 160, 8, 65, 0, 65, 0, 40, 2, 148, 8, 32, 2, 106, 34, 6, 32, 0, 107, 34, 0, 54, 2, 148, 8, 32, 5, 32, 0, 65, 1, 114, 54, 2, 4, 32, 4, 32, 6, 106, 65, 40, 54, 2, 4, 65, 0, 65, 0, 40, 2, 240, 11, 54, 2, 164, 8, 12, 1, 11, 2, 64, 32, 6, 65, 0, 40, 2, 152, 8, 34, 8, 79, 13, 0, 65, 0, 32, 6, 54, 2, 152, 8, 32, 6, 33, 8, 11, 32, 6, 32, 2, 106, 33, 5, 65, 200, 11, 33, 0, 2, 64, 2, 64, 2, 64, 2, 64, 2, 64, 2, 64, 2, 64, 3, 64, 32, 0, 40, 2, 0, 32, 5, 70, 13, 1, 32, 0, 40, 2, 8, 34, 0, 13, 0, 12, 2, 11, 0, 11, 32, 0, 45, 0, 12, 65, 8, 113, 69, 13, 1, 11, 65, 200, 11, 33, 0, 3, 64, 2, 64, 32, 0, 40, 2, 0, 34, 5, 32, 4, 75, 13, 0, 32, 5, 32, 0, 40, 2, 4, 106, 34, 5, 32, 4, 75, 13, 3, 11, 32, 0, 40, 2, 8, 33, 0, 12, 0, 11, 0, 11, 32, 0, 32, 6, 54, 2, 0, 32, 0, 32, 0, 40, 2, 4, 32, 2, 106, 54, 2, 4, 32, 6, 65, 120, 32, 6, 107, 65, 7, 113, 65, 0, 32, 6, 65, 8, 106, 65, 7, 113, 27, 106, 34, 12, 32, 3, 65, 3, 114, 54, 2, 4, 32, 5, 65, 120, 32, 5, 107, 65, 7, 113, 65, 0, 32, 5, 65, 8, 106, 65, 7, 113, 27, 106, 34, 2, 32, 12, 32, 3, 106, 34, 3, 107, 33, 5, 2, 64, 32, 4, 32, 2, 71, 13, 0, 65, 0, 32, 3, 54, 2, 160, 8, 65, 0, 65, 0, 40, 2, 148, 8, 32, 5, 106, 34, 0, 54, 2, 148, 8, 32, 3, 32, 0, 65, 1, 114, 54, 2, 4, 12, 3, 11, 2, 64, 65, 0, 40, 2, 156, 8, 32, 2, 71, 13, 0, 65, 0, 32, 3, 54, 2, 156, 8, 65, 0, 65, 0, 40, 2, 144, 8, 32, 5, 106, 34, 0, 54, 2, 144, 8, 32, 3, 32, 0, 65, 1, 114, 54, 2, 4, 32, 3, 32, 0, 106, 32, 0, 54, 2, 0, 12, 3, 11, 2, 64, 32, 2, 40, 2, 4, 34, 0, 65, 3, 113, 65, 1, 71, 13, 0, 32, 0, 65, 120, 113, 33, 7, 2, 64, 2, 64, 32, 0, 65, 255, 1, 75, 13, 0, 32, 2, 40, 2, 8, 34, 4, 32, 0, 65, 3, 118, 34, 8, 65, 3, 116, 65, 176, 8, 106, 34, 6, 70, 26, 2, 64, 32, 2, 40, 2, 12, 34, 0, 32, 4, 71, 13, 0, 65, 0, 65, 0, 40, 2, 136, 8, 65, 126, 32, 8, 119, 113, 54, 2, 136, 8, 12, 2, 11, 32, 0, 32, 6, 70, 26, 32, 4, 32, 0, 54, 2, 12, 32, 0, 32, 4, 54, 2, 8, 12, 1, 11, 32, 2, 40, 2, 24, 33, 9, 2, 64, 2, 64, 32, 2, 40, 2, 12, 34, 6, 32, 2, 70, 13, 0, 32, 8, 32, 2, 40, 2, 8, 34, 0, 75, 26, 32, 0, 32, 6, 54, 2, 12, 32, 6, 32, 0, 54, 2, 8, 12, 1, 11, 2, 64, 32, 2, 65, 20, 106, 34, 0, 40, 2, 0, 34, 4, 13, 0, 32, 2, 65, 16, 106, 34, 0, 40, 2, 0, 34, 4, 13, 0, 65, 0, 33, 6, 12, 1, 11, 3, 64, 32, 0, 33, 8, 32, 4, 34, 6, 65, 20, 106, 34, 0, 40, 2, 0, 34, 4, 13, 0, 32, 6, 65, 16, 106, 33, 0, 32, 6, 40, 2, 16, 34, 4, 13, 0, 11, 32, 8, 65, 0, 54, 2, 0, 11, 32, 9, 69, 13, 0, 2, 64, 2, 64, 32, 2, 40, 2, 28, 34, 4, 65, 2, 116, 65, 184, 10, 106, 34, 0, 40, 2, 0, 32, 2, 71, 13, 0, 32, 0, 32, 6, 54, 2, 0, 32, 6, 13, 1, 65, 0, 65, 0, 40, 2, 140, 8, 65, 126, 32, 4, 119, 113, 54, 2, 140, 8, 12, 2, 11, 32, 9, 65, 16, 65, 20, 32, 9, 40, 2, 16, 32, 2, 70, 27, 106, 32, 6, 54, 2, 0, 32, 6, 69, 13, 1, 11, 32, 6, 32, 9, 54, 2, 24, 2, 64, 32, 2, 40, 2, 16, 34, 0, 69, 13, 0, 32, 6, 32, 0, 54, 2, 16, 32, 0, 32, 6, 54, 2, 24, 11, 32, 2, 40, 2, 20, 34, 0, 69, 13, 0, 32, 6, 65, 20, 106, 32, 0, 54, 2, 0, 32, 0, 32, 6, 54, 2, 24, 11, 32, 7, 32, 5, 106, 33, 5, 32, 2, 32, 7, 106, 33, 2, 11, 32, 2, 32, 2, 40, 2, 4, 65, 126, 113, 54, 2, 4, 32, 3, 32, 5, 65, 1, 114, 54, 2, 4, 32, 3, 32, 5, 106, 32, 5, 54, 2, 0, 2, 64, 32, 5, 65, 255, 1, 75, 13, 0, 32, 5, 65, 3, 118, 34, 4, 65, 3, 116, 65, 176, 8, 106, 33, 0, 2, 64, 2, 64, 65, 0, 40, 2, 136, 8, 34, 5, 65, 1, 32, 4, 116, 34, 4, 113, 13, 0, 65, 0, 32, 5, 32, 4, 114, 54, 2, 136, 8, 32, 0, 33, 4, 12, 1, 11, 32, 0, 40, 2, 8, 33, 4, 11, 32, 0, 32, 3, 54, 2, 8, 32, 4, 32, 3, 54, 2, 12, 32, 3, 32, 0, 54, 2, 12, 32, 3, 32, 4, 54, 2, 8, 12, 3, 11, 65, 31, 33, 0, 2, 64, 32, 5, 65, 255, 255, 255, 7, 75, 13, 0, 32, 5, 65, 8, 118, 34, 0, 32, 0, 65, 128, 254, 63, 106, 65, 16, 118, 65, 8, 113, 34, 0, 116, 34, 4, 32, 4, 65, 128, 224, 31, 106, 65, 16, 118, 65, 4, 113, 34, 4, 116, 34, 6, 32, 6, 65, 128, 128, 15, 106, 65, 16, 118, 65, 2, 113, 34, 6, 116, 65, 15, 118, 32, 0, 32, 4, 114, 32, 6, 114, 107, 34, 0, 65, 1, 116, 32, 5, 32, 0, 65, 21, 106, 118, 65, 1, 113, 114, 65, 28, 106, 33, 0, 11, 32, 3, 32, 0, 54, 2, 28, 32, 3, 66, 0, 55, 2, 16, 32, 0, 65, 2, 116, 65, 184, 10, 106, 33, 4, 2, 64, 2, 64, 65, 0, 40, 2, 140, 8, 34, 6, 65, 1, 32, 0, 116, 34, 8, 113, 13, 0, 65, 0, 32, 6, 32, 8, 114, 54, 2, 140, 8, 32, 4, 32, 3, 54, 2, 0, 32, 3, 32, 4, 54, 2, 24, 12, 1, 11, 32, 5, 65, 0, 65, 25, 32, 0, 65, 1, 118, 107, 32, 0, 65, 31, 70, 27, 116, 33, 0, 32, 4, 40, 2, 0, 33, 6, 3, 64, 32, 6, 34, 4, 40, 2, 4, 65, 120, 113, 32, 5, 70, 13, 3, 32, 0, 65, 29, 118, 33, 6, 32, 0, 65, 1, 116, 33, 0, 32, 4, 32, 6, 65, 4, 113, 106, 65, 16, 106, 34, 8, 40, 2, 0, 34, 6, 13, 0, 11, 32, 8, 32, 3, 54, 2, 0, 32, 3, 32, 4, 54, 2, 24, 11, 32, 3, 32, 3, 54, 2, 12, 32, 3, 32, 3, 54, 2, 8, 12, 2, 11, 65, 0, 32, 2, 65, 88, 106, 34, 0, 65, 120, 32, 6, 107, 65, 7, 113, 65, 0, 32, 6, 65, 8, 106, 65, 7, 113, 27, 34, 8, 107, 34, 12, 54, 2, 148, 8, 65, 0, 32, 6, 32, 8, 106, 34, 8, 54, 2, 160, 8, 32, 8, 32, 12, 65, 1, 114, 54, 2, 4, 32, 6, 32, 0, 106, 65, 40, 54, 2, 4, 65, 0, 65, 0, 40, 2, 240, 11, 54, 2, 164, 8, 32, 4, 32, 5, 65, 39, 32, 5, 107, 65, 7, 113, 65, 0, 32, 5, 65, 89, 106, 65, 7, 113, 27, 106, 65, 81, 106, 34, 0, 32, 0, 32, 4, 65, 16, 106, 73, 27, 34, 8, 65, 27, 54, 2, 4, 32, 8, 65, 16, 106, 65, 0, 41, 2, 208, 11, 55, 2, 0, 32, 8, 65, 0, 41, 2, 200, 11, 55, 2, 8, 65, 0, 32, 8, 65, 8, 106, 54, 2, 208, 11, 65, 0, 32, 2, 54, 2, 204, 11, 65, 0, 32, 6, 54, 2, 200, 11, 65, 0, 65, 0, 54, 2, 212, 11, 32, 8, 65, 24, 106, 33, 0, 3, 64, 32, 0, 65, 7, 54, 2, 4, 32, 0, 65, 8, 106, 33, 6, 32, 0, 65, 4, 106, 33, 0, 32, 5, 32, 6, 75, 13, 0, 11, 32, 8, 32, 4, 70, 13, 3, 32, 8, 32, 8, 40, 2, 4, 65, 126, 113, 54, 2, 4, 32, 4, 32, 8, 32, 4, 107, 34, 2, 65, 1, 114, 54, 2, 4, 32, 8, 32, 2, 54, 2, 0, 2, 64, 32, 2, 65, 255, 1, 75, 13, 0, 32, 2, 65, 3, 118, 34, 5, 65, 3, 116, 65, 176, 8, 106, 33, 0, 2, 64, 2, 64, 65, 0, 40, 2, 136, 8, 34, 6, 65, 1, 32, 5, 116, 34, 5, 113, 13, 0, 65, 0, 32, 6, 32, 5, 114, 54, 2, 136, 8, 32, 0, 33, 5, 12, 1, 11, 32, 0, 40, 2, 8, 33, 5, 11, 32, 0, 32, 4, 54, 2, 8, 32, 5, 32, 4, 54, 2, 12, 32, 4, 32, 0, 54, 2, 12, 32, 4, 32, 5, 54, 2, 8, 12, 4, 11, 65, 31, 33, 0, 2, 64, 32, 2, 65, 255, 255, 255, 7, 75, 13, 0, 32, 2, 65, 8, 118, 34, 0, 32, 0, 65, 128, 254, 63, 106, 65, 16, 118, 65, 8, 113, 34, 0, 116, 34, 5, 32, 5, 65, 128, 224, 31, 106, 65, 16, 118, 65, 4, 113, 34, 5, 116, 34, 6, 32, 6, 65, 128, 128, 15, 106, 65, 16, 118, 65, 2, 113, 34, 6, 116, 65, 15, 118, 32, 0, 32, 5, 114, 32, 6, 114, 107, 34, 0, 65, 1, 116, 32, 2, 32, 0, 65, 21, 106, 118, 65, 1, 113, 114, 65, 28, 106, 33, 0, 11, 32, 4, 66, 0, 55, 2, 16, 32, 4, 65, 28, 106, 32, 0, 54, 2, 0, 32, 0, 65, 2, 116, 65, 184, 10, 106, 33, 5, 2, 64, 2, 64, 65, 0, 40, 2, 140, 8, 34, 6, 65, 1, 32, 0, 116, 34, 8, 113, 13, 0, 65, 0, 32, 6, 32, 8, 114, 54, 2, 140, 8, 32, 5, 32, 4, 54, 2, 0, 32, 4, 65, 24, 106, 32, 5, 54, 2, 0, 12, 1, 11, 32, 2, 65, 0, 65, 25, 32, 0, 65, 1, 118, 107, 32, 0, 65, 31, 70, 27, 116, 33, 0, 32, 5, 40, 2, 0, 33, 6, 3, 64, 32, 6, 34, 5, 40, 2, 4, 65, 120, 113, 32, 2, 70, 13, 4, 32, 0, 65, 29, 118, 33, 6, 32, 0, 65, 1, 116, 33, 0, 32, 5, 32, 6, 65, 4, 113, 106, 65, 16, 106, 34, 8, 40, 2, 0, 34, 6, 13, 0, 11, 32, 8, 32, 4, 54, 2, 0, 32, 4, 65, 24, 106, 32, 5, 54, 2, 0, 11, 32, 4, 32, 4, 54, 2, 12, 32, 4, 32, 4, 54, 2, 8, 12, 3, 11, 32, 4, 40, 2, 8, 34, 0, 32, 3, 54, 2, 12, 32, 4, 32, 3, 54, 2, 8, 32, 3, 65, 0, 54, 2, 24, 32, 3, 32, 4, 54, 2, 12, 32, 3, 32, 0, 54, 2, 8, 11, 32, 12, 65, 8, 106, 33, 0, 12, 5, 11, 32, 5, 40, 2, 8, 34, 0, 32, 4, 54, 2, 12, 32, 5, 32, 4, 54, 2, 8, 32, 4, 65, 24, 106, 65, 0, 54, 2, 0, 32, 4, 32, 5, 54, 2, 12, 32, 4, 32, 0, 54, 2, 8, 11, 65, 0, 40, 2, 148, 8, 34, 0, 32, 3, 77, 13, 0, 65, 0, 32, 0, 32, 3, 107, 34, 4, 54, 2, 148, 8, 65, 0, 65, 0, 40, 2, 160, 8, 34, 0, 32, 3, 106, 34, 5, 54, 2, 160, 8, 32, 5, 32, 4, 65, 1, 114, 54, 2, 4, 32, 0, 32, 3, 65, 3, 114, 54, 2, 4, 32, 0, 65, 8, 106, 33, 0, 12, 3, 11, 16, 6, 65, 48, 54, 2, 0, 65, 0, 33, 0, 12, 2, 11, 2, 64, 32, 9, 69, 13, 0, 2, 64, 2, 64, 32, 8, 32, 8, 40, 2, 28, 34, 5, 65, 2, 116, 65, 184, 10, 106, 34, 0, 40, 2, 0, 71, 13, 0, 32, 0, 32, 6, 54, 2, 0, 32, 6, 13, 1, 65, 0, 32, 7, 65, 126, 32, 5, 119, 113, 34, 7, 54, 2, 140, 8, 12, 2, 11, 32, 9, 65, 16, 65, 20, 32, 9, 40, 2, 16, 32, 8, 70, 27, 106, 32, 6, 54, 2, 0, 32, 6, 69, 13, 1, 11, 32, 6, 32, 9, 54, 2, 24, 2, 64, 32, 8, 40, 2, 16, 34, 0, 69, 13, 0, 32, 6, 32, 0, 54, 2, 16, 32, 0, 32, 6, 54, 2, 24, 11, 32, 8, 65, 20, 106, 40, 2, 0, 34, 0, 69, 13, 0, 32, 6, 65, 20, 106, 32, 0, 54, 2, 0, 32, 0, 32, 6, 54, 2, 24, 11, 2, 64, 2, 64, 32, 4, 65, 15, 75, 13, 0, 32, 8, 32, 4, 32, 3, 106, 34, 0, 65, 3, 114, 54, 2, 4, 32, 8, 32, 0, 106, 34, 0, 32, 0, 40, 2, 4, 65, 1, 114, 54, 2, 4, 12, 1, 11, 32, 8, 32, 3, 65, 3, 114, 54, 2, 4, 32, 12, 32, 4, 65, 1, 114, 54, 2, 4, 32, 12, 32, 4, 106, 32, 4, 54, 2, 0, 2, 64, 32, 4, 65, 255, 1, 75, 13, 0, 32, 4, 65, 3, 118, 34, 4, 65, 3, 116, 65, 176, 8, 106, 33, 0, 2, 64, 2, 64, 65, 0, 40, 2, 136, 8, 34, 5, 65, 1, 32, 4, 116, 34, 4, 113, 13, 0, 65, 0, 32, 5, 32, 4, 114, 54, 2, 136, 8, 32, 0, 33, 4, 12, 1, 11, 32, 0, 40, 2, 8, 33, 4, 11, 32, 0, 32, 12, 54, 2, 8, 32, 4, 32, 12, 54, 2, 12, 32, 12, 32, 0, 54, 2, 12, 32, 12, 32, 4, 54, 2, 8, 12, 1, 11, 65, 31, 33, 0, 2, 64, 32, 4, 65, 255, 255, 255, 7, 75, 13, 0, 32, 4, 65, 8, 118, 34, 0, 32, 0, 65, 128, 254, 63, 106, 65, 16, 118, 65, 8, 113, 34, 0, 116, 34, 5, 32, 5, 65, 128, 224, 31, 106, 65, 16, 118, 65, 4, 113, 34, 5, 116, 34, 3, 32, 3, 65, 128, 128, 15, 106, 65, 16, 118, 65, 2, 113, 34, 3, 116, 65, 15, 118, 32, 0, 32, 5, 114, 32, 3, 114, 107, 34, 0, 65, 1, 116, 32, 4, 32, 0, 65, 21, 106, 118, 65, 1, 113, 114, 65, 28, 106, 33, 0, 11, 32, 12, 32, 0, 54, 2, 28, 32, 12, 66, 0, 55, 2, 16, 32, 0, 65, 2, 116, 65, 184, 10, 106, 33, 5, 2, 64, 2, 64, 2, 64, 32, 7, 65, 1, 32, 0, 116, 34, 3, 113, 13, 0, 65, 0, 32, 7, 32, 3, 114, 54, 2, 140, 8, 32, 5, 32, 12, 54, 2, 0, 32, 12, 32, 5, 54, 2, 24, 12, 1, 11, 32, 4, 65, 0, 65, 25, 32, 0, 65, 1, 118, 107, 32, 0, 65, 31, 70, 27, 116, 33, 0, 32, 5, 40, 2, 0, 33, 3, 3, 64, 32, 3, 34, 5, 40, 2, 4, 65, 120, 113, 32, 4, 70, 13, 2, 32, 0, 65, 29, 118, 33, 3, 32, 0, 65, 1, 116, 33, 0, 32, 5, 32, 3, 65, 4, 113, 106, 65, 16, 106, 34, 6, 40, 2, 0, 34, 3, 13, 0, 11, 32, 6, 32, 12, 54, 2, 0, 32, 12, 32, 5, 54, 2, 24, 11, 32, 12, 32, 12, 54, 2, 12, 32, 12, 32, 12, 54, 2, 8, 12, 1, 11, 32, 5, 40, 2, 8, 34, 0, 32, 12, 54, 2, 12, 32, 5, 32, 12, 54, 2, 8, 32, 12, 65, 0, 54, 2, 24, 32, 12, 32, 5, 54, 2, 12, 32, 12, 32, 0, 54, 2, 8, 11, 32, 8, 65, 8, 106, 33, 0, 12, 1, 11, 2, 64, 32, 11, 69, 13, 0, 2, 64, 2, 64, 32, 6, 32, 6, 40, 2, 28, 34, 5, 65, 2, 116, 65, 184, 10, 106, 34, 0, 40, 2, 0, 71, 13, 0, 32, 0, 32, 8, 54, 2, 0, 32, 8, 13, 1, 65, 0, 32, 9, 65, 126, 32, 5, 119, 113, 54, 2, 140, 8, 12, 2, 11, 32, 11, 65, 16, 65, 20, 32, 11, 40, 2, 16, 32, 6, 70, 27, 106, 32, 8, 54, 2, 0, 32, 8, 69, 13, 1, 11, 32, 8, 32, 11, 54, 2, 24, 2, 64, 32, 6, 40, 2, 16, 34, 0, 69, 13, 0, 32, 8, 32, 0, 54, 2, 16, 32, 0, 32, 8, 54, 2, 24, 11, 32, 6, 65, 20, 106, 40, 2, 0, 34, 0, 69, 13, 0, 32, 8, 65, 20, 106, 32, 0, 54, 2, 0, 32, 0, 32, 8, 54, 2, 24, 11, 2, 64, 2, 64, 32, 4, 65, 15, 75, 13, 0, 32, 6, 32, 4, 32, 3, 106, 34, 0, 65, 3, 114, 54, 2, 4, 32, 6, 32, 0, 106, 34, 0, 32, 0, 40, 2, 4, 65, 1, 114, 54, 2, 4, 12, 1, 11, 32, 6, 32, 3, 65, 3, 114, 54, 2, 4, 32, 10, 32, 4, 65, 1, 114, 54, 2, 4, 32, 10, 32, 4, 106, 32, 4, 54, 2, 0, 2, 64, 32, 7, 69, 13, 0, 32, 7, 65, 3, 118, 34, 3, 65, 3, 116, 65, 176, 8, 106, 33, 5, 65, 0, 40, 2, 156, 8, 33, 0, 2, 64, 2, 64, 65, 1, 32, 3, 116, 34, 3, 32, 2, 113, 13, 0, 65, 0, 32, 3, 32, 2, 114, 54, 2, 136, 8, 32, 5, 33, 3, 12, 1, 11, 32, 5, 40, 2, 8, 33, 3, 11, 32, 5, 32, 0, 54, 2, 8, 32, 3, 32, 0, 54, 2, 12, 32, 0, 32, 5, 54, 2, 12, 32, 0, 32, 3, 54, 2, 8, 11, 65, 0, 32, 10, 54, 2, 156, 8, 65, 0, 32, 4, 54, 2, 144, 8, 11, 32, 6, 65, 8, 106, 33, 0, 11, 32, 1, 65, 16, 106, 36, 0, 32, 0, 11, 20, 0, 65, 144, 140, 192, 2, 36, 2, 65, 136, 12, 65, 15, 106, 65, 112, 113, 36, 1, 11, 7, 0, 35, 0, 35, 1, 107, 11, 4, 0, 35, 1, 11, 4, 0, 35, 0, 11, 6, 0, 32, 0, 36, 0, 11, 18, 1, 2, 127, 35, 0, 32, 0, 107, 65, 112, 113, 34, 1, 36, 0, 32, 1, 11, 4, 0, 65, 1, 11, 2, 0, 11, 2, 0, 11, 2, 0, 11, 10, 0, 65, 248, 11, 16, 18, 65, 128, 12, 11, 7, 0, 65, 248, 11, 16, 19, 11, 172, 1, 1, 2, 127, 2, 64, 2, 64, 32, 0, 69, 13, 0, 2, 64, 32, 0, 40, 2, 76, 65, 127, 74, 13, 0, 32, 0, 16, 23, 15, 11, 32, 0, 16, 16, 33, 1, 32, 0, 16, 23, 33, 2, 32, 1, 69, 13, 1, 32, 0, 16, 17, 32, 2, 15, 11, 65, 0, 33, 2, 2, 64, 65, 0, 40, 2, 132, 12, 69, 13, 0, 65, 0, 40, 2, 132, 12, 16, 22, 33, 2, 11, 2, 64, 16, 20, 40, 2, 0, 34, 0, 69, 13, 0, 3, 64, 65, 0, 33, 1, 2, 64, 32, 0, 40, 2, 76, 65, 0, 72, 13, 0, 32, 0, 16, 16, 33, 1, 11, 2, 64, 32, 0, 40, 2, 20, 32, 0, 40, 2, 28, 77, 13, 0, 32, 0, 16, 23, 32, 2, 114, 33, 2, 11, 2, 64, 32, 1, 69, 13, 0, 32, 0, 16, 17, 11, 32, 0, 40, 2, 56, 34, 0, 13, 0, 11, 11, 16, 21, 11, 32, 2, 11, 107, 1, 2, 127, 2, 64, 32, 0, 40, 2, 20, 32, 0, 40, 2, 28, 77, 13, 0, 32, 0, 65, 0, 65, 0, 32, 0, 40, 2, 36, 17, 6, 0, 26, 32, 0, 40, 2, 20, 13, 0, 65, 127, 15, 11, 2, 64, 32, 0, 40, 2, 4, 34, 1, 32, 0, 40, 2, 8, 34, 2, 79, 13, 0, 32, 0, 32, 1, 32, 2, 107, 172, 65, 1, 32, 0, 40, 2, 40, 17, 7, 0, 26, 11, 32, 0, 65, 0, 54, 2, 28, 32, 0, 66, 0, 55, 3, 16, 32, 0, 66, 0, 55, 2, 4, 65, 0, 11, 11, 11, 1, 0, 65, 128, 8, 11, 4, 16, 6, 80, 0]);

// @ts-ignore 
// @prettier-ignore 
const wasmbin = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 9, 2, 96, 0, 0, 96, 1, 125, 1, 125, 3, 3, 2, 0, 1, 6, 36, 6, 127, 0, 65, 128, 8, 11, 127, 0, 65, 128, 8, 11, 127, 0, 65, 128, 8, 11, 127, 0, 65, 128, 136, 4, 11, 127, 0, 65, 0, 11, 127, 0, 65, 1, 11, 7, 121, 8, 17, 95, 95, 119, 97, 115, 109, 95, 99, 97, 108, 108, 95, 99, 116, 111, 114, 115, 0, 0, 8, 115, 97, 116, 117, 114, 97, 116, 101, 0, 1, 12, 95, 95, 100, 115, 111, 95, 104, 97, 110, 100, 108, 101, 3, 0, 10, 95, 95, 100, 97, 116, 97, 95, 101, 110, 100, 3, 1, 13, 95, 95, 103, 108, 111, 98, 97, 108, 95, 98, 97, 115, 101, 3, 2, 11, 95, 95, 104, 101, 97, 112, 95, 98, 97, 115, 101, 3, 3, 13, 95, 95, 109, 101, 109, 111, 114, 121, 95, 98, 97, 115, 101, 3, 4, 12, 95, 95, 116, 97, 98, 108, 101, 95, 98, 97, 115, 101, 3, 5, 10, 84, 2, 3, 0, 1, 11, 78, 1, 1, 125, 32, 0, 67, 205, 204, 76, 63, 93, 4, 64, 32, 0, 15, 11, 67, 102, 102, 102, 63, 33, 1, 32, 0, 67, 0, 0, 128, 63, 94, 4, 125, 67, 102, 102, 102, 63, 5, 32, 0, 67, 205, 204, 76, 191, 146, 34, 0, 32, 0, 67, 204, 204, 76, 62, 149, 34, 0, 32, 0, 148, 67, 0, 0, 128, 63, 146, 149, 67, 205, 204, 76, 63, 146, 11, 11, 0, 47, 9, 112, 114, 111, 100, 117, 99, 101, 114, 115, 1, 12, 112, 114, 111, 99, 101, 115, 115, 101, 100, 45, 98, 121, 1, 14, 72, 111, 109, 101, 98, 114, 101, 119, 32, 99, 108, 97, 110, 103, 6, 49, 50, 46, 48, 46, 49]);

function registerProcessor(name, processorCtor) {
  // thanks https://github.com/guest271314/webtransport/blob/main/webTransportAudioWorkletWebAssemblyMemoryGrow.js
  return `console.log(globalThis);\n${processorCtor};\nregisterProcessor('${name}', ${processorCtor.name});`;
}
class FFTNode extends AudioWorkletNode {
  static async init(ctx) {
    const procUrl = URL.createObjectURL(
      new Blob([registerProcessor("proc-fft", FFTProc)], {
        type: "text/javascript",
      }),
      {type: "module"}
    );
    self.wasmModule = await WebAssembly.compile(wasmbin$1);
    self.saturate = await WebAssembly.compile(wasmbin);
    await ctx.audioWorklet
      .addModule(procUrl, {credentials: "omit"})
      .catch((e) => console.trace(e));
  }
  constructor(ctx, outputChannelCount = [2]) {
    super(ctx, "proc-fft", {
      numberOfInputs: outputChannelCount.length,
      numberOfOutputs: outputChannelCount.length,
      outputChannelCount: outputChannelCount,
      processorOptions: {
        wasmModule: self.wasmModule,
        saturateModule: self.saturate
      },
    });
    this.port.onmessage = ({data: {bins, waveForm}}) => {
      this.waveFormBuffer = waveForm;
      this.fftBuffer = bins;
    };
  }
  getByteTimeDomainData() {
    return new Float64Array(this.waveFormBuffer);
  }
  getWaveForm() {
    return new Float64Array(this.waveFormBuffer);
  }
  getFloatFrequencyData() {
    return new Float64Array(this.fftBuffer);
  }
}

class AudioWorkletProcessor { }

class FFTProc extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    const {wasmModule, saturateModule} = options.processorOptions;
    this.wasmModule = wasmModule;
    this.saturate = new WebAssembly.Instance(saturateModule).exports.saturate;

    this.fft = this.FFT64(12, new WebAssembly.Instance(wasmModule));
  }
  FFT64(n = 12, instance) {
    const sizeof_double = Float64Array.BYTES_PER_ELEMENT;
    const N = 1 << n;
    const FFT = instance.exports.FFT;
    const iFFT = instance.exports.iFFT;
    const bit_reverse = instance.exports.bit_reverse;

    const heap = instance.exports.memory.buffer;

    const stblRef = instance.exports.malloc((N / 4) * sizeof_double);
    const stbl = new Float64Array(heap, stblRef, N / 4);
    for (let i = 0;i < N / 4;i++) {
      stbl[i] = Math.sin((2 * Math.PI * i) / N);
    }

    const complexRef = instance.exports.malloc(N * 2 * sizeof_double);
    const complex = new Float64Array(heap, complexRef, 2 * N);
    let wptr = 0,
      rptr = 0;

    function bzeroArray(ref, k) {
      for (let i = 0;i < k;i++) {
        complex[ref + i] = 0;
      }
    }

    const inputPCM = (arr) => {
      bzeroArray(complexRef, N);
      wptr = 0;
      arr.forEach((v) => {
        complex[wptr] = v;
        complex[wptr + 1] = 0;
        wptr += 2;
      });
    };
    function getFloatFrequencyData() {
      FFT(complexRef + rptr, n, stblRef);
      bit_reverse(complexRef + rptr, n);

      return complex.filter((v, idx) => idx < N / 2 && idx % 2 == 1);
    }
    function getWaveForm() {
      bit_reverse(complexRef, n);
      iFFT(complexRef, n, stblRef);
      return complex
        .slice(0, 256)
        .filter((v, idx) => idx < N && idx % 2 == 0);
    }
    function reset() {
      wptr = 0;
      rptr = 0;
      bzeroArray(complexRef, 10 * N);
    }
    return {
      stbl,
      reset,
      stblRef,
      complexRef,
      getFloatFrequencyData,
      inputPCM,
      FFT,
      iFFT,
      bit_reverse,
      getWaveForm,
      instance,
      complex,
      heap,
      wptr,
    };
  }
  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    for (let channel = 0;channel < output.length;channel++) {
      if (!input[channel]) continue;
      for (let i = 0;i < 128;i++) {
        output[channel][i] = this.saturate(input[channel][i]);
      }
    }
    new Promise((r) => r()).then(() => {
      if (input[0]) {
        this.fft.inputPCM(input[0]);
        const bins = this.fft.getFloatFrequencyData();
        const waveForms = this.fft.getWaveForm();
        this.port.postMessage(
          {
            bins: bins.buffer,
            waveForm: waveForms.buffer,
          },
          [waveForms.buffer, bins.buffer]
        );
      }
    });
    return true;
  }
}

async function mkpath(ctx, additional_nodes = []) {
  await SpinNode.init(ctx).catch(console.trace);
  await FFTNode.init(ctx).catch(console.trace);
  await LowPassFilterNode.init(ctx).catch(console.trace);
  const spinner = new SpinNode(ctx, 16);
  const merger = new GainNode(ctx);
  const gainNodes = Array(16).fill(new GainNode(ctx, {gain: 1}));
  const lpfs = Array(32).fill(new LowPassFilterNode(ctx));
  const channelIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const fft = new FFTNode(ctx);

  const channelState = channelIds.map(
    (index) =>
      new Proxy(
        {
          id: index,
          keys: [
            "zoneObj",
            "input",
            "midi",
            "velocity",
            "program",
            "active",
            "decibel",
          ],
          values: new Array(99),
        },
        {
          get(target, p) {
            return target.values[target.keys.indexOf(p)];
          },
          set(target, attr, value) {
            const index = target.keys.indexOf(attr);
            if (index > -1) {
              target.values[index] = value;
              return true;
            }
            return false;
          },
        }
      )
  );
  for (let i = 0;i < 16;i++) {
    spinner.connect(lpfs[i], i).connect(gainNodes[i]).connect(merger);
  }
  merger.connect(fft).connect(ctx.destination);

  const msg_cmd = (cmd, args) => spinner.port.postMessage({...args, cmd});
  spinner.port.onmessage = ({data: {dv, ch}}) => {
    if (dv && ch) {
      console.log(dv, ch);
    }
  };
  return {
    analysis: {
      get waveForm() {
        return fft.getWaveForm();
      },
      get frequencyBins() {
        return fft.getFloatFrequencyData();
      },
    },
    spinner,
    querySpState: async function (channelId) {
      spinner.port.postMessage({query: channelId});
      return await new Promise((resolve, reject) => {
        spinner.port.onmessage = ({data}) => {
          if (data.queryResponse) resolve(data.queryResponse);
        };
      });
    },
    loadPreset: spinner.shipProgram,
    channelState,
    setNewZone: function (zone) {
      return msg_cmd("newZone", {zone});
    },
    lowPassFilter: function (channel, initialFrequency) {
      lpfs[channel].parameters
        .get("FilterFC")
        .linearRampToValueAtTime(initialFrequency, ctx.currentTime);
      return lpfs[channel];
    },
    silenceAll() {
      merger.gain.linearRampToValueAtTime(0, 0.05);
    },
    mute(channel, bool) {
      this.startAudio();
      gainNodes[channel].gain.linearRampToValueAtTime(bool ? 0 : 1, 0.045);
    },
    async startAudio() {
      if (ctx.state !== "running") await ctx.resume();
    },
    ctrl_bar(container) {
      "gm_reset|debug"
        .split("|")
        .map((cmd) =>
          mkdiv(
            "button",
            {onclick: () => spinner.port.postMessage({cmd})},
            cmd
          ).attachTo(container)
        );
    },
    subscribeNextMsg: async function (precateFn) {
      return await new Promise((resolve, reject) => {
        setTimeout(reject, 2000);
        spinner.port.onmessage = ({data}) => {
          if (precateFn(data)) resolve(data);
        };
      });
    },
    bindToolbar: function () {
      document
        .querySelectorAll("input[type=checkbox], input[type=range]")
        .forEach((b) => {
          if (b.dataset.path_cmd) {
            let cmd = b.dataset.path_cmd;
            let p1 = parseInt(b.dataset.p1 || "0");
            b.addEventListener("click", (e) => {
              const value = b.type == "checkbox" ? b.checked : b.value;

              switch (cmd) {
                case "solo":
                  channelIds.forEach((id) => id != p1 && this.mute(id, value));
                  break;
                case "mute":
                  this.mute(p1, value);
                  break;
                case "lpf":
                  this.lowPassFilter(p1, value);
                  break;
                default:
                  spinner.port.postMessage({
                    cmd: b.dataset.path_cmd,
                  });
                  break;
              }
            });
          }
        });
    },
    bindKeyboard: function (get_active_channel_fn, eventpipe) {
      const keys = ["a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j"];
      window.onkeydown = (e) => {
        if (e.repeat) return;
        if (e.isComposing) return;
        const channel = get_active_channel_fn();
        const baseOctave = this.channelState[channel].octave || 48;
        const index = keys.indexOf(e.key);

        if (index < 0) return;
        const key = index + baseOctave;
        e.target.addEventListener(
          "keyup",
          () => {
            eventpipe.postMessage([0x80 | channel, key, 111]);
          },
          {once: true}
        );
        eventpipe.postMessage([0x90 | channel, key, 120]);
      };
    },
  };
}

export {mkpath};

[36m[1m//→ pdta-24193848.js:[22m[39m
var Module = (() => {
  var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;

  return (
    function (Module = {}) {

      var Module = typeof Module != "undefined" ? Module : {}; var readyPromiseResolve, readyPromiseReject; Module["ready"] = new Promise(function (resolve, reject) {readyPromiseResolve = resolve; readyPromiseReject = reject;}); var moduleOverrides = Object.assign({}, Module); var ENVIRONMENT_IS_WEB = true; var scriptDirectory = ""; function locateFile(path) {if (Module["locateFile"]) {return Module["locateFile"](path, scriptDirectory)} return scriptDirectory + path} var readBinary; {if (typeof document != "undefined" && document.currentScript) {scriptDirectory = document.currentScript.src;} if (_scriptDir) {scriptDirectory = _scriptDir;} if (scriptDirectory.indexOf("blob:") !== 0) {scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1);} else {scriptDirectory = "";} } Module["print"] || console.log.bind(console); var err = Module["printErr"] || console.warn.bind(console); Object.assign(Module, moduleOverrides); moduleOverrides = null; if (Module["arguments"]) Module["arguments"]; if (Module["thisProgram"]) Module["thisProgram"]; if (Module["quit"]) Module["quit"]; var wasmBinary; if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"]; Module["noExitRuntime"] || false; if (typeof WebAssembly != "object") {abort("no native wasm support detected");} var wasmMemory; var ABORT = false; var HEAP8, HEAPU8; function updateMemoryViews() {var b = wasmMemory.buffer; Module["HEAP8"] = HEAP8 = new Int8Array(b); Module["HEAP16"] = new Int16Array(b); Module["HEAP32"] = new Int32Array(b); Module["HEAPU8"] = HEAPU8 = new Uint8Array(b); Module["HEAPU16"] = new Uint16Array(b); Module["HEAPU32"] = new Uint32Array(b); Module["HEAPF32"] = new Float32Array(b); Module["HEAPF64"] = new Float64Array(b);} var __ATPRERUN__ = []; var __ATINIT__ = []; var __ATPOSTRUN__ = []; function preRun() {if (Module["preRun"]) {if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]]; while (Module["preRun"].length) {addOnPreRun(Module["preRun"].shift());} } callRuntimeCallbacks(__ATPRERUN__);} function initRuntime() {callRuntimeCallbacks(__ATINIT__);} function postRun() {if (Module["postRun"]) {if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]]; while (Module["postRun"].length) {addOnPostRun(Module["postRun"].shift());} } callRuntimeCallbacks(__ATPOSTRUN__);} function addOnPreRun(cb) {__ATPRERUN__.unshift(cb);} function addOnInit(cb) {__ATINIT__.unshift(cb);} function addOnPostRun(cb) {__ATPOSTRUN__.unshift(cb);} var runDependencies = 0; var dependenciesFulfilled = null; function addRunDependency(id) {runDependencies++; if (Module["monitorRunDependencies"]) {Module["monitorRunDependencies"](runDependencies);} } function removeRunDependency(id) {runDependencies--; if (Module["monitorRunDependencies"]) {Module["monitorRunDependencies"](runDependencies);} if (runDependencies == 0) {if (dependenciesFulfilled) {var callback = dependenciesFulfilled; dependenciesFulfilled = null; callback();} } } function abort(what) {if (Module["onAbort"]) {Module["onAbort"](what);} what = "Aborted(" + what + ")"; err(what); ABORT = true; what += ". Build with -sASSERTIONS for more info."; var e = new WebAssembly.RuntimeError(what); readyPromiseReject(e); throw e} var dataURIPrefix = "data:application/octet-stream;base64,"; function isDataURI(filename) {return filename.startsWith(dataURIPrefix)} var wasmBinaryFile; wasmBinaryFile = "data:application/octet-stream;base64,AGFzbQEAAAABMAlgAX8Bf2AAAX9gA39/fwBgA39/fwF/YAJ/fwF/YAF/AGACf38AYAN/fn8BfmAAAAIZBAFhAWEAAgFhAWIAAAFhAWMAAgFhAWQABgMREAMAAAAIBAAAAQEEAAUBBQAEBQFwAQEBBQYBAYAIgAgGCAF/AUHglQQLBzkOAWUCAAFmAAgBZwAHAWgAEwFpAA4BagANAWsADAFsAAsBbQEAAW4ABgFvABIBcAARAXEAEAFyAA8KpFEQgAQBA38gAkGABE8EQCAAIAEgAhACIAAPCyAAIAJqIQMCQCAAIAFzQQNxRQRAAkAgAEEDcUUEQCAAIQIMAQsgAkUEQCAAIQIMAQsgACECA0AgAiABLQAAOgAAIAFBAWohASACQQFqIgJBA3FFDQEgAiADSQ0ACwsCQCADQXxxIgRBwABJDQAgAiAEQUBqIgVLDQADQCACIAEoAgA2AgAgAiABKAIENgIEIAIgASgCCDYCCCACIAEoAgw2AgwgAiABKAIQNgIQIAIgASgCFDYCFCACIAEoAhg2AhggAiABKAIcNgIcIAIgASgCIDYCICACIAEoAiQ2AiQgAiABKAIoNgIoIAIgASgCLDYCLCACIAEoAjA2AjAgAiABKAI0NgI0IAIgASgCODYCOCACIAEoAjw2AjwgAUFAayEBIAJBQGsiAiAFTQ0ACwsgAiAETw0BA0AgAiABKAIANgIAIAFBBGohASACQQRqIgIgBEkNAAsMAQsgA0EESQRAIAAhAgwBCyAAIANBBGsiBEsEQCAAIQIMAQsgACECA0AgAiABLQAAOgAAIAIgAS0AAToAASACIAEtAAI6AAIgAiABLQADOgADIAFBBGohASACQQRqIgIgBE0NAAsLIAIgA0kEQANAIAIgAS0AADoAACABQQFqIQEgAkEBaiICIANHDQALCyAAC08BAn9B+AgoAgAiASAAQQdqQXhxIgJqIQACQCACQQAgACABTRsNACAAPwBBEHRLBEAgABABRQ0BC0H4CCAANgIAIAEPC0HMEUEwNgIAQX8L6AEBA38gAEUEQEHUFSgCAARAQdQVKAIAEAYhAQtB1BUoAgAEQEHUFSgCABAGIAFyIQELQdAVKAIAIgAEQANAIAAoAkwaIAAoAhQgACgCHEcEQCAAEAYgAXIhAQsgACgCOCIADQALCyABDwsgACgCTEEATiECAkACQCAAKAIUIAAoAhxGDQAgAEEAQQAgACgCJBEDABogACgCFA0AQX8hAQwBCyAAKAIEIgEgACgCCCIDRwRAIAAgASADa6xBASAAKAIoEQcAGgtBACEBIABBADYCHCAAQgA3AxAgAEIANwIEIAJFDQALIAELlSgBC38jAEEQayILJAACQAJAAkACQAJAAkACQAJAAkAgAEH0AU0EQEHQESgCACIGQRAgAEELakF4cSAAQQtJGyIFQQN2IgB2IgFBA3EEQAJAIAFBf3NBAXEgAGoiAkEDdCIBQfgRaiIAIAFBgBJqKAIAIgEoAggiBEYEQEHQESAGQX4gAndxNgIADAELIAQgADYCDCAAIAQ2AggLIAFBCGohACABIAJBA3QiAkEDcjYCBCABIAJqIgEgASgCBEEBcjYCBAwKCyAFQdgRKAIAIgdNDQEgAQRAAkBBAiAAdCICQQAgAmtyIAEgAHRxIgBBACAAa3FoIgFBA3QiAEH4EWoiAiAAQYASaigCACIAKAIIIgRGBEBB0BEgBkF+IAF3cSIGNgIADAELIAQgAjYCDCACIAQ2AggLIAAgBUEDcjYCBCAAIAVqIgggAUEDdCIBIAVrIgRBAXI2AgQgACABaiAENgIAIAcEQCAHQXhxQfgRaiEBQeQRKAIAIQICfyAGQQEgB0EDdnQiA3FFBEBB0BEgAyAGcjYCACABDAELIAEoAggLIQMgASACNgIIIAMgAjYCDCACIAE2AgwgAiADNgIICyAAQQhqIQBB5BEgCDYCAEHYESAENgIADAoLQdQRKAIAIgpFDQEgCkEAIAprcWhBAnRBgBRqKAIAIgIoAgRBeHEgBWshAyACIQEDQAJAIAEoAhAiAEUEQCABKAIUIgBFDQELIAAoAgRBeHEgBWsiASADIAEgA0kiARshAyAAIAIgARshAiAAIQEMAQsLIAIoAhghCSACIAIoAgwiBEcEQEHgESgCABogAigCCCIAIAQ2AgwgBCAANgIIDAkLIAJBFGoiASgCACIARQRAIAIoAhAiAEUNAyACQRBqIQELA0AgASEIIAAiBEEUaiIBKAIAIgANACAEQRBqIQEgBCgCECIADQALIAhBADYCAAwIC0F/IQUgAEG/f0sNACAAQQtqIgBBeHEhBUHUESgCACIIRQ0AQQAgBWshAwJAAkACQAJ/QQAgBUGAAkkNABpBHyAFQf///wdLDQAaIAVBJiAAQQh2ZyIAa3ZBAXEgAEEBdGtBPmoLIgdBAnRBgBRqKAIAIgFFBEBBACEADAELQQAhACAFQRkgB0EBdmtBACAHQR9HG3QhAgNAAkAgASgCBEF4cSAFayIGIANPDQAgASEEIAYiAw0AQQAhAyABIQAMAwsgACABKAIUIgYgBiABIAJBHXZBBHFqKAIQIgFGGyAAIAYbIQAgAkEBdCECIAENAAsLIAAgBHJFBEBBACEEQQIgB3QiAEEAIABrciAIcSIARQ0DIABBACAAa3FoQQJ0QYAUaigCACEACyAARQ0BCwNAIAAoAgRBeHEgBWsiAiADSSEBIAIgAyABGyEDIAAgBCABGyEEIAAoAhAiAQR/IAEFIAAoAhQLIgANAAsLIARFDQAgA0HYESgCACAFa08NACAEKAIYIQcgBCAEKAIMIgJHBEBB4BEoAgAaIAQoAggiACACNgIMIAIgADYCCAwHCyAEQRRqIgEoAgAiAEUEQCAEKAIQIgBFDQMgBEEQaiEBCwNAIAEhBiAAIgJBFGoiASgCACIADQAgAkEQaiEBIAIoAhAiAA0ACyAGQQA2AgAMBgsgBUHYESgCACIETQRAQeQRKAIAIQACQCAEIAVrIgFBEE8EQCAAIAVqIgIgAUEBcjYCBCAAIARqIAE2AgAgACAFQQNyNgIEDAELIAAgBEEDcjYCBCAAIARqIgEgASgCBEEBcjYCBEEAIQJBACEBC0HYESABNgIAQeQRIAI2AgAgAEEIaiEADAgLIAVB3BEoAgAiAkkEQEHcESACIAVrIgE2AgBB6BFB6BEoAgAiACAFaiICNgIAIAIgAUEBcjYCBCAAIAVBA3I2AgQgAEEIaiEADAgLQQAhACAFQS9qIgMCf0GoFSgCAARAQbAVKAIADAELQbQVQn83AgBBrBVCgKCAgICABDcCAEGoFSALQQxqQXBxQdiq1aoFczYCAEG8FUEANgIAQYwVQQA2AgBBgCALIgFqIgZBACABayIIcSIBIAVNDQdBiBUoAgAiBARAQYAVKAIAIgcgAWoiCSAHTQ0IIAQgCUkNCAsCQEGMFS0AAEEEcUUEQAJAAkACQAJAQegRKAIAIgQEQEGQFSEAA0AgBCAAKAIAIgdPBEAgByAAKAIEaiAESw0DCyAAKAIIIgANAAsLQQAQBSICQX9GDQMgASEGQawVKAIAIgBBAWsiBCACcQRAIAEgAmsgAiAEakEAIABrcWohBgsgBSAGTw0DQYgVKAIAIgAEQEGAFSgCACIEIAZqIgggBE0NBCAAIAhJDQQLIAYQBSIAIAJHDQEMBQsgBiACayAIcSIGEAUiAiAAKAIAIAAoAgRqRg0BIAIhAAsgAEF/Rg0BIAYgBUEwak8EQCAAIQIMBAtBsBUoAgAiAiADIAZrakEAIAJrcSICEAVBf0YNASACIAZqIQYgACECDAMLIAJBf0cNAgtBjBVBjBUoAgBBBHI2AgALIAEQBSECQQAQBSEAIAJBf0YNBSAAQX9GDQUgACACTQ0FIAAgAmsiBiAFQShqTQ0FC0GAFUGAFSgCACAGaiIANgIAQYQVKAIAIABJBEBBhBUgADYCAAsCQEHoESgCACIDBEBBkBUhAANAIAIgACgCACIBIAAoAgQiBGpGDQIgACgCCCIADQALDAQLQeARKAIAIgBBACAAIAJNG0UEQEHgESACNgIAC0EAIQBBlBUgBjYCAEGQFSACNgIAQfARQX82AgBB9BFBqBUoAgA2AgBBnBVBADYCAANAIABBA3QiAUGAEmogAUH4EWoiBDYCACABQYQSaiAENgIAIABBAWoiAEEgRw0AC0HcESAGQShrIgBBeCACa0EHcUEAIAJBCGpBB3EbIgFrIgQ2AgBB6BEgASACaiIBNgIAIAEgBEEBcjYCBCAAIAJqQSg2AgRB7BFBuBUoAgA2AgAMBAsgAC0ADEEIcQ0CIAEgA0sNAiACIANNDQIgACAEIAZqNgIEQegRIANBeCADa0EHcUEAIANBCGpBB3EbIgBqIgE2AgBB3BFB3BEoAgAgBmoiAiAAayIANgIAIAEgAEEBcjYCBCACIANqQSg2AgRB7BFBuBUoAgA2AgAMAwtBACEEDAULQQAhAgwDC0HgESgCACACSwRAQeARIAI2AgALIAIgBmohAUGQFSEAAkACQAJAAkACQAJAA0AgASAAKAIARwRAIAAoAggiAA0BDAILCyAALQAMQQhxRQ0BC0GQFSEAA0AgAyAAKAIAIgFPBEAgASAAKAIEaiIEIANLDQMLIAAoAgghAAwACwALIAAgAjYCACAAIAAoAgQgBmo2AgQgAkF4IAJrQQdxQQAgAkEIakEHcRtqIgcgBUEDcjYCBCABQXggAWtBB3FBACABQQhqQQdxG2oiBiAFIAdqIgVrIQAgAyAGRgRAQegRIAU2AgBB3BFB3BEoAgAgAGoiADYCACAFIABBAXI2AgQMAwtB5BEoAgAgBkYEQEHkESAFNgIAQdgRQdgRKAIAIABqIgA2AgAgBSAAQQFyNgIEIAAgBWogADYCAAwDCyAGKAIEIgNBA3FBAUYEQCADQXhxIQkCQCADQf8BTQRAIAYoAgwiASAGKAIIIgJGBEBB0BFB0BEoAgBBfiADQQN2d3E2AgAMAgsgAiABNgIMIAEgAjYCCAwBCyAGKAIYIQgCQCAGIAYoAgwiAkcEQCAGKAIIIgEgAjYCDCACIAE2AggMAQsCQCAGQRRqIgMoAgAiAQ0AIAZBEGoiAygCACIBDQBBACECDAELA0AgAyEEIAEiAkEUaiIDKAIAIgENACACQRBqIQMgAigCECIBDQALIARBADYCAAsgCEUNAAJAIAYoAhwiAUECdEGAFGoiBCgCACAGRgRAIAQgAjYCACACDQFB1BFB1BEoAgBBfiABd3E2AgAMAgsgCEEQQRQgCCgCECAGRhtqIAI2AgAgAkUNAQsgAiAINgIYIAYoAhAiAQRAIAIgATYCECABIAI2AhgLIAYoAhQiAUUNACACIAE2AhQgASACNgIYCyAGIAlqIgYoAgQhAyAAIAlqIQALIAYgA0F+cTYCBCAFIABBAXI2AgQgACAFaiAANgIAIABB/wFNBEAgAEF4cUH4EWohAQJ/QdARKAIAIgJBASAAQQN2dCIAcUUEQEHQESAAIAJyNgIAIAEMAQsgASgCCAshACABIAU2AgggACAFNgIMIAUgATYCDCAFIAA2AggMAwtBHyEDIABB////B00EQCAAQSYgAEEIdmciAWt2QQFxIAFBAXRrQT5qIQMLIAUgAzYCHCAFQgA3AhAgA0ECdEGAFGohAQJAQdQRKAIAIgJBASADdCIEcUUEQEHUESACIARyNgIAIAEgBTYCAAwBCyAAQRkgA0EBdmtBACADQR9HG3QhAyABKAIAIQIDQCACIgEoAgRBeHEgAEYNAyADQR12IQIgA0EBdCEDIAEgAkEEcWoiBCgCECICDQALIAQgBTYCEAsgBSABNgIYIAUgBTYCDCAFIAU2AggMAgtB3BEgBkEoayIAQXggAmtBB3FBACACQQhqQQdxGyIBayIINgIAQegRIAEgAmoiATYCACABIAhBAXI2AgQgACACakEoNgIEQewRQbgVKAIANgIAIAMgBEEnIARrQQdxQQAgBEEna0EHcRtqQS9rIgAgACADQRBqSRsiAUEbNgIEIAFBmBUpAgA3AhAgAUGQFSkCADcCCEGYFSABQQhqNgIAQZQVIAY2AgBBkBUgAjYCAEGcFUEANgIAIAFBGGohAANAIABBBzYCBCAAQQhqIQIgAEEEaiEAIAIgBEkNAAsgASADRg0DIAEgASgCBEF+cTYCBCADIAEgA2siAkEBcjYCBCABIAI2AgAgAkH/AU0EQCACQXhxQfgRaiEAAn9B0BEoAgAiAUEBIAJBA3Z0IgJxRQRAQdARIAEgAnI2AgAgAAwBCyAAKAIICyEBIAAgAzYCCCABIAM2AgwgAyAANgIMIAMgATYCCAwEC0EfIQAgAkH///8HTQRAIAJBJiACQQh2ZyIAa3ZBAXEgAEEBdGtBPmohAAsgAyAANgIcIANCADcCECAAQQJ0QYAUaiEBAkBB1BEoAgAiBEEBIAB0IgZxRQRAQdQRIAQgBnI2AgAgASADNgIADAELIAJBGSAAQQF2a0EAIABBH0cbdCEAIAEoAgAhBANAIAQiASgCBEF4cSACRg0EIABBHXYhBCAAQQF0IQAgASAEQQRxaiIGKAIQIgQNAAsgBiADNgIQCyADIAE2AhggAyADNgIMIAMgAzYCCAwDCyABKAIIIgAgBTYCDCABIAU2AgggBUEANgIYIAUgATYCDCAFIAA2AggLIAdBCGohAAwFCyABKAIIIgAgAzYCDCABIAM2AgggA0EANgIYIAMgATYCDCADIAA2AggLQdwRKAIAIgAgBU0NAEHcESAAIAVrIgE2AgBB6BFB6BEoAgAiACAFaiICNgIAIAIgAUEBcjYCBCAAIAVBA3I2AgQgAEEIaiEADAMLQcwRQTA2AgBBACEADAILAkAgB0UNAAJAIAQoAhwiAEECdEGAFGoiASgCACAERgRAIAEgAjYCACACDQFB1BEgCEF+IAB3cSIINgIADAILIAdBEEEUIAcoAhAgBEYbaiACNgIAIAJFDQELIAIgBzYCGCAEKAIQIgAEQCACIAA2AhAgACACNgIYCyAEKAIUIgBFDQAgAiAANgIUIAAgAjYCGAsCQCADQQ9NBEAgBCADIAVqIgBBA3I2AgQgACAEaiIAIAAoAgRBAXI2AgQMAQsgBCAFQQNyNgIEIAQgBWoiAiADQQFyNgIEIAIgA2ogAzYCACADQf8BTQRAIANBeHFB+BFqIQACf0HQESgCACIBQQEgA0EDdnQiA3FFBEBB0BEgASADcjYCACAADAELIAAoAggLIQEgACACNgIIIAEgAjYCDCACIAA2AgwgAiABNgIIDAELQR8hACADQf///wdNBEAgA0EmIANBCHZnIgBrdkEBcSAAQQF0a0E+aiEACyACIAA2AhwgAkIANwIQIABBAnRBgBRqIQECQAJAIAhBASAAdCIGcUUEQEHUESAGIAhyNgIAIAEgAjYCAAwBCyADQRkgAEEBdmtBACAAQR9HG3QhACABKAIAIQUDQCAFIgEoAgRBeHEgA0YNAiAAQR12IQYgAEEBdCEAIAEgBkEEcWoiBigCECIFDQALIAYgAjYCEAsgAiABNgIYIAIgAjYCDCACIAI2AggMAQsgASgCCCIAIAI2AgwgASACNgIIIAJBADYCGCACIAE2AgwgAiAANgIICyAEQQhqIQAMAQsCQCAJRQ0AAkAgAigCHCIAQQJ0QYAUaiIBKAIAIAJGBEAgASAENgIAIAQNAUHUESAKQX4gAHdxNgIADAILIAlBEEEUIAkoAhAgAkYbaiAENgIAIARFDQELIAQgCTYCGCACKAIQIgAEQCAEIAA2AhAgACAENgIYCyACKAIUIgBFDQAgBCAANgIUIAAgBDYCGAsCQCADQQ9NBEAgAiADIAVqIgBBA3I2AgQgACACaiIAIAAoAgRBAXI2AgQMAQsgAiAFQQNyNgIEIAIgBWoiBCADQQFyNgIEIAMgBGogAzYCACAHBEAgB0F4cUH4EWohAEHkESgCACEBAn9BASAHQQN2dCIFIAZxRQRAQdARIAUgBnI2AgAgAAwBCyAAKAIICyEGIAAgATYCCCAGIAE2AgwgASAANgIMIAEgBjYCCAtB5BEgBDYCAEHYESADNgIACyACQQhqIQALIAtBEGokACAACwMAAQvQDQIRfwF9IwBBgARrIgMkACADQaADaiICQQA6AAAgAkHWAGoiBEEBa0EAOgAAIAJBADoAAiACQQA6AAEgBEEDa0EAOgAAIARBAmtBADoAACACQQA6AAMgBEEEa0EAOgAAIAJBACACa0EDcSIEaiICQQA2AgAgAkHWACAEa0F8cSIFaiIEQQRrQQA2AgACQCAFQQlJDQAgAkEANgIIIAJBADYCBCAEQQhrQQA2AgAgBEEMa0EANgIAIAVBGUkNACACQQA2AhggAkEANgIUIAJBADYCECACQQA2AgwgBEEQa0EANgIAIARBFGtBADYCACAEQRhrQQA2AgAgBEEca0EANgIAIAUgAkEEcUEYciIFayIEQSBJDQAgAiAFaiECA0AgAkIANwMYIAJCADcDECACQgA3AwggAkIANwMAIAJBIGohAiAEQSBrIgRBH0sNAAsLIANCADcBlgMgA0IANwOQAyADQgA3A4gDIANCADcDgAMgAUH4AGxB+ABqEAchCSAALwEYIgUgAC8BPkkEQEGA/gEhDUGA/gEhDgNAIAVBAWohD0GMCSgCACIBIAVBAnRqLwEAIQgCf0GICSgCAEEBayAFSgRAIAEgD0ECdGovAQAMAQtBmAkoAgBBAWsLIRAgA0GAAmogA0GgA2pB1gAQBBogAyAOOwHYAiADIA07AdYCIAMgAykBlgM3AfACIAMgAykDkAM3AeoCIAMgAykDiAM3AeICIAMgAykDgAM3AdoCIANB//8DOwHSAiADIAU7AaYCAkAgCCAQSARAA0AgA0GAAmpBnAkoAgAgCEECdGoiAS8BACICQQF0aiABLwECOwEAAkAgAkEpRw0AQaQJKAIAIAMuAdICQRZsaiIBLwEUIQcgAS8BKiERIANBgAFqQYAIQfgAEAQaIAcgEU8NAEG8CSgCACECQawJKAIAIQQDQCADIANBgAFqQfgAEAQhBiAEIAdBAnRqIgEvAQAiCiABLwEEIgFHBEAgAiABQQJ0aiELIAIgCkECdGohAQNAIAYgAS8BAEEBdGogAS8BAjsBACABQQRqIgEgC0cNAAsLQQAhAQJAIAYvAWpB//8DRgRAIAZBgAFqIAZB+AAQBBoMAQsDQCABQQF0IgIgBkGAAmpqLgEAIQQgAiAGaiIKLgEAIQICQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAIAFBBWsOLAcHBwgJBwcNBw0NDQMNDQ0ACgAKAAEAAQUBAgIAAQABBgECAgsNDAwNDQ0EDQtBiCdBoKJ/IAIgBGoiAiACQaCif0wbIgIgAkGIJ04bIQIMDAtBwD5BoKJ/IAIgBGoiAiACQaCif0wbIgIgAkHAPk4bIQIMCwtBsAlBoKJ/IAIgBGoiAiACQaCif0wbIgIgAkGwCU4bIQIMCgtDAAAAP0MAAAC/IASyQ28SgzqUIAKykiITIBNDAAAAv10bIBNDAAAAP14bIhOLQwAAAE9dBEAgE6ghAgwKC0GAgICAeCECDAkLQwAAtERDAAAAACACsiAEspIiEyATQwAAAABdGyATQwAAtEReGyITi0MAAABPXQRAIBOoIQIMCQtBgICAgHghAgwIC0HoByACIARqIgJBACACQQBKGyICIAJB6AdPGyECDAcLQwAAr0RDAAAAACACsiAEspIiEyATQwAAAABdGyATQwAAr0ReGyITi0MAAABPXQRAIBOoIQIMBwtBgICAgHghAgwGC0Hg3QBBoKJ/IAIgBGoiAiACQaCif0wbIgIgAkHg3QBOGyECDAULQbzpAEHcCyACIARqIgIgAkHcC0wbIgIgAkG86QBPGyECDAQLQcAHIAIgBGoiAkEAIAJBAEobIgIgAkHAB08bIQIMAwtBlCNBgIN/IAIgBGoiAiACQYCDf0wbIgIgAkGUI04bIQIMAgsgBCECDAELIAJBCHUiCyAEQQh1IhIgCyASSBtBCHQgAkH/AHEiAiAEQf8AcSIEIAIgBEsbciECCyAKIAI7AQAgAUEBaiIBQTxHDQALIAYgBTsBJiAGIAc7ASQgCSAMQfgAbGogBkH4ABAEIQEgAC8BFCABEAMgDEEBaiEMQbwJKAIAIQJBrAkoAgAhBAsgB0EBaiIHIBFHDQALCyAIQQFqIgggEEcNAAsgAy8B0gJB//8DRw0BCyADQaADaiADQYACakHWABAEGiADIAMpAeICNwOIAyADIAMpAeoCNwOQAyADIAMpAfACNwGWAyADIAMpAdoCNwOAAyADLwHYAiEOIAMvAdYCIQ0LIA8iBSAALwE+SQ0ACwsgCSAMQfgAbGpB//8DOwFqIANBgARqJAAgCQvBAwEWfyAALwEYIgIgAC8BPiINSQRAQaQJKAIAIg5BFmohD0GoCSgCAEEBayEQQZgJKAIAQQFrIRFBiAkoAgBBAWshEkG8CSgCACIKQbgJKAIAQQJ0akEEayETQcAJKAIAIRRBrAkoAgAhFUGcCSgCACEGQYwJKAIAIQsDQCACIgBBAWohAiARIQcgACASSARAIAsgAkECdGovAQAhBwsgByALIABBAnRqLwEAIgNKBEBB/wAhCEEAIQkDQAJAAkACQCADQStrDgIAAgELIAYtAK8BIQggBi0ArgEhCQwBCyAIQf8BcSAJRgRAIAkhCAwBCyAGIANBAnRqIgAvAQBBKUcNACAOIAAvAQJBFmwiAGovARQiBCAAIA9qLwEUIhZPDQADQCAVIARBAnRqIQAgEyEFIAQgEEgEQCAKIAAvAQRBAnRqIQULAkAgCiAALwEAQQJ0aiIALwEAIgxBPEYNACAAIAVGDQADQCAMQTVGBEAgASAUIAAvAQJKaiEBDAILIAAvAQQiDEE8Rg0BIABBBGoiACAFRw0ACwsgBEEBaiIEIBZHDQALCyADQQFqIgMgB0cNAAsLIAIgDUcNAAsLIAELDgBBpAkoAgAgAEEWbGoLBQBB0AkLCABBxAkoAgALVwEEf0GACSgCACIEQQBKBH9BhAkoAgAhAwJAA0AgACADIAJBJmxqIgUvARRGBEAgBS8BFiABRg0CCyACQQFqIgIgBEcNAAtBAA8LIAMgAkEmbGoFQQALCxAAIwAgAGtBcHEiACQAIAALBgAgACQACwQAIwALywsBB38CQCAARQ0AIABBCGsiAiAAQQRrKAIAIgFBeHEiAGohBQJAIAFBAXENACABQQNxRQ0BIAIgAigCACIBayICQeARKAIASQ0BIAAgAWohAEHkESgCACACRwRAIAFB/wFNBEAgAUEDdiEBIAIoAgwiAyACKAIIIgRGBEBB0BFB0BEoAgBBfiABd3E2AgAMAwsgBCADNgIMIAMgBDYCCAwCCyACKAIYIQYCQCACIAIoAgwiAUcEQCACKAIIIgMgATYCDCABIAM2AggMAQsCQCACQRRqIgQoAgAiAw0AIAJBEGoiBCgCACIDDQBBACEBDAELA0AgBCEHIAMiAUEUaiIEKAIAIgMNACABQRBqIQQgASgCECIDDQALIAdBADYCAAsgBkUNAQJAIAIoAhwiBEECdEGAFGoiAygCACACRgRAIAMgATYCACABDQFB1BFB1BEoAgBBfiAEd3E2AgAMAwsgBkEQQRQgBigCECACRhtqIAE2AgAgAUUNAgsgASAGNgIYIAIoAhAiAwRAIAEgAzYCECADIAE2AhgLIAIoAhQiA0UNASABIAM2AhQgAyABNgIYDAELIAUoAgQiAUEDcUEDRw0AQdgRIAA2AgAgBSABQX5xNgIEIAIgAEEBcjYCBCAAIAJqIAA2AgAPCyACIAVPDQAgBSgCBCIBQQFxRQ0AAkAgAUECcUUEQEHoESgCACAFRgRAQegRIAI2AgBB3BFB3BEoAgAgAGoiADYCACACIABBAXI2AgQgAkHkESgCAEcNA0HYEUEANgIAQeQRQQA2AgAPC0HkESgCACAFRgRAQeQRIAI2AgBB2BFB2BEoAgAgAGoiADYCACACIABBAXI2AgQgACACaiAANgIADwsgAUF4cSAAaiEAAkAgAUH/AU0EQCABQQN2IQEgBSgCDCIDIAUoAggiBEYEQEHQEUHQESgCAEF+IAF3cTYCAAwCCyAEIAM2AgwgAyAENgIIDAELIAUoAhghBgJAIAUgBSgCDCIBRwRAQeARKAIAGiAFKAIIIgMgATYCDCABIAM2AggMAQsCQCAFQRRqIgQoAgAiAw0AIAVBEGoiBCgCACIDDQBBACEBDAELA0AgBCEHIAMiAUEUaiIEKAIAIgMNACABQRBqIQQgASgCECIDDQALIAdBADYCAAsgBkUNAAJAIAUoAhwiBEECdEGAFGoiAygCACAFRgRAIAMgATYCACABDQFB1BFB1BEoAgBBfiAEd3E2AgAMAgsgBkEQQRQgBigCECAFRhtqIAE2AgAgAUUNAQsgASAGNgIYIAUoAhAiAwRAIAEgAzYCECADIAE2AhgLIAUoAhQiA0UNACABIAM2AhQgAyABNgIYCyACIABBAXI2AgQgACACaiAANgIAIAJB5BEoAgBHDQFB2BEgADYCAA8LIAUgAUF+cTYCBCACIABBAXI2AgQgACACaiAANgIACyAAQf8BTQRAIABBeHFB+BFqIQECf0HQESgCACIDQQEgAEEDdnQiAHFFBEBB0BEgACADcjYCACABDAELIAEoAggLIQAgASACNgIIIAAgAjYCDCACIAE2AgwgAiAANgIIDwtBHyEEIABB////B00EQCAAQSYgAEEIdmciAWt2QQFxIAFBAXRrQT5qIQQLIAIgBDYCHCACQgA3AhAgBEECdEGAFGohBwJAAkACQEHUESgCACIDQQEgBHQiAXFFBEBB1BEgASADcjYCACAHIAI2AgAgAiAHNgIYDAELIABBGSAEQQF2a0EAIARBH0cbdCEEIAcoAgAhAQNAIAEiAygCBEF4cSAARg0CIARBHXYhASAEQQF0IQQgAyABQQRxaiIHQRBqKAIAIgENAAsgByACNgIQIAIgAzYCGAsgAiACNgIMIAIgAjYCCAwBCyADKAIIIgAgAjYCDCADIAI2AgggAkEANgIYIAIgAzYCDCACIAA2AggLQfARQfARKAIAQQFrIgBBfyAAGzYCAAsL1QQBBX8gACgCBCEEQYQJIABBCGoiATYCAEGACSAEQSZuIgA2AgAgASAEaiIBKAIEIQJBjAkgAUEIaiIDNgIAQYgJIAJBAnY2AgAgAyABKAIEaiIBKAIEIQJBlAkgAUEIaiIDNgIAQZAJIAJBCm42AgAgAyABKAIEaiIBKAIEIQJBnAkgAUEIaiIDNgIAQZgJIAJBAnY2AgAgAyABKAIEaiIBKAIEIQJBpAkgAUEIaiIDNgIAQaAJIAJBFm42AgAgAyABKAIEaiIBKAIEIQJBrAkgAUEIaiIDNgIAQagJIAJBAnY2AgAgAyABKAIEaiIBKAIEIQJBtAkgAUEIaiIDNgIAQbAJIAJBCm42AgAgAyABKAIEaiIBKAIEIQJBvAkgAUEIaiIDNgIAQbgJIAJBAnY2AgAgAyABKAIEaiIBKAIEIQJBxAkgAUEIajYCAEHACSACQS5uNgIAIARBJUsEQANAAkAgAEEATA0AQQAhBEGECSgCACECAkADQAJAIAIgBEEmbGoiAS8BFCAFRgRAIAEvARZFDQELIARBAWoiBCAARw0BDAILCyAFQQJ0QdAJaiABIAEQChAJNgIAIAEvARQgAS8BFiABEABBgAkoAgAhAAsgAEEATA0AQQAhBEGECSgCACECA0ACQCACIARBJmxqIgEvARQgBUYEQCABLwEWQYABRg0BCyAEQQFqIgQgAEcNAQwCCwsgBUECdEHQDWogASABEAoQCTYCACABLwEUIAEvARYgARAAQYAJKAIAIQALIAVBAWoiBUGAAUcNAAsLQQQQBwsLcAQAQYoICxIg0SDRING8NAAAINEg0QAAINEAQaoICzYg0QAAINEAACDRINEg0SDRAAAg0QAAAAAg0SDRINEg0QAAINEAAAAA//8AAAB/AH8AAP////8AQeoICwz//wEAAABkAAAA//8AQfgICwPgCgE="; if (!isDataURI(wasmBinaryFile)) {wasmBinaryFile = locateFile(wasmBinaryFile);} function getBinary(file) {try {if (file == wasmBinaryFile && wasmBinary) {return new Uint8Array(wasmBinary)} var binary = tryParseAsDataURI(file); if (binary) {return binary} if (readBinary); throw "both async and sync fetching of the wasm failed"} catch (err) {abort(err);} } function getBinaryPromise(binaryFile) {if (!wasmBinary && (ENVIRONMENT_IS_WEB)) {if (typeof fetch == "function") {return fetch(binaryFile, {credentials: "same-origin"}).then(function (response) {if (!response["ok"]) {throw "failed to load wasm binary file at '" + binaryFile + "'"} return response["arrayBuffer"]()}).catch(function () {return getBinary(binaryFile)})} } return Promise.resolve().then(function () {return getBinary(binaryFile)})} function instantiateArrayBuffer(binaryFile, imports, receiver) {return getBinaryPromise(binaryFile).then(function (binary) {return WebAssembly.instantiate(binary, imports)}).then(function (instance) {return instance}).then(receiver, function (reason) {err("failed to asynchronously prepare wasm: " + reason); abort(reason);})} function instantiateAsync(binary, binaryFile, imports, callback) {if (!binary && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(binaryFile) && typeof fetch == "function") {return fetch(binaryFile, {credentials: "same-origin"}).then(function (response) {var result = WebAssembly.instantiateStreaming(response, imports); return result.then(callback, function (reason) {err("wasm streaming compile failed: " + reason); err("falling back to ArrayBuffer instantiation"); return instantiateArrayBuffer(binaryFile, imports, callback)})})} else {return instantiateArrayBuffer(binaryFile, imports, callback)} } function createWasm() {var info = {"a": wasmImports}; function receiveInstance(instance, module) {var exports = instance.exports; Module["asm"] = exports; wasmMemory = Module["asm"]["e"]; updateMemoryViews(); Module["asm"]["m"]; addOnInit(Module["asm"]["f"]); removeRunDependency(); return exports} addRunDependency(); function receiveInstantiationResult(result) {receiveInstance(result["instance"]);} if (Module["instantiateWasm"]) {try {return Module["instantiateWasm"](info, receiveInstance)} catch (e) {err("Module.instantiateWasm callback failed with error: " + e); readyPromiseReject(e);} } instantiateAsync(wasmBinary, wasmBinaryFile, info, receiveInstantiationResult).catch(readyPromiseReject); return {}} function callRuntimeCallbacks(callbacks) {while (callbacks.length > 0) {callbacks.shift()(Module);} } function _emitHeader(pid, bid, offset) {Module.onHeader(pid, bid, Module.AsciiToString(offset));} function _emitZone(pid, ref) {Module.onZone(pid, ref, new Int16Array(Module.HEAPU8.buffer, ref, 60));} function _emscripten_memcpy_big(dest, src, num) {HEAPU8.copyWithin(dest, src, src + num);} function abortOnCannotGrowMemory(requestedSize) {abort("OOM");} function _emscripten_resize_heap(requestedSize) {HEAPU8.length; abortOnCannotGrowMemory();} function getCFunc(ident) {var func = Module["_" + ident]; return func} function writeArrayToMemory(array, buffer) {HEAP8.set(array, buffer);} function lengthBytesUTF8(str) {var len = 0; for (var i = 0;i < str.length;++i) {var c = str.charCodeAt(i); if (c <= 127) {len++;} else if (c <= 2047) {len += 2;} else if (c >= 55296 && c <= 57343) {len += 4; ++i;} else {len += 3;} } return len} function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {if (!(maxBytesToWrite > 0)) return 0; var startIdx = outIdx; var endIdx = outIdx + maxBytesToWrite - 1; for (var i = 0;i < str.length;++i) {var u = str.charCodeAt(i); if (u >= 55296 && u <= 57343) {var u1 = str.charCodeAt(++i); u = 65536 + ((u & 1023) << 10) | u1 & 1023;} if (u <= 127) {if (outIdx >= endIdx) break; heap[outIdx++] = u;} else if (u <= 2047) {if (outIdx + 1 >= endIdx) break; heap[outIdx++] = 192 | u >> 6; heap[outIdx++] = 128 | u & 63;} else if (u <= 65535) {if (outIdx + 2 >= endIdx) break; heap[outIdx++] = 224 | u >> 12; heap[outIdx++] = 128 | u >> 6 & 63; heap[outIdx++] = 128 | u & 63;} else {if (outIdx + 3 >= endIdx) break; heap[outIdx++] = 240 | u >> 18; heap[outIdx++] = 128 | u >> 12 & 63; heap[outIdx++] = 128 | u >> 6 & 63; heap[outIdx++] = 128 | u & 63;} } heap[outIdx] = 0; return outIdx - startIdx} function stringToUTF8(str, outPtr, maxBytesToWrite) {return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite)} function stringToUTF8OnStack(str) {var size = lengthBytesUTF8(str) + 1; var ret = stackAlloc(size); stringToUTF8(str, ret, size); return ret} var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf8") : undefined; function UTF8ArrayToString(heapOrArray, idx, maxBytesToRead) {var endIdx = idx + maxBytesToRead; var endPtr = idx; while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr; if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr))} var str = ""; while (idx < endPtr) {var u0 = heapOrArray[idx++]; if (!(u0 & 128)) {str += String.fromCharCode(u0); continue} var u1 = heapOrArray[idx++] & 63; if ((u0 & 224) == 192) {str += String.fromCharCode((u0 & 31) << 6 | u1); continue} var u2 = heapOrArray[idx++] & 63; if ((u0 & 240) == 224) {u0 = (u0 & 15) << 12 | u1 << 6 | u2;} else {u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63;} if (u0 < 65536) {str += String.fromCharCode(u0);} else {var ch = u0 - 65536; str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);} } return str} function UTF8ToString(ptr, maxBytesToRead) {return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : ""} function ccall(ident, returnType, argTypes, args, opts) {var toC = {"string": str => {var ret = 0; if (str !== null && str !== undefined && str !== 0) {ret = stringToUTF8OnStack(str);} return ret}, "array": arr => {var ret = stackAlloc(arr.length); writeArrayToMemory(arr, ret); return ret}}; function convertReturnValue(ret) {if (returnType === "string") {return UTF8ToString(ret)} if (returnType === "boolean") return Boolean(ret); return ret} var func = getCFunc(ident); var cArgs = []; var stack = 0; if (args) {for (var i = 0;i < args.length;i++) {var converter = toC[argTypes[i]]; if (converter) {if (stack === 0) stack = stackSave(); cArgs[i] = converter(args[i]);} else {cArgs[i] = args[i];} } } var ret = func.apply(null, cArgs); function onDone(ret) {if (stack !== 0) stackRestore(stack); return convertReturnValue(ret)} ret = onDone(ret); return ret} function AsciiToString(ptr) {var str = ""; while (1) {var ch = HEAPU8[ptr++ >> 0]; if (!ch) return str; str += String.fromCharCode(ch);} } var decodeBase64 = typeof atob == "function" ? atob : function (input) {var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="; var output = ""; var chr1, chr2, chr3; var enc1, enc2, enc3, enc4; var i = 0; input = input.replace(/[^A-Za-z0-9\+\/\=]/g, ""); do {enc1 = keyStr.indexOf(input.charAt(i++)); enc2 = keyStr.indexOf(input.charAt(i++)); enc3 = keyStr.indexOf(input.charAt(i++)); enc4 = keyStr.indexOf(input.charAt(i++)); chr1 = enc1 << 2 | enc2 >> 4; chr2 = (enc2 & 15) << 4 | enc3 >> 2; chr3 = (enc3 & 3) << 6 | enc4; output = output + String.fromCharCode(chr1); if (enc3 !== 64) {output = output + String.fromCharCode(chr2);} if (enc4 !== 64) {output = output + String.fromCharCode(chr3);} } while (i < input.length); return output}; function intArrayFromBase64(s) {try {var decoded = decodeBase64(s); var bytes = new Uint8Array(decoded.length); for (var i = 0;i < decoded.length;++i) {bytes[i] = decoded.charCodeAt(i);} return bytes} catch (_) {throw new Error("Converting base64 string to bytes failed.")} } function tryParseAsDataURI(filename) {if (!isDataURI(filename)) {return } return intArrayFromBase64(filename.slice(dataURIPrefix.length))} var wasmImports = {"a": _emitHeader, "d": _emitZone, "c": _emscripten_memcpy_big, "b": _emscripten_resize_heap}; createWasm(); Module["_malloc"] = function () {return (Module["_malloc"] = Module["asm"]["g"]).apply(null, arguments)}; Module["_loadpdta"] = function () {return (Module["_loadpdta"] = Module["asm"]["h"]).apply(null, arguments)}; Module["_findPreset"] = function () {return (Module["_findPreset"] = Module["asm"]["i"]).apply(null, arguments)}; Module["_shdrref"] = function () {return (Module["_shdrref"] = Module["asm"]["j"]).apply(null, arguments)}; Module["_presetRef"] = function () {return (Module["_presetRef"] = Module["asm"]["k"]).apply(null, arguments)}; Module["_instRef"] = function () {return (Module["_instRef"] = Module["asm"]["l"]).apply(null, arguments)}; Module["_fflush"] = function () {return (Module["_fflush"] = Module["asm"]["n"]).apply(null, arguments)}; Module["_free"] = function () {return (Module["_free"] = Module["asm"]["o"]).apply(null, arguments)}; var stackSave = function () {return (stackSave = Module["asm"]["p"]).apply(null, arguments)}; var stackRestore = function () {return (stackRestore = Module["asm"]["q"]).apply(null, arguments)}; var stackAlloc = function () {return (stackAlloc = Module["asm"]["r"]).apply(null, arguments)}; Module["ccall"] = ccall; Module["AsciiToString"] = AsciiToString; var calledRun; dependenciesFulfilled = function runCaller() {if (!calledRun) run(); if (!calledRun) dependenciesFulfilled = runCaller;}; function run() {if (runDependencies > 0) {return } preRun(); if (runDependencies > 0) {return } function doRun() {if (calledRun) return; calledRun = true; Module["calledRun"] = true; if (ABORT) return; initRuntime(); readyPromiseResolve(Module); if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"](); postRun();} if (Module["setStatus"]) {Module["setStatus"]("Running..."); setTimeout(function () {setTimeout(function () {Module["setStatus"]("");}, 1); doRun();}, 1);} else {doRun();} } if (Module["preInit"]) {if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]]; while (Module["preInit"].length > 0) {Module["preInit"].pop()();} } run();


      return Module.ready
}

  );
})();

export {Module as default};
