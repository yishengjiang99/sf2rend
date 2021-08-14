/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./chart/chart.js":
/*!************************!*\
  !*** ./chart/chart.js ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"WIDTH\": () => (/* binding */ WIDTH),\n/* harmony export */   \"HEIGHT\": () => (/* binding */ HEIGHT),\n/* harmony export */   \"resetCanvas\": () => (/* binding */ resetCanvas),\n/* harmony export */   \"chart\": () => (/* binding */ chart),\n/* harmony export */   \"mkcanvas\": () => (/* binding */ mkcanvas),\n/* harmony export */   \"renderFrames\": () => (/* binding */ renderFrames),\n/* harmony export */   \"mkdiv\": () => (/* binding */ mkdiv),\n/* harmony export */   \"wrapDiv\": () => (/* binding */ wrapDiv),\n/* harmony export */   \"wrapList\": () => (/* binding */ wrapList)\n/* harmony export */ });\n//@ts-ignore\nconst WIDTH = 480; // / 2,\nconst HEIGHT = 320;\nfunction get_w_h(canvasCtx) {\n  return [\n    canvasCtx.canvas.getAttribute(\"width\")\n      ? parseInt(canvasCtx.canvas.getAttribute(\"width\"))\n      : WIDTH,\n    canvasCtx.canvas.getAttribute(\"height\")\n      ? parseInt(canvasCtx.canvas.getAttribute(\"height\"))\n      : HEIGHT,\n  ];\n}\nfunction resetCanvas(c) {\n  if (!c) return;\n  const canvasCtx = c;\n  const [_width, _height] = get_w_h(canvasCtx);\n  canvasCtx.clearRect(0, 0, _width, _height);\n  canvasCtx.fillStyle = \"black\";\n  canvasCtx.fillRect(0, 0, _width, _height);\n}\nfunction chart(canvasCtx, dataArray) {\n  resetCanvas(canvasCtx);\n  const [_width, _height] = get_w_h(canvasCtx);\n  let max = 0,\n    min = 0,\n    x = 0;\n  let iWIDTH = _width / dataArray.length; //strokeText(`r m s : ${sum / bufferLength}`, 10, 20, 100)\n  for (let i = 1; i < dataArray.length; i++) {\n    max = dataArray[i] > max ? dataArray[i] : max;\n  }\n  canvasCtx.beginPath();\n  canvasCtx.lineWidth = 1;\n  canvasCtx.strokeStyle = \"rbga(0xff,0xff,0x00,.5)\";\n  canvasCtx.moveTo(0, _height / 2);\n  canvasCtx.lineTo(_width, _height / 2);\n  canvasCtx.stroke();\n  canvasCtx.lineWidth = 2;\n  canvasCtx.strokeStyle = \"white\";\n  canvasCtx.moveTo(0, _height / 2);\n  for (let i = 1; i < dataArray.length; i++) {\n    x += iWIDTH;\n    canvasCtx.lineTo(x, _height / 2 - (_height / 2) * dataArray[i]);\n  }\n  canvasCtx.stroke();\n  canvasCtx.restore();\n  canvasCtx.font = \"1em Arial\";\n}\nfunction mkcanvas(params = {}) {\n  const { width, height, container, title } = Object.assign(\n    {\n      container: document.body,\n      title: \"\",\n      width: WIDTH,\n      height: HEIGHT,\n    },\n    params\n  );\n  const canvas = document.createElement(\"canvas\");\n  canvas.setAttribute(\"width\", `${width}`);\n  canvas.setAttribute(\"height\", `${height}`);\n  const canvasCtx = canvas.getContext(\"2d\");\n  canvasCtx.lineWidth = 2;\n  canvasCtx.strokeStyle = \"white\";\n  canvasCtx.fillStyle = \"black\";\n  canvasCtx.font = \"2em\";\n  const wrap = mkdiv(\"div\", {}, [title ? mkdiv(\"h5\", {}, title) : \"\", canvas]);\n  container.append(wrap);\n  canvas.ondblclick = () => resetCanvas(canvasCtx);\n  return canvasCtx;\n}\nasync function renderFrames(\n  canvsCtx,\n  arr,\n  fps = 60,\n  samplesPerFrame = 1024\n) {\n  let nextframe,\n    offset = 0;\n  while (arr.length > offset) {\n    if (!nextframe || performance.now() > nextframe) {\n      chart(canvsCtx, arr.slice(offset, offset + samplesPerFrame));\n      nextframe = 1 / fps + performance.now();\n      offset += samplesPerFrame / 4;\n    }\n    await new Promise((r) => requestAnimationFrame(r));\n  }\n  function onclick({ x, target }) {\n    offset += (x < target.clientWidth / 2 ? -1 : 1) * samplesPerFrame;\n    chart(canvsCtx, arr.slice(offset, offset + samplesPerFrame));\n    const existingSlider = canvsCtx.canvas?.parentElement?.querySelector(\n      \"input[type='range']\"\n    );\n    const slider =\n      existingSlider ||\n      mkdiv(\"input\", {\n        type: \"range\",\n        min: -10,\n        max: 100,\n        value: 100,\n        step: 0,\n        oninput: (e) => {\n          const { max, value } = e.target;\n          offset = (arr.length * parseInt(value)) / parseInt(max);\n          chart(canvsCtx, arr.slice(offset, offset + samplesPerFrame));\n        },\n      }).attachTo(canvsCtx.canvas.parentElement);\n  }\n  canvsCtx.canvas.addEventListener(\"click\", onclick);\n  canvsCtx.canvas.addEventListener(\"dblclick\", function (e) {\n    e.x;\n    offset += (e.x < canvsCtx.canvas.width / 2 ? -1 : 1) * samplesPerFrame;\n    chart(canvsCtx, arr.slice(offset, offset + samplesPerFrame));\n  });\n}\nfunction mkdiv(type, attr = {}, children = \"\") {\n  // if (attr && typeof attr != \"object\" && !children)\n  //   return mkdiv(type, {}, attr);\n  const div = document.createElement(type);\n  for (const key in attr) {\n    if (key.match(/on(.*)/)) {\n      div.addEventListener(key.match(/on(.*)/)[1], attr[key]);\n    } else {\n      div.setAttribute(key, attr[key]);\n    }\n  }\n  const charray = !Array.isArray(children) ? [children] : children;\n  charray.forEach((c) => {\n    typeof c == \"string\" ? (div.innerHTML += c) : div.append(c);\n  });\n  return div;\n}\nHTMLElement.prototype.attachTo = function (parent) {\n  parent.append(this);\n  return this;\n};\nHTMLElement.prototype.wrapWith = function (tag) {\n  const parent = mkdiv(tag);\n  parent.append(this);\n  return parent;\n};\n\nfunction wrapDiv(div, tag, attrs = {}) {\n  return mkdiv(tag, attrs, [div]);\n}\nfunction wrapList(divs) {\n  return mkdiv(\"div\", {}, divs);\n}\n\n\n//# sourceURL=webpack://sf2rend/./chart/chart.js?");

/***/ }),

/***/ "./fetch-drop-ship/fetch-drop-ship.js":
/*!********************************************!*\
  !*** ./fetch-drop-ship/fetch-drop-ship.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"requestDownload\": () => (/* binding */ requestDownload),\n/* harmony export */   \"getWorker\": () => (/* binding */ getWorker)\n/* harmony export */ });\nasync function requestDownload(worker, sf2_program) {\n  return worker.postMessage({\n    url: sf2_program.url,\n    smpls: Object.values(sf2_program.shdrMap).map((sh) => ({\n      sampleId: sh.SampleId,\n      range: sh.range,\n      loops: sh.loops,\n    })),\n  });\n}\n\nfunction getWorker(destinationPort) {\n  const worker = new Worker(\n    URL.createObjectURL(\n      new Blob([workercode()], { type: \"application/javascript\" })\n    )\n  );\n  worker.postMessage({ destination: destinationPort }, [destinationPort]);\n  return worker;\n}\n\nfunction workercode() {\n  return /* javascript */ /* javascript */ `\n  self.addEventListener(\"message\",({data:{url, smpls, destination,...data}})=>{\n    if(destination) {\n      self.destport=destination;;\n      self.destport.onmessage=({data})=>postMessage(data);\n    }\n    if(url&&smpls){\n      loadsdta(url,smpls,self.destport);\n    }\n    if(data && self.destport) self.destport.postMessage(data);\n  });\n\n  async function loadsdta(url,smpls,destination) {\n    let min, max;\n    const segments = {};\n    for (const { range } of smpls) {\n      min = min ? (range[0] < min ? range[0] : min) : range[0];\n      max = max ? (range[1] > max ? range[1] : max) : range[1];\n    }\n    for (const { range, sampleId } of smpls) {\n      segments[sampleId] = {\n        startByte:range[0] - min,\n        endByte: range[1] - min\n      }\n    }\n    return fetch(url, {\n      headers: {\n        range: \"bytes=\"+[min, max].join(\"-\")\n      },\n    }).then((res) => {\n      if (res.ok === false) throw \"fetch\" + url + \"failed \";\n  \n      destination.postMessage(\n        { stream: res.body, segments, nsamples: (max-min+1)/2 },\n        [res.body]\n      );\n      return res.bodyUsed;\n    });\n  }\n  `;\n}\n\n\n//# sourceURL=webpack://sf2rend/./fetch-drop-ship/fetch-drop-ship.js?");

/***/ }),

/***/ "./lpf/lpf.js":
/*!********************!*\
  !*** ./lpf/lpf.js ***!
  \********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"LowPassFilterNode\": () => (/* binding */ LowPassFilterNode),\n/* harmony export */   \"getwasm\": () => (/* binding */ getwasm),\n/* harmony export */   \"mkLPF\": () => (/* binding */ mkLPF)\n/* harmony export */ });\nlet wasmbin;\nclass LowPassFilterNode extends AudioWorkletNode {\n  static async init(ctx) {\n    await ctx.audioWorklet\n      .addModule(\"lpf/lpf.proc.js\")\n      .catch((e) => console.trace(e));\n    if (!wasmbin) wasmbin = await getwasm();\n  }\n  constructor(ctx, cutoffFrequency) {\n    if (cutoffFrequency > ctx.sampleRate * 0.5) {\n      cutoffFrequency = ctx.sampleRate * 0.5;\n    }\n    super(ctx, \"lpf\", {\n      numberOfInputs: 2,\n      numberOfOutputs: 1,\n      processorOptions: {\n        wasmbin,\n        filterFC: cutoffFrequency / ctx.sampleRate,\n      },\n    });\n  }\n  set frequency(freq) {\n    console.log(\"set f\", freq);\n    this.port.postMessage(freq / this.context.sampleRate);\n  }\n  modulate(input) {\n    input.connect(this, 0, 1);\n  }\n}\nconst getwasm = async () =>\n  new Uint8Array(await fetch(\"lpf/lpf.wasm\").then((res) => res.arrayBuffer()));\n\nfunction mkLPF(fc, wasmbin) {\n  const instance = new WebAssembly.Instance(\n    new WebAssembly.Module(wasmbin),\n    {}\n  );\n  if (fc > 0.5) throw \"invalid biquad pc bc filter threshold over .5 nyquist)\";\n  instance.exports.newLpf(0, fc);\n  return function lpf(input, detune = 0) {\n    return instance.exports.process_input(0, input, detune);\n  };\n}\n\n\n//# sourceURL=webpack://sf2rend/./lpf/lpf.js?");

/***/ }),

/***/ "./mkdiv/mkdiv.js":
/*!************************!*\
  !*** ./mkdiv/mkdiv.js ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"mkdiv\": () => (/* binding */ mkdiv),\n/* harmony export */   \"mksvg\": () => (/* binding */ mksvg),\n/* harmony export */   \"logdiv\": () => (/* binding */ logdiv),\n/* harmony export */   \"wrapDiv\": () => (/* binding */ wrapDiv),\n/* harmony export */   \"wrapList\": () => (/* binding */ wrapList)\n/* harmony export */ });\nfunction mkdiv(type, attr = {}, children = \"\") {\n  // if (attr && typeof attr != \"object\" && !children)\n  //   return mkdiv(type, {}, attr);\n  const div = document.createElement(type);\n  for (const key in attr) {\n    if (key.match(/on(.*)/)) {\n      div.addEventListener(key.match(/on(.*)/)[1], attr[key]);\n    } else {\n      div.setAttribute(key, attr[key]);\n    }\n  }\n  const charray = !Array.isArray(children) ? [children] : children;\n  charray.forEach((c) => {\n    typeof c == \"string\" ? (div.innerHTML += c) : div.append(c);\n  });\n  return div;\n}\nfunction mksvg(tag, attrs = {}, children = []) {\n  var el = document.createElementNS(\"http://www.w3.org/2000/svg\", tag);\n  for (var k in attrs) {\n    if (k == \"xlink:href\") {\n      el.setAttributeNS(\"http://www.w3.org/1999/xlink\", \"href\", attrs[k]);\n    } else {\n      el.setAttribute(k, attrs[k]);\n    }\n  }\n  const charray = !Array.isArray(children) ? [children] : children;\n  charray.forEach((c) => el.append(c));\n  return el;\n}\nHTMLElement.prototype.attachTo = function (parent) {\n  parent.append(this);\n  return this;\n};\nHTMLElement.prototype.wrapWith = function (tag) {\n  const parent = mkdiv(tag);\n  parent.append(this);\n  return parent;\n};\nfunction logdiv(\n  infoPanel = mkdiv(\"pre\", {\n    style:\n      \"width:30em;min-height:299px;scroll-width:0;max-height:299px;overflow-y:scroll\",\n  })\n) {\n  const logs = [];\n  let rx1 = \"\",\n    rx2 = \"\";\n  const stderr = (str) => {\n    rx1 = str;\n    rx2 = str;\n  };\n  const stdout = (log) => {\n    logs.push((performance.now() / 1e3).toFixed(3) + \": \" + log);\n    if (logs.length > 100) logs.shift();\n    infoPanel.innerHTML = rx1 + \"\\n\" + logs.join(\"\\n\");\n    infoPanel.scrollTop = infoPanel.scrollHeight;\n  };\n  return {\n    stderr,\n    stdout,\n    infoPanel,\n    errPanel: mkdiv(\"span\"),\n  };\n}\nfunction wrapDiv(div, tag, attrs = {}) {\n  return mkdiv(tag, attrs, [div]);\n}\nfunction wrapList(divs, tag = \"div\") {\n  return mkdiv(tag, {}, divs);\n}\n\n\n//# sourceURL=webpack://sf2rend/./mkdiv/mkdiv.js?");

/***/ }),

/***/ "./node_modules/parse-sf2/dist/Zone.js":
/*!*********************************************!*\
  !*** ./node_modules/parse-sf2/dist/Zone.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"SFGenerator\": () => (/* binding */ SFGenerator),\n/* harmony export */   \"cent2hz\": () => (/* binding */ cent2hz),\n/* harmony export */   \"timecent2sec\": () => (/* binding */ timecent2sec),\n/* harmony export */   \"centidb2gain\": () => (/* binding */ centidb2gain),\n/* harmony export */   \"SFZone\": () => (/* binding */ SFZone)\n/* harmony export */ });\n/* harmony import */ var _sf_types_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./sf.types.js */ \"./node_modules/parse-sf2/dist/sf.types.js\");\n\n/* eslint-disable @typescript-eslint/explicit-module-boundary-types */\nclass SFGenerator {\n    constructor(_operator, int16) {\n        this._operator = _operator;\n        this.int16 = int16;\n        this.from = 0;\n        this.ibagId = -1;\n        this.pbagId = -1;\n    }\n    add(modgen) {\n        this.int16 += modgen.int16;\n    }\n    get operator() {\n        return this._operator;\n    }\n    get range() {\n        return { lo: this.int16 & 0x7f, hi: (this.int16 >> 8) & 0xff };\n    }\n    get u16() {\n        return this.int16 & 0x0ff0; // | (this.hi << 8);\n    }\n    get s16() {\n        return this.int16;\n    }\n    set s16(val) {\n        this.int16 += val;\n    }\n}\nfunction cent2hz(centiHz) {\n    return 8.176 * Math.pow(2, centiHz / 1200.0);\n}\nfunction timecent2sec(timecent) {\n    return Math.pow(2, timecent / 1200.0);\n}\nfunction centidb2gain(centibel) {\n    return Math.pow(10, centibel / 200);\n}\nclass SFZone {\n    constructor(ids) {\n        this.keyRange = { lo: -1, hi: 129 };\n        this.velRange = { lo: -1, hi: 129 };\n        this._shdr = {\n            name: 'init',\n            start: 0,\n            end: 0,\n            startLoop: 0,\n            endLoop: 0,\n            originalPitch: 60,\n            sampleRate: -1,\n            pitchCorrection: 0,\n            sampleLink: 0,\n            sampleType: 0,\n        };\n        this.sampleOffsets = [0, 0, 0, 0];\n        this._modLFO = SFZone.defaultLFO;\n        this._vibrLFO = SFZone.defaultLFO;\n        this._modEnv = SFZone.defaultEnv;\n        this._volEnv = SFZone.defaultEnv;\n        this.lpf = { cutoff: 0, q: -1 };\n        this.chorus = 0; /* chrous web %/10 */ /* chrous web %/10 */\n        this.reverbSend = 0; /* percent of signal to send back.. in 0.1% units*/\n        this.pan = -1; /* shift to right percent */\n        this.attenuate = 0; /*db in attentuation*/\n        this.instrumentID = -1;\n        this._rootkey = -1;\n        this.tuning = 0;\n        this.sampleMode = _sf_types_js__WEBPACK_IMPORTED_MODULE_0__.LOOPMODES.CONTINUOUS_LOOP;\n        this.sampleID = -1;\n        this.generators = [];\n        if (ids) {\n            if (ids.pbagId)\n                this.pbagId = ids.pbagId;\n            if (ids.ibagId)\n                this.ibagId = ids.ibagId;\n        }\n    }\n    serialize() {\n        return {\n            ...this,\n            modLFO: this._modLFO,\n            vibrLFO: this._vibrLFO,\n            modEnv: this._modEnv,\n            volEnv: this._volEnv,\n            sample: this.sample,\n        };\n    }\n    get modLFO() {\n        if (this._modLFO) {\n            this._modLFO = SFZone.defaultLFO;\n        }\n        return this._modLFO;\n    }\n    set modLFO(value) {\n        this._modLFO = value;\n    }\n    get vibrLFO() {\n        return this._vibrLFO;\n    }\n    set vibrLFO(value) {\n        this._vibrLFO = value;\n    }\n    get modEnv() {\n        return this._modEnv;\n    }\n    set modEnv(value) {\n        this._modEnv = value;\n    }\n    get volEnv() {\n        if (!this._modEnv) {\n            this._modEnv = SFZone.defaultEnv;\n        }\n        return this._volEnv;\n    }\n    set volEnv(value) {\n        this._volEnv = value;\n    }\n    get scaleTuning() {\n        return this.generators[_sf_types_js__WEBPACK_IMPORTED_MODULE_0__.sf_gen_id.scaleTuning]\n            ? this.generators[_sf_types_js__WEBPACK_IMPORTED_MODULE_0__.sf_gen_id.scaleTuning].s16\n            : 0;\n    }\n    get keynumToVolEnvDecay() {\n        return this.generators[_sf_types_js__WEBPACK_IMPORTED_MODULE_0__.sf_gen_id.keynumToVolEnvDecay]\n            ? this.generators[_sf_types_js__WEBPACK_IMPORTED_MODULE_0__.sf_gen_id.keynumToVolEnvDecay].s16\n            : 0;\n    }\n    get rootkey() {\n        return this._rootkey > -1 ? this._rootkey : this.sample.originalPitch;\n    }\n    set rootkey(value) {\n        this._rootkey = value;\n    }\n    get pitch() {\n        return this.rootkey * 100 + this.tuning - this.sample.pitchCorrection;\n    }\n    set sample(shdr) {\n        this._shdr = shdr;\n    }\n    get sample() {\n        return {\n            ...this._shdr,\n            start: this._shdr.start + this.sampleOffsets[0],\n            end: this._shdr.end + this.sampleOffsets[1],\n            startLoop: this._shdr.startLoop + this.sampleOffsets[2],\n            endLoop: this._shdr.endLoop + this.sampleOffsets[3],\n        };\n    }\n    mergeWith(zoneb, from = 0) {\n        for (const g of Object.values(zoneb.generators)) {\n            this.applyGenVal(g, from);\n        }\n    }\n    setVal(gen) {\n        this.generators[gen.operator] = gen;\n    }\n    increOrSet(gen) {\n        if (!this.generators[gen.operator])\n            this.generators[gen.operator] = gen;\n        else\n            this.generators[gen.operator].s16 += gen.s16;\n    }\n    applyGenVals() {\n        this.generators.forEach((g) => this.applyGenVal(g, -1));\n    }\n    applyGenVal(gen, from) {\n        switch (gen.operator) {\n            case startAddrsOffset:\n                this.sampleOffsets[0] += gen.s16;\n                break;\n            case endAddrsOffset:\n                this.sampleOffsets[1] += gen.s16;\n                break;\n            case startloopAddrsOffset:\n                this.sampleOffsets[2] += gen.s16;\n                break;\n            case endloopAddrsOffset:\n                this.sampleOffsets[3] += gen.s16;\n                break;\n            case startAddrsCoarseOffset:\n                this.sampleOffsets[0] += gen.s16 << 15;\n                break;\n            case modLfoToPitch:\n                this.modLFO.effects.pitch = gen.s16;\n                break;\n            case vibLfoToPitch:\n                this.vibrLFO.effects.pitch = gen.s16;\n                break;\n            case modEnvToPitch:\n                this.modEnv.effects.pitch = gen.s16;\n                break;\n            case initialFilterFc:\n                this.lpf.cutoff = gen.s16;\n                break;\n            case initialFilterQ:\n                this.lpf.q = gen.s16;\n                break;\n            case modLfoToFilterFc:\n                this.modLFO.effects.filter = gen.s16;\n                break;\n            case modEnvToFilterFc:\n                this.modEnv.effects.filter = gen.s16;\n                break;\n            case endAddrsCoarseOffset:\n                this.sampleOffsets[1] += gen.s16 << 15;\n                break;\n            case modLfoToVolume:\n                this.modLFO.effects.volume = gen.s16;\n                break;\n            case unused1:\n            case chorusEffectsSend:\n                this.chorus = gen.s16;\n                break;\n            case reverbEffectsSend:\n                this.reverbSend = gen.s16;\n                break;\n            case pan:\n                this.pan = gen.s16;\n                break;\n            case unused2:\n            case unused3:\n            case unused4:\n                break;\n            case delayModLFO:\n                this.modLFO.delay = gen.s16;\n                break;\n            case freqModLFO:\n                this.modLFO.freq = gen.s16;\n                break;\n            case delayVibLFO:\n                this.vibrLFO.delay = gen.s16;\n                break;\n            case freqVibLFO:\n                this.vibrLFO.freq = gen.s16;\n                break;\n            case delayModEnv:\n                this.modEnv.phases.delay = gen.s16;\n                break;\n            case attackModEnv:\n                this.modEnv.phases.attack = gen.s16;\n                break;\n            case holdModEnv:\n                this.modEnv.default = false;\n                this.modEnv.phases.hold = gen.s16; // timecent2sec(gen.s16);\n                break;\n            case decayModEnv:\n                this.volEnv.default = false;\n                this.modEnv.phases.decay = gen.s16; //timecent2sec(gen.s16);\n                break;\n            case sustainModEnv /* percent of fullscale*/:\n                this.modEnv.default = false;\n                this.modEnv.sustain = gen.s16;\n                break;\n            case releaseModEnv:\n                this.modEnv.phases.release = gen.s16;\n                break;\n            case keynumToModEnvHold:\n            case keynumToModEnvDecay:\n                break;\n            case delayVolEnv:\n                this.volEnv.phases.delay = gen.s16;\n                break;\n            case attackVolEnv /*This is the time, in absolute timecents, from the end of the Volume\n            Envelope Delay Time until the point at which the Volume Envelope\n            value reaches its peak. Note that the attack is “convex”; the curve is\n            nominally such that when applied to the decibel volume parameter, the\n            result is linear in amplitude. A value of 0 indicates a 1 second attack\n            time. A negative value indicates a time less than one second; a positive\n            value a time longer than one second. The most negative number (-\n            32768) conventionally indicates instantaneous attack. For example, an\n            attack time of 10 msec would be 1200log2(.01) = -7973.*/:\n                this.volEnv.phases.attack = gen.s16;\n                break;\n            case holdVolEnv:\n                this.volEnv.phases.hold = gen.s16;\n                break;\n            case decayVolEnv:\n                this.volEnv.default = false;\n                this.volEnv.phases.decay = gen.s16; //timecent2sec(gen.s16);\n                break;\n            /** \\']\n            \n            http://www.synthfont.com/SFSPEC21.PDF  is the decrease in level, expressed in centibels, to which the\n            Volume Envelope value ramps during the decay phase. For the Volume\n            Envelope, the sustain level is best expressed in centibels of attenuation\n            from full scale. A value of 0 indicates the sustain level is full level; this\n            implies a zero duration of decay phase regardless of decay time. A\n            positive value indicates a decay to the corresponding level. Values less\n            than zero are to be interpreted as zero; conventionally 1000 indicates\n            full attenuation. For example, a sustain level which corresponds to an\n      absolute value 12dB below of peak would be 120. */\n            case sustainVolEnv:\n                this.volEnv.sustain = gen.s16;\n                this.volEnv.default = false;\n                break;\n            /*This is the time, in absolute timecents, for a 100% change in the\n      Volume Envelope value during release phase. For the Volume\n      Envelope, the release phase linearly ramps toward zero from the current\n      level, causing a constant dB change for each time unit. If the current\n      level were full scale, the Volume Envelope Release Time would be the\n      time spent in release phase until 100dB attenuation were reached. A\n      value of 0 indicates a 1-second decay time for a release from full level.\n      SoundFont 2.01 Technical Specification - Page 45 - 08/05/98 12:43 PM\n      A negative value indicates a time less than one second; a positive value\n      a time longer than one second.  http://www.synthfont.com/SFSPEC21.PDF For example, . For example, a release time of 10 msec\n      would be 1200log2(.01) = -7973. */\n            case releaseVolEnv:\n                this.volEnv.phases.release = gen.s16; //timecent2sec(gen.s16);\n                break;\n            case keynumToVolEnvHold:\n            case keynumToVolEnvDecay:\n                break;\n            case instrument:\n                this.instrumentID = gen.s16;\n                break;\n            case reserved1:\n                break;\n            case keyRange:\n                this.keyRange.lo = Math.max(gen.range.lo, this.keyRange.lo);\n                this.keyRange.hi = Math.min(gen.range.hi, this.keyRange.hi);\n                break;\n            case velRange:\n                this.velRange = gen.range;\n                break;\n            case startloopAddrsCoarse:\n                this.sampleOffsets[2] += gen.s16 << 15;\n                break;\n            case keynum:\n                break;\n            case velocity:\n                break;\n            case initialAttenuation:\n                this.attenuate = gen.s16;\n                break;\n            case reserved2:\n                break;\n            case endloopAddrsCoarse:\n                this.sampleOffsets[3] += gen.s16 << 15;\n                // this._shdr.endLoop += 15 << gen.s16;\n                break;\n            case coarseTune:\n                this.tuning += gen.s16 * 100; //semitone\n                break;\n            case fineTune:\n                this.tuning += gen.s16; //tone\n                break;\n            case sampleID:\n                //onsole.log('apply sample ' + gen.s16 + 'cur ');\n                if (this.sampleID != -1) {\n                    //throw 'applying to existing sample id';\n                }\n                this.sampleID = gen.s16;\n                break;\n            case sampleModes:\n                break;\n            case reserved3:\n                break;\n            case scaleTuning:\n                break;\n            case exclusiveClass:\n                break;\n            case overridingRootKey:\n                if (gen.s16 > -1)\n                    this.rootkey = gen.s16;\n                break;\n            case unused5:\n                break;\n            case endOper:\n                break;\n            default:\n                throw 'unexpected operator';\n        }\n        gen.from = from || -1;\n        if (from != -1)\n            this.generators.push(gen);\n    }\n}\nSFZone.defaultEnv = {\n    default: true,\n    phases: {\n        decay: -1000,\n        attack: -12000,\n        delay: -12000,\n        release: -3000,\n        hold: -12000,\n    },\n    sustain: 300,\n    effects: { pitch: 0, filter: 0, volume: 0 },\n};\nSFZone.defaultLFO = {\n    delay: 0,\n    freq: 1,\n    effects: { pitch: 0, filter: 0, volume: 0 },\n};\nconst { startAddrsOffset, endAddrsOffset, startloopAddrsOffset, endloopAddrsOffset, startAddrsCoarseOffset, modLfoToPitch, vibLfoToPitch, modEnvToPitch, initialFilterFc, initialFilterQ, modLfoToFilterFc, modEnvToFilterFc, endAddrsCoarseOffset, modLfoToVolume, unused1, chorusEffectsSend, reverbEffectsSend, pan, unused2, unused3, unused4, delayModLFO, freqModLFO, delayVibLFO, freqVibLFO, delayModEnv, attackModEnv, holdModEnv, decayModEnv, sustainModEnv, releaseModEnv, keynumToModEnvHold, keynumToModEnvDecay, delayVolEnv, attackVolEnv, holdVolEnv, decayVolEnv, sustainVolEnv, releaseVolEnv, keynumToVolEnvHold, keynumToVolEnvDecay, instrument, reserved1, keyRange, velRange, startloopAddrsCoarse, keynum, velocity, initialAttenuation, reserved2, endloopAddrsCoarse, coarseTune, fineTune, sampleID, sampleModes, reserved3, scaleTuning, exclusiveClass, overridingRootKey, unused5, endOper, } = _sf_types_js__WEBPACK_IMPORTED_MODULE_0__.sf_gen_id;\n\n\n//# sourceURL=webpack://sf2rend/./node_modules/parse-sf2/dist/Zone.js?");

/***/ }),

/***/ "./node_modules/parse-sf2/dist/aba.js":
/*!********************************************!*\
  !*** ./node_modules/parse-sf2/dist/aba.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"readAB\": () => (/* binding */ readAB)\n/* harmony export */ });\nfunction readAB(arb) {\n    const u8b = new Uint8Array(arb);\n    let _offset = 0;\n    function get8() {\n        return u8b[_offset++];\n    }\n    function getStr(n) {\n        let str = '';\n        let nullterm = 0;\n        for (let i = 0; i < n; i++) {\n            const c = get8();\n            if (c == 0x00)\n                nullterm = 1;\n            if (nullterm == 0)\n                str += String.fromCharCode(c);\n        }\n        return str;\n    }\n    function get32() {\n        return get8() | (get8() << 8) | (get8() << 16) | (get8() << 24);\n    }\n    const get16 = () => get8() | (get8() << 8);\n    const getS16 = () => {\n        const u16 = get16();\n        if (u16 & 0x8000)\n            return -0x10000 + u16;\n        else\n            return u16;\n    };\n    const readN = (n) => {\n        const ret = u8b.slice(_offset, n);\n        _offset += n;\n        return ret;\n    };\n    function varLenInt() {\n        let v = 0;\n        let n = get8();\n        v = n & 0x7f;\n        while (n & 0x80) {\n            n = get8();\n            v = (v << 7) | (n & 0x7f);\n        }\n        return n;\n    }\n    const skip = (n) => {\n        _offset = _offset + n;\n    };\n    const read32String = () => getStr(4);\n    const readNString = (n) => getStr(n);\n    return {\n        skip,\n        get8,\n        get16,\n        getS16,\n        readN,\n        read32String,\n        varLenInt,\n        get32,\n        readNString,\n        get offset() {\n            return _offset;\n        },\n        set offset(n) {\n            _offset = n;\n        },\n    };\n}\n// const r = readAB([1, 2, 3, 4, 4, 4, 4, 5, 5, 2, 3, 3, 4]);\n// r.get16();\n// r.get8();\n// r.read32String();\n// console.log(r.offset);\n\n\n//# sourceURL=webpack://sf2rend/./node_modules/parse-sf2/dist/aba.js?");

/***/ }),

/***/ "./node_modules/parse-sf2/dist/index.js":
/*!**********************************************!*\
  !*** ./node_modules/parse-sf2/dist/index.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"LOOPMODES\": () => (/* reexport safe */ _sf_types_js__WEBPACK_IMPORTED_MODULE_0__.LOOPMODES),\n/* harmony export */   \"ch_state\": () => (/* reexport safe */ _sf_types_js__WEBPACK_IMPORTED_MODULE_0__.ch_state),\n/* harmony export */   \"generatorNames\": () => (/* reexport safe */ _sf_types_js__WEBPACK_IMPORTED_MODULE_0__.generatorNames),\n/* harmony export */   \"mergeTypes\": () => (/* reexport safe */ _sf_types_js__WEBPACK_IMPORTED_MODULE_0__.mergeTypes),\n/* harmony export */   \"sf_gen_id\": () => (/* reexport safe */ _sf_types_js__WEBPACK_IMPORTED_MODULE_0__.sf_gen_id),\n/* harmony export */   \"SFGenerator\": () => (/* reexport safe */ _Zone_js__WEBPACK_IMPORTED_MODULE_1__.SFGenerator),\n/* harmony export */   \"SFZone\": () => (/* reexport safe */ _Zone_js__WEBPACK_IMPORTED_MODULE_1__.SFZone),\n/* harmony export */   \"cent2hz\": () => (/* reexport safe */ _Zone_js__WEBPACK_IMPORTED_MODULE_1__.cent2hz),\n/* harmony export */   \"centidb2gain\": () => (/* reexport safe */ _Zone_js__WEBPACK_IMPORTED_MODULE_1__.centidb2gain),\n/* harmony export */   \"timecent2sec\": () => (/* reexport safe */ _Zone_js__WEBPACK_IMPORTED_MODULE_1__.timecent2sec),\n/* harmony export */   \"PDTA\": () => (/* reexport safe */ _pdta_js__WEBPACK_IMPORTED_MODULE_2__.PDTA),\n/* harmony export */   \"SF2File\": () => (/* reexport safe */ _sffile_js__WEBPACK_IMPORTED_MODULE_3__.SF2File),\n/* harmony export */   \"sfbkstream\": () => (/* reexport safe */ _sfbkstream_js__WEBPACK_IMPORTED_MODULE_4__.sfbkstream)\n/* harmony export */ });\n/* harmony import */ var _sf_types_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./sf.types.js */ \"./node_modules/parse-sf2/dist/sf.types.js\");\n/* harmony import */ var _Zone_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Zone.js */ \"./node_modules/parse-sf2/dist/Zone.js\");\n/* harmony import */ var _pdta_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./pdta.js */ \"./node_modules/parse-sf2/dist/pdta.js\");\n/* harmony import */ var _sffile_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./sffile.js */ \"./node_modules/parse-sf2/dist/sffile.js\");\n/* harmony import */ var _sfbkstream_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./sfbkstream.js */ \"./node_modules/parse-sf2/dist/sfbkstream.js\");\n\n\n\n\n\n\n\n\n//# sourceURL=webpack://sf2rend/./node_modules/parse-sf2/dist/index.js?");

/***/ }),

/***/ "./node_modules/parse-sf2/dist/pdta.js":
/*!*********************************************!*\
  !*** ./node_modules/parse-sf2/dist/pdta.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"PDTA\": () => (/* binding */ PDTA)\n/* harmony export */ });\n/* harmony import */ var _Zone_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Zone.js */ \"./node_modules/parse-sf2/dist/Zone.js\");\n\nclass PDTA {\n    constructor(r) {\n        this.phdr = [];\n        this.pbag = [];\n        this.pgen = [];\n        this.pmod = [];\n        this.iheaders = [];\n        this.igen = [];\n        this.imod = [];\n        this.ibag = [];\n        this.shdr = [];\n        this.findPreset = (pid, bank_id = 0, key = -1, vel = -1) => {\n            const [phdr, pbag, shdr] = [this.phdr, this.pbag, this.shdr];\n            let phd, i = 0;\n            for (i = 0; i < phdr.length - 1; i++) {\n                if (phdr[i].presetId != pid || phdr[i].bankId != bank_id) {\n                    continue;\n                }\n                phd = phdr[i];\n                break;\n            }\n            if (!phd)\n                return [];\n            const presetDefault = pbag[phd.pbagIndex];\n            const pbagEnd = phdr[i + 1].pbagIndex;\n            return pbag\n                .slice(phd.pbagIndex, pbagEnd)\n                .filter((pbg) => pbg.pzone.instrumentID >= 0)\n                .filter((pbg) => keyVelInRange(pbg.pzone, key, vel))\n                .map((pbg) => {\n                const { defaultBg, izones } = this.findInstrument(pbg.pzone.instrumentID, key, vel);\n                return izones.map((iz) => makeRuntime(iz, defaultBg, pbg, presetDefault.pzone, shdr[iz.sampleID]));\n            })\n                .flat();\n        };\n        this.findInstrument = (instId, key = -1, vel = -1) => {\n            const [ibag, iheaders] = [this.ibag, this.iheaders];\n            const ihead = iheaders[instId];\n            return {\n                inst: ihead,\n                defaultBg: ibag[ihead.iBagIndex].izone,\n                izones: ibag\n                    .slice(ihead.iBagIndex, iheaders[instId + 1].iBagIndex)\n                    .filter((ibg) => keyVelInRange(ibg.izone, key, vel))\n                    .filter((ibg) => ibg.izone.sampleID > -1 && this.shdr[ibg.izone.sampleID])\n                    .map((ibg) => ibg.izone),\n            };\n        };\n        let n = 0;\n        do {\n            const ShdrLength = 46;\n            const imodLength = 10;\n            const phdrLength = 38;\n            const pbagLength = 4;\n            const pgenLength = 4, igenLength = 4;\n            const pmodLength = 10;\n            const instLength = 22;\n            const sectionName = r.read32String();\n            const sectionSize = r.get32();\n            console.log(sectionName, sectionSize);\n            switch (sectionName) {\n                case 'phdr':\n                    for (let i = 0; i < sectionSize; i += phdrLength) {\n                        const phdrItem = {\n                            name: r.readNString(20),\n                            presetId: r.get16(),\n                            bankId: r.get16(),\n                            pbagIndex: r.get16(),\n                            misc: [r.get32(), r.get32(), r.get32()],\n                            pbags: [],\n                            insts: [],\n                            _defaultBag: -1,\n                            get defaultBag() {\n                                return this._defaultBag > -1 ? this._defaultBag : this.pbags[0];\n                            },\n                            set defaultBag(value) {\n                                this._defaultBag = value;\n                            },\n                        };\n                        this.phdr.push(phdrItem);\n                    }\n                    break;\n                case 'pbag':\n                    for (let i = 0; i < sectionSize; i += pbagLength) {\n                        this.pbag.push({\n                            pgen_id: r.get16(),\n                            pmod_id: r.get16(),\n                            pzone: new _Zone_js__WEBPACK_IMPORTED_MODULE_0__.SFZone({ pbagId: i }),\n                        });\n                    }\n                    break;\n                case 'pgen': {\n                    let pgenId = 0, pbagId = 0, phdrId = 0;\n                    for (; pgenId < sectionSize / pgenLength; pgenId++) {\n                        const opid = r.get8();\n                        r.get8();\n                        const v = r.getS16();\n                        const pg = new _Zone_js__WEBPACK_IMPORTED_MODULE_0__.SFGenerator(opid, v);\n                        this.pgen.push(pg);\n                        if (pg.operator == 60)\n                            break;\n                        this.pbag[pbagId].pzone.applyGenVal(pg, pgenId);\n                        if (this.pbag[pbagId + 1] &&\n                            pgenId >= this.pbag[pbagId + 1].pgen_id - 1) {\n                            if (pbagId >= this.phdr[phdrId + 1].pbagIndex) {\n                                phdrId++;\n                            }\n                            this.addPbagToPreset(pbagId, phdrId);\n                            pbagId++;\n                        }\n                    }\n                    break;\n                }\n                case 'pmod':\n                    for (let i = 0; i < sectionSize; i += pmodLength) {\n                        this.pmod.push({\n                            src: r.get16(),\n                            dest: r.get16(),\n                            amt: r.get16(),\n                            amtSrc: r.get16(),\n                            transpose: r.get16(),\n                        });\n                    }\n                    break;\n                case 'inst':\n                    for (let i = 0; i < sectionSize; i += instLength) {\n                        this.iheaders.push({\n                            name: r.readNString(20),\n                            iBagIndex: r.get16(),\n                            ibags: [],\n                            defaultIbag: -1,\n                        });\n                    }\n                    break;\n                case 'ibag': {\n                    let ibginst = 0;\n                    for (let i = 0; i < sectionSize; i += pbagLength) {\n                        if (this.iheaders[ibginst + 1] &&\n                            i >= this.iheaders[ibginst + 1].iBagIndex)\n                            ibginst++;\n                        this.ibag.push({\n                            igen_id: r.get16(),\n                            imod_id: r.get16(),\n                            izone: new _Zone_js__WEBPACK_IMPORTED_MODULE_0__.SFZone({ ibagId: i }),\n                        });\n                        this.psh(ibginst, i, pbagLength);\n                    }\n                    //.push({ igen_id: -1, imod_id: 0, izone: new SFZone() });\n                    this.ibag.push({ igen_id: -1, imod_id: 0, izone: new _Zone_js__WEBPACK_IMPORTED_MODULE_0__.SFZone() });\n                    break;\n                }\n                case 'igen': {\n                    let ibagId = 0;\n                    for (let igenId = 0; igenId < sectionSize / igenLength; igenId++) {\n                        const opid = r.get8() | (r.get8() << 8);\n                        if (opid == -1)\n                            break;\n                        const v = r.getS16();\n                        const gen = new _Zone_js__WEBPACK_IMPORTED_MODULE_0__.SFGenerator(opid, v);\n                        this.igen.push(gen);\n                        if (gen.operator === 60)\n                            break;\n                        this.ibag[ibagId].izone.applyGenVal(gen);\n                        if (igenId >= this.ibag[ibagId + 1].igen_id - 1) {\n                            ibagId++;\n                        }\n                    }\n                    break;\n                }\n                case 'imod':\n                    for (let i = 0; i < sectionSize; i += imodLength) {\n                        this.imod.push({\n                            src: r.get16(),\n                            dest: r.get16(),\n                            amt: r.get16(),\n                            amtSrc: r.get16(),\n                            transpose: r.get16(),\n                        });\n                    }\n                    break;\n                case 'shdr':\n                    for (let i = 0; i < sectionSize; i += ShdrLength ///20 + 4 * 5 + 1 + 1 + 4)\n                    ) {\n                        this.shdr.push({\n                            name: r.readNString(20),\n                            start: r.get32(),\n                            end: r.get32(),\n                            startLoop: r.get32(),\n                            endLoop: r.get32(),\n                            sampleRate: r.get32(),\n                            originalPitch: r.get8(),\n                            pitchCorrection: r.get8(),\n                            sampleLink: r.get16(),\n                            sampleType: r.get16(),\n                        });\n                    }\n                    break;\n                default:\n                    break;\n            }\n        } while (n++ <= 9);\n    }\n    addPbagToPreset(pbagId, phdrId) {\n        if (this.pbag[pbagId].pzone.instrumentID == -1) {\n            if (this.phdr[phdrId].defaultBag == -1)\n                this.phdr[phdrId].defaultBag = pbagId;\n        }\n        else {\n            this.phdr[phdrId]?.pbags.push(pbagId);\n            this.phdr[phdrId]?.insts.push(this.pbag[pbagId].pzone.instrumentID);\n        }\n    }\n    psh(ibginst, i, pbagLength) {\n        this.iheaders[ibginst].ibags &&\n            this.iheaders[ibginst].ibags?.push(i / pbagLength);\n    }\n    getIbagZone(ibagId) {\n        return this.ibag[ibagId] && this.ibag[ibagId].izone;\n    }\n}\nfunction makeRuntime(izone, instDefault, pbg, defaultPbag, shr) {\n    const output = new _Zone_js__WEBPACK_IMPORTED_MODULE_0__.SFZone();\n    for (let i = 0; i < 60; i++) {\n        if (izone.generators[i]) {\n            output.setVal(izone.generators[i]);\n        }\n        else if (instDefault && instDefault.generators[i]) {\n            output.setVal(instDefault.generators[i]);\n        }\n        if (pbg.pzone.generators[i]) {\n            output.increOrSet(pbg.pzone.generators[i]);\n        }\n        else if (defaultPbag && defaultPbag.generators[i]) {\n            output.increOrSet(defaultPbag.generators[i]);\n        }\n    }\n    output.applyGenVals();\n    output.sample = shr;\n    return output;\n}\nfunction keyVelInRange(zone, key, vel) {\n    return ((key < 0 || (zone.keyRange.lo <= key && zone.keyRange.hi >= key)) &&\n        (vel < 0 || (zone.velRange.lo <= vel && zone.velRange.hi >= vel)));\n}\n\n\n//# sourceURL=webpack://sf2rend/./node_modules/parse-sf2/dist/pdta.js?");

/***/ }),

/***/ "./node_modules/parse-sf2/dist/sf.types.js":
/*!*************************************************!*\
  !*** ./node_modules/parse-sf2/dist/sf.types.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"ch_state\": () => (/* binding */ ch_state),\n/* harmony export */   \"sf_gen_id\": () => (/* binding */ sf_gen_id),\n/* harmony export */   \"mergeTypes\": () => (/* binding */ mergeTypes),\n/* harmony export */   \"LOOPMODES\": () => (/* binding */ LOOPMODES),\n/* harmony export */   \"generatorNames\": () => (/* binding */ generatorNames)\n/* harmony export */ });\nvar ch_state;\n(function (ch_state) {\n    ch_state[ch_state[\"attack\"] = 0] = \"attack\";\n    ch_state[ch_state[\"hold\"] = 1] = \"hold\";\n    ch_state[ch_state[\"decay\"] = 2] = \"decay\";\n    ch_state[ch_state[\"releasing\"] = 3] = \"releasing\";\n})(ch_state || (ch_state = {}));\nconst defaultLFO = {\n    delay: 0,\n    freq: 1,\n    effects: { pitch: 0, filter: 0, volume: 0 },\n};\nvar sf_gen_id;\n(function (sf_gen_id) {\n    sf_gen_id[sf_gen_id[\"startAddrsOffset\"] = 0] = \"startAddrsOffset\";\n    sf_gen_id[sf_gen_id[\"endAddrsOffset\"] = 1] = \"endAddrsOffset\";\n    sf_gen_id[sf_gen_id[\"startloopAddrsOffset\"] = 2] = \"startloopAddrsOffset\";\n    sf_gen_id[sf_gen_id[\"endloopAddrsOffset\"] = 3] = \"endloopAddrsOffset\";\n    sf_gen_id[sf_gen_id[\"startAddrsCoarseOffset\"] = 4] = \"startAddrsCoarseOffset\";\n    sf_gen_id[sf_gen_id[\"modLfoToPitch\"] = 5] = \"modLfoToPitch\";\n    sf_gen_id[sf_gen_id[\"vibLfoToPitch\"] = 6] = \"vibLfoToPitch\";\n    sf_gen_id[sf_gen_id[\"modEnvToPitch\"] = 7] = \"modEnvToPitch\";\n    sf_gen_id[sf_gen_id[\"initialFilterFc\"] = 8] = \"initialFilterFc\";\n    sf_gen_id[sf_gen_id[\"initialFilterQ\"] = 9] = \"initialFilterQ\";\n    sf_gen_id[sf_gen_id[\"modLfoToFilterFc\"] = 10] = \"modLfoToFilterFc\";\n    sf_gen_id[sf_gen_id[\"modEnvToFilterFc\"] = 11] = \"modEnvToFilterFc\";\n    sf_gen_id[sf_gen_id[\"endAddrsCoarseOffset\"] = 12] = \"endAddrsCoarseOffset\";\n    sf_gen_id[sf_gen_id[\"modLfoToVolume\"] = 13] = \"modLfoToVolume\";\n    sf_gen_id[sf_gen_id[\"unused1\"] = 14] = \"unused1\";\n    sf_gen_id[sf_gen_id[\"chorusEffectsSend\"] = 15] = \"chorusEffectsSend\";\n    sf_gen_id[sf_gen_id[\"reverbEffectsSend\"] = 16] = \"reverbEffectsSend\";\n    sf_gen_id[sf_gen_id[\"pan\"] = 17] = \"pan\";\n    sf_gen_id[sf_gen_id[\"unused2\"] = 18] = \"unused2\";\n    sf_gen_id[sf_gen_id[\"unused3\"] = 19] = \"unused3\";\n    sf_gen_id[sf_gen_id[\"unused4\"] = 20] = \"unused4\";\n    sf_gen_id[sf_gen_id[\"delayModLFO\"] = 21] = \"delayModLFO\";\n    sf_gen_id[sf_gen_id[\"freqModLFO\"] = 22] = \"freqModLFO\";\n    sf_gen_id[sf_gen_id[\"delayVibLFO\"] = 23] = \"delayVibLFO\";\n    sf_gen_id[sf_gen_id[\"freqVibLFO\"] = 24] = \"freqVibLFO\";\n    sf_gen_id[sf_gen_id[\"delayModEnv\"] = 25] = \"delayModEnv\";\n    sf_gen_id[sf_gen_id[\"attackModEnv\"] = 26] = \"attackModEnv\";\n    sf_gen_id[sf_gen_id[\"holdModEnv\"] = 27] = \"holdModEnv\";\n    sf_gen_id[sf_gen_id[\"decayModEnv\"] = 28] = \"decayModEnv\";\n    sf_gen_id[sf_gen_id[\"sustainModEnv\"] = 29] = \"sustainModEnv\";\n    sf_gen_id[sf_gen_id[\"releaseModEnv\"] = 30] = \"releaseModEnv\";\n    sf_gen_id[sf_gen_id[\"keynumToModEnvHold\"] = 31] = \"keynumToModEnvHold\";\n    sf_gen_id[sf_gen_id[\"keynumToModEnvDecay\"] = 32] = \"keynumToModEnvDecay\";\n    sf_gen_id[sf_gen_id[\"delayVolEnv\"] = 33] = \"delayVolEnv\";\n    sf_gen_id[sf_gen_id[\"attackVolEnv\"] = 34] = \"attackVolEnv\";\n    sf_gen_id[sf_gen_id[\"holdVolEnv\"] = 35] = \"holdVolEnv\";\n    sf_gen_id[sf_gen_id[\"decayVolEnv\"] = 36] = \"decayVolEnv\";\n    sf_gen_id[sf_gen_id[\"sustainVolEnv\"] = 37] = \"sustainVolEnv\";\n    sf_gen_id[sf_gen_id[\"releaseVolEnv\"] = 38] = \"releaseVolEnv\";\n    sf_gen_id[sf_gen_id[\"keynumToVolEnvHold\"] = 39] = \"keynumToVolEnvHold\";\n    sf_gen_id[sf_gen_id[\"keynumToVolEnvDecay\"] = 40] = \"keynumToVolEnvDecay\";\n    sf_gen_id[sf_gen_id[\"instrument\"] = 41] = \"instrument\";\n    sf_gen_id[sf_gen_id[\"reserved1\"] = 42] = \"reserved1\";\n    sf_gen_id[sf_gen_id[\"keyRange\"] = 43] = \"keyRange\";\n    sf_gen_id[sf_gen_id[\"velRange\"] = 44] = \"velRange\";\n    sf_gen_id[sf_gen_id[\"startloopAddrsCoarse\"] = 45] = \"startloopAddrsCoarse\";\n    sf_gen_id[sf_gen_id[\"keynum\"] = 46] = \"keynum\";\n    sf_gen_id[sf_gen_id[\"velocity\"] = 47] = \"velocity\";\n    sf_gen_id[sf_gen_id[\"initialAttenuation\"] = 48] = \"initialAttenuation\";\n    sf_gen_id[sf_gen_id[\"reserved2\"] = 49] = \"reserved2\";\n    sf_gen_id[sf_gen_id[\"endloopAddrsCoarse\"] = 50] = \"endloopAddrsCoarse\";\n    sf_gen_id[sf_gen_id[\"coarseTune\"] = 51] = \"coarseTune\";\n    sf_gen_id[sf_gen_id[\"fineTune\"] = 52] = \"fineTune\";\n    sf_gen_id[sf_gen_id[\"sampleID\"] = 53] = \"sampleID\";\n    sf_gen_id[sf_gen_id[\"sampleModes\"] = 54] = \"sampleModes\";\n    sf_gen_id[sf_gen_id[\"reserved3\"] = 55] = \"reserved3\";\n    sf_gen_id[sf_gen_id[\"scaleTuning\"] = 56] = \"scaleTuning\";\n    sf_gen_id[sf_gen_id[\"exclusiveClass\"] = 57] = \"exclusiveClass\";\n    sf_gen_id[sf_gen_id[\"overridingRootKey\"] = 58] = \"overridingRootKey\";\n    sf_gen_id[sf_gen_id[\"unused5\"] = 59] = \"unused5\";\n    sf_gen_id[sf_gen_id[\"endOper\"] = 60] = \"endOper\";\n})(sf_gen_id || (sf_gen_id = {}));\nvar mergeTypes;\n(function (mergeTypes) {\n    mergeTypes[mergeTypes[\"SET_INST_DEFAULT\"] = 0] = \"SET_INST_DEFAULT\";\n    mergeTypes[mergeTypes[\"SET_INST\"] = 1] = \"SET_INST\";\n    mergeTypes[mergeTypes[\"SET_PBAG\"] = 2] = \"SET_PBAG\";\n    mergeTypes[mergeTypes[\"SET_PBAGDEFAULT\"] = 3] = \"SET_PBAGDEFAULT\";\n})(mergeTypes || (mergeTypes = {}));\nvar LOOPMODES;\n(function (LOOPMODES) {\n    LOOPMODES[LOOPMODES[\"NO_LOOP\"] = 0] = \"NO_LOOP\";\n    LOOPMODES[LOOPMODES[\"CONTINUOUS_LOOP\"] = 1] = \"CONTINUOUS_LOOP\";\n    LOOPMODES[LOOPMODES[\"NO_LOOP_EQ\"] = 2] = \"NO_LOOP_EQ\";\n    LOOPMODES[LOOPMODES[\"LOOP_DURATION_PRESS\"] = 3] = \"LOOP_DURATION_PRESS\";\n})(LOOPMODES || (LOOPMODES = {}));\nconst generatorNames = `#define SFGEN_startAddrsOffset         0\n#define SFGEN_endAddrsOffset           1\n#define SFGEN_startloopAddrsOffset     2\n#define SFGEN_endloopAddrsOffset       3\n#define SFGEN_startAddrsCoarseOffset   4\n#define SFGEN_modLfoToPitch            5\n#define SFGEN_vibLfoToPitch            6\n#define SFGEN_modEnvToPitch            7\n#define SFGEN_initialFilterFc          8\n#define SFGEN_initialFilterQ           9\n#define SFGEN_modLfoToFilterFc         10\n#define SFGEN_modEnvToFilterFc         11\n#define SFGEN_endAddrsCoarseOffset     12\n#define SFGEN_modLfoToVolume           13\n#define SFGEN_unused1                  14\n#define SFGEN_chorusEffectsSend        15\n#define SFGEN_reverbEffectsSend        16\n#define SFGEN_pan                      17\n#define SFGEN_unused2                  18\n#define SFGEN_unused3                  19\n#define SFGEN_unused4                  20\n#define SFGEN_delayModLFO              21\n#define SFGEN_freqModLFO               22\n#define SFGEN_delayVibLFO              23\n#define SFGEN_freqVibLFO               24\n#define SFGEN_delayModEnv              25\n#define SFGEN_attackModEnv             26\n#define SFGEN_holdModEnv               27\n#define SFGEN_decayModEnv              28\n#define SFGEN_sustainModEnv            29\n#define SFGEN_releaseModEnv            30\n#define SFGEN_keynumToModEnvHold       31\n#define SFGEN_keynumToModEnvDecay      32\n#define SFGEN_delayVolEnv              33\n#define SFGEN_attackVolEnv             34\n#define SFGEN_holdVolEnv               35\n#define SFGEN_decayVolEnv              36\n#define SFGEN_sustainVolEnv            37\n#define SFGEN_releaseVolEnv            38\n#define SFGEN_keynumToVolEnvHold       39\n#define SFGEN_keynumToVolEnvDecay      40\n#define SFGEN_instrument               41\n#define SFGEN_reserved1                42\n#define SFGEN_keyRange                 43\n#define SFGEN_velRange                 44\n#define SFGEN_startloopAddrsCoarse     45\n#define SFGEN_keynum                   46\n#define SFGEN_velocity                 47\n#define SFGEN_initialAttenuation       48\n#define SFGEN_reserved2                49\n#define SFGEN_endloopAddrsCoarse       50\n#define SFGEN_coarseTune               51\n#define SFGEN_fineTune                 52\n#define SFGEN_sampleID                 53\n#define SFGEN_sampleModes              54\n#define SFGEN_reserved3                55\n#define SFGEN_scaleTuning              56\n#define SFGEN_exclusiveClass           57\n#define SFGEN_overridingRootKey        58\n#define SFGEN_unused5                  59\n#define SFGEN_endOper                  60`\n    .trim()\n    .split('\\n')\n    .map((line) => line.split(/\\s+/)[1])\n    .map((token) => token.replace('SFGEN_', ''));\nconst { startAddrsOffset, endAddrsOffset, startloopAddrsOffset, endloopAddrsOffset, startAddrsCoarseOffset, } = sf_gen_id;\n\n\n//# sourceURL=webpack://sf2rend/./node_modules/parse-sf2/dist/sf.types.js?");

/***/ }),

/***/ "./node_modules/parse-sf2/dist/sfbkstream.js":
/*!***************************************************!*\
  !*** ./node_modules/parse-sf2/dist/sfbkstream.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"sfbkstream\": () => (/* binding */ sfbkstream)\n/* harmony export */ });\n/* harmony import */ var _aba_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./aba.js */ \"./node_modules/parse-sf2/dist/aba.js\");\n\nasync function sfbkstream(url) {\n    const ab = await (await fetch(url, { headers: { Range: 'bytes=0-6400' } })).arrayBuffer();\n    const [preample, r] = skipToSDTA(ab);\n    const sdtaSize = r.get32();\n    const stdstart = r.offset + 8;\n    const pdtastart = stdstart + sdtaSize + 4;\n    const rangeHeader = {\n        headers: {\n            Range: 'bytes=' + stdstart + '-' + pdtastart,\n        },\n    };\n    const pdtaHeader = {\n        headers: { Range: 'bytes=' + pdtastart + '-' },\n    };\n    const { readable, writable } = new TransformStream();\n    (await fetch(url, rangeHeader)).body.pipeTo(writable);\n    return {\n        nsamples: (pdtastart - stdstart) / 2,\n        sdtaStream: readable,\n        infos: preample,\n        pdtaBuffer: new Uint8Array(await (await fetch(url, pdtaHeader)).arrayBuffer()),\n    };\n}\nfunction skipToSDTA(ab) {\n    const infosection = new Uint8Array(ab);\n    const r = (0,_aba_js__WEBPACK_IMPORTED_MODULE_0__.readAB)(infosection);\n    const [riff, filesize, sig, list] = [\n        r.readNString(4),\n        r.get32(),\n        r.readNString(4),\n        r.readNString(4),\n    ];\n    console.assert(riff == 'RIFF' && sig == 'sfbk');\n    let infosize = r.get32();\n    console.log(r.readNString(4), filesize, list, r.offset);\n    console.log(infosize, r.offset);\n    const infos = [];\n    while (infosize >= 8) {\n        const [section, size] = [r.readNString(4), r.get32()];\n        infos.push({ section, text: r.readNString(size) });\n        infosize = infosize - 8 - size;\n    }\n    console.assert(r.readNString(4) == 'LIST');\n    return [infos, r];\n}\n\n\n//# sourceURL=webpack://sf2rend/./node_modules/parse-sf2/dist/sfbkstream.js?");

/***/ }),

/***/ "./node_modules/parse-sf2/dist/sffile.js":
/*!***********************************************!*\
  !*** ./node_modules/parse-sf2/dist/sffile.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"SF2File\": () => (/* binding */ SF2File)\n/* harmony export */ });\n/* harmony import */ var _aba_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./aba.js */ \"./node_modules/parse-sf2/dist/aba.js\");\n/* harmony import */ var _pdta_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./pdta.js */ \"./node_modules/parse-sf2/dist/pdta.js\");\n\n\nclass SF2File {\n    constructor(ab) {\n        const r = (0,_aba_js__WEBPACK_IMPORTED_MODULE_0__.readAB)(ab);\n        console.assert(r.read32String() == \"RIFF\");\n        let size = r.get32();\n        console.assert(r.read32String() == \"sfbk\");\n        console.assert(r.read32String() == \"LIST\");\n        size -= 64;\n        const sections = {};\n        do {\n            const sectionSize = r.get32();\n            const section = r.read32String();\n            size = size - sectionSize;\n            if (section === \"pdta\") {\n                this.pdta = new _pdta_js__WEBPACK_IMPORTED_MODULE_1__.PDTA(r);\n            }\n            else if (section === \"sdta\") {\n                console.assert(r.read32String() == \"smpl\");\n                const nsamples = (sectionSize - 4) / 2;\n                const uint8s = r.readN(sectionSize - 4);\n                const floatArr = new SharedArrayBuffer(uint8s.byteLength * 2);\n                const dv2 = new DataView(floatArr);\n                const dv = new DataView(uint8s.buffer);\n                for (let i = 0; i < dv.byteLength / 2 - 1; i++) {\n                    dv2.setFloat32(i * 4, dv.getInt16(2 * i, true) / 0x7fff, true);\n                }\n                function iterate(zone, key, outputSampleRate, length = 48000 * 2) {\n                    const data = new Float32Array(floatArr);\n                    const { start, end, startLoop, endLoop } = zone.sample;\n                    const loop = [startLoop - start, endLoop - start];\n                    const pitchRatio = (Math.pow(2, (key * 100 - zone.pitch) / 1200) * zone.sample.sampleRate) /\n                        outputSampleRate;\n                    function* shift() {\n                        let pos = 0x00;\n                        let n = 0;\n                        let shift = 0.0;\n                        while (n++ < length) {\n                            yield data[pos];\n                            shift = shift + pitchRatio;\n                            while (shift >= 1) {\n                                shift--;\n                                pos++;\n                            }\n                            if (pos >= loop[1])\n                                pos = loop[0];\n                        }\n                        return data[pos];\n                    }\n                    return shift();\n                }\n                this.sdta = {\n                    nsamples,\n                    data: uint8s,\n                    floatArr: floatArr,\n                    iterator: iterate,\n                };\n            }\n            else {\n                r.skip(sectionSize);\n            }\n        } while (size > 0);\n    }\n}\nSF2File.fromURL = async (url) => {\n    return new SF2File(await (await fetch(url)).arrayBuffer());\n};\n\n\n//# sourceURL=webpack://sf2rend/./node_modules/parse-sf2/dist/sffile.js?");

/***/ }),

/***/ "./sf2-service/read.js":
/*!*****************************!*\
  !*** ./sf2-service/read.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"load\": () => (/* binding */ load),\n/* harmony export */   \"loadProgram\": () => (/* binding */ loadProgram)\n/* harmony export */ });\n/* harmony import */ var _skip_to_pdta_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./skip_to_pdta.js */ \"./sf2-service/skip_to_pdta.js\");\n/* harmony import */ var _zoneProxy_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./zoneProxy.js */ \"./sf2-service/zoneProxy.js\");\n/* harmony import */ var _s16tof32_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./s16tof32.js */ \"./sf2-service/s16tof32.js\");\n\n\n\nasync function load(url, { onHeader, onSample, onZone } = {}) {\n  let heap, presetRef, shdrref, _sdtaStart, _url, presetRefs;\n\n  _url = document.location + \"/\" + url;\n  const Module = await __webpack_require__.e(/*! import() */ \"sf2-service_pdta_js\").then(__webpack_require__.bind(__webpack_require__, /*! ./pdta.js */ \"./sf2-service/pdta.js\"));\n  const module = await Module.default();\n  const { pdtaBuffer, sdtaStart } = await (0,_skip_to_pdta_js__WEBPACK_IMPORTED_MODULE_0__.sfbkstream)(url);\n\n  _sdtaStart = sdtaStart;\n  function devnull() {}\n  const a = module._malloc(pdtaBuffer.byteLength);\n\n  module.onHeader = onHeader || devnull;\n  module.onSample = () => onSample || devnull;\n  module.onZone = onZone || devnull;\n\n  module.HEAPU8.set(pdtaBuffer, a);\n  const memend = module._loadpdta(a);\n  shdrref = module._shdrref(a);\n  presetRef = module._presetRef();\n  presetRefs = new Uint32Array(module.HEAPU32.buffer, module._presetRef(), 255);\n  heap = module.HEAPU8.buffer.slice(0, memend);\n  return { pdtaRef: a, presetRefs, heap, shdrref, sdtaStart, url };\n}\n\nfunction loadProgram(\n  { url, presetRefs, heap, shdrref, sdtaStart },\n  pid,\n  bkid = 0\n) {\n  const rootRef = presetRefs[pid | bkid];\n  const zMap = [];\n  const f32buffers = {};\n  const shdrMap = {};\n  const shdrDataMap = {};\n  for (\n    let zref = rootRef, zone = zref2Zone(zref);\n    zone && zone.SampleId != -1;\n    zone = zref2Zone((zref += 120))\n  ) {\n    const mapKey = zone.SampleId;\n    if (!shdrMap[mapKey]) {\n      shdrMap[mapKey] = getShdr(zone.SampleId);\n      shdrMap[mapKey].data = async () =>\n        shdrMap[mapKey].pcm ||\n        (await fetch(url, {\n          headers: {\n            Range: `bytes=${shdrMap[mapKey].range.join(\"-\")}`,\n          },\n        })\n          .then((res) => res.arrayBuffer())\n          .then((ab) => {\n            shdrMap[mapKey].pcm = (0,_s16tof32_js__WEBPACK_IMPORTED_MODULE_2__.s16ArrayBuffer2f32)(ab);\n            return shdrMap[mapKey].pcm;\n          }));\n    }\n    zMap.push({\n      ...zone,\n      get shdr() {\n        return shdrMap[zone.SampleId];\n      },\n      get pcm() {\n        return shdrMap[zone.SampleId].data();\n      },\n      calcPitchRatio(key, sr) {\n        const rootkey =\n          zone.OverrideRootKey > -1\n            ? zone.OverrideRootKey\n            : shdrMap[zone.SampleId].originalPitch;\n        const samplePitch =\n          rootkey * 100 + zone.CoarseTune * 100 + zone.FineTune * 1;\n        const pitchDiff = (key * 100 - samplePitch) / 1200;\n        const r =\n          Math.pow(2, pitchDiff) * (shdrMap[zone.SampleId].sampleRate / sr);\n        return r;\n      },\n    });\n  }\n  async function preload() {\n    await Promise.all(\n      Object.keys(shdrMap).map((sampleId) => shdrMap[sampleId].data())\n    );\n  }\n  function zref2Zone(zref) {\n    const zone = new Int16Array(heap, zref, 60);\n    return (0,_zoneProxy_js__WEBPACK_IMPORTED_MODULE_1__.newSFZoneMap)(zref, zone);\n  }\n  function getShdr(SampleId) {\n    const hdrRef = shdrref + SampleId * 46;\n    const dv = heap.slice(hdrRef, hdrRef + 46);\n    const [start, end, startloop, endloop, sampleRate] = new Uint32Array(\n      dv,\n      20,\n      5\n    );\n\n    const [originalPitch] = new Uint8Array(dv, 20 + 5 * 4, 1);\n    const range = [sdtaStart + start * 2, sdtaStart + end * 2 + 1];\n    //      \"bytes=\" + (sdtaStart + start * 2) + \"-\" + (sdtaStart + end * 2 + 1);\n    const loops = [startloop - start, endloop - start];\n    return {\n      byteLength: 4 * (end - start + 1),\n      range,\n      loops,\n      SampleId,\n      sampleRate,\n      originalPitch,\n      url,\n      hdrRef,\n    };\n  }\n  return {\n    zMap,\n    preload,\n    shdrMap,\n    url: document.location + url,\n    zref: rootRef,\n    filterKV: function (key, vel) {\n      return zMap.filter(\n        (z) =>\n          (vel == -1 || (z.VelRange.lo <= vel && z.VelRange.hi >= vel)) &&\n          (key == -1 || (z.KeyRange.lo <= key && z.KeyRange.hi >= key))\n      );\n    },\n  };\n}\n\n\n//# sourceURL=webpack://sf2rend/./sf2-service/read.js?");

/***/ }),

/***/ "./sf2-service/s16tof32.js":
/*!*********************************!*\
  !*** ./sf2-service/s16tof32.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"s16ArrayBuffer2f32\": () => (/* binding */ s16ArrayBuffer2f32)\n/* harmony export */ });\nfunction s16ArrayBuffer2f32(ab) {\n  const b16 = new Int16Array(ab);\n\n  const f32 = new Float32Array(ab.byteLength / 2);\n  for (let i = 0; i < b16.length; i++) {\n    //} of b16){\n    f32[i] = b16[i] / 0xffff;\n  }\n  return f32;\n}\n\n\n//# sourceURL=webpack://sf2rend/./sf2-service/s16tof32.js?");

/***/ }),

/***/ "./sf2-service/skip_to_pdta.js":
/*!*************************************!*\
  !*** ./sf2-service/skip_to_pdta.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"sfbkstream\": () => (/* binding */ sfbkstream),\n/* harmony export */   \"readAB\": () => (/* binding */ readAB)\n/* harmony export */ });\nasync function sfbkstream(url) {\n  const ab = await (\n    await fetch(url, { headers: { Range: \"bytes=0-6400\" } })\n  ).arrayBuffer();\n  const [preample, r] = skipToSDTA(ab);\n  const sdtaSize = r.get32();\n  const sdtaStart = r.offset + 8;\n  const pdtastart = sdtaStart + sdtaSize + 4;\n\n  const pdtaHeader = {\n    headers: { Range: \"bytes=\" + pdtastart + \"-\" },\n  };\n\n  return {\n    nsamples: (pdtastart - sdtaStart) / 2,\n    sdtaStart,\n    infos: preample,\n    pdtaBuffer: new Uint8Array(\n      await (await fetch(url, pdtaHeader)).arrayBuffer()\n    ),\n  };\n}\nfunction skipToSDTA(ab) {\n  const infosection = new Uint8Array(ab);\n  const r = readAB(infosection);\n  const [riff, filesize, sig, list] = [\n    r.readNString(4),\n    r.get32(),\n    r.readNString(4),\n    r.readNString(4),\n  ];\n  let infosize = r.get32();\n  console.log(r.readNString(4), filesize, list, r.offset);\n  console.log(infosize, r.offset);\n  const infos = [];\n  console.assert(infosize < 10000);\n  while (infosize >= 8) {\n    const [section, size] = [r.readNString(4), r.get32()];\n    infos.push({ section, text: r.readNString(size) });\n    infosize = infosize - 8 - size;\n  }\n  r.readNString(4);\n  return [infos, r];\n}\nfunction readAB(arb) {\n  const u8b = new Uint8Array(arb);\n  let _offset = 0;\n  function get8() {\n    return u8b[_offset++];\n  }\n  function getStr(n) {\n    const str = u8b.subarray(_offset, _offset + n); //.map((v) => atob(v));\n    _offset += n;\n    return str; //uab.subarray(_offset,_offset+n).map(v=>v&0x7f);;\n  }\n  function get32() {\n    return get8() | (get8() << 8) | (get8() << 16) | (get8() << 24);\n  }\n  const get16 = () => get8() | (get8() << 8);\n  const getS16 = () => {\n    const u16 = get16();\n    if (u16 & 0x8000) return -0x10000 + u16;\n    else return u16;\n  };\n  const readN = (n) => {\n    const ret = u8b.slice(_offset, n);\n    _offset += n;\n    return ret;\n  };\n  function varLenInt() {\n    let n = get8();\n    while (n & 0x80) {\n      n = get8();\n    }\n    return n;\n  }\n  const skip = (n) => {\n    _offset = _offset + n;\n  };\n  const read32String = () => getStr(4);\n  const readNString = (n) => getStr(n);\n  return {\n    skip,\n    get8,\n    get16,\n    getS16,\n    readN,\n    read32String,\n    varLenInt,\n    get32,\n    readNString,\n    get offset() {\n      return _offset;\n    },\n    set offset(n) {\n      _offset = n;\n    },\n  };\n}\n\n\n//# sourceURL=webpack://sf2rend/./sf2-service/skip_to_pdta.js?");

/***/ }),

/***/ "./sf2-service/zoneProxy.js":
/*!**********************************!*\
  !*** ./sf2-service/zoneProxy.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"newSFZoneMap\": () => (/* binding */ newSFZoneMap),\n/* harmony export */   \"newSFZone\": () => (/* binding */ newSFZone),\n/* harmony export */   \"semitone2hz\": () => (/* binding */ semitone2hz)\n/* harmony export */ });\nconst attributeKeys = [\n  \"StartAddrOfs\",\n  \"EndAddrOfs\",\n  \"StartLoopAddrOfs\",\n  \"EndLoopAddrOfs\",\n  \"StartAddrCoarseOfs\",\n  \"ModLFO2Pitch\",\n  \"VibLFO2Pitch\",\n  \"ModEnv2Pitch\",\n  \"FilterFc\",\n  \"FilterQ\",\n  \"ModLFO2FilterFc\",\n  \"ModEnv2FilterFc\",\n  \"EndAddrCoarseOfs\",\n  \"ModLFO2Vol\",\n  \"Unused1\",\n  \"ChorusSend\",\n  \"ReverbSend\",\n  \"Pan\",\n  \"Unused2\",\n  \"Unused3\",\n  \"Unused4\",\n  \"ModLFODelay\",\n  \"ModLFOFreq\",\n  \"VibLFODelay\",\n  \"VibLFOFreq\",\n  \"ModEnvDelay\",\n  \"ModEnvAttack\",\n  \"ModEnvHold\",\n  \"ModEnvDecay\",\n  \"ModEnvSustain\",\n  \"ModEnvRelease\",\n  \"Key2ModEnvHold\",\n  \"Key2ModEnvDecay\",\n  \"VolEnvDelay\",\n  \"VolEnvAttack\",\n  \"VolEnvHold\",\n  \"VolEnvDecay\",\n  \"VolEnvSustain\",\n  \"VolEnvRelease\",\n  \"Key2VolEnvHold\",\n  \"Key2VolEnvDecay\",\n  \"Instrument\",\n  \"Reserved1\",\n  \"KeyRange\",\n  \"VelRange\",\n  \"StartLoopAddrCoarseOfs\",\n  \"Keynum\",\n  \"Velocity\",\n  \"Attenuation\",\n  \"Reserved2\",\n  \"EndLoopAddrCoarseOfs\",\n  \"CoarseTune\",\n  \"FineTune\",\n  \"SampleId\",\n  \"SampleModes\",\n  \"Reserved3\",\n  \"ScaleTune\",\n  \"ExclusiveClass\",\n  \"OverrideRootKey\",\n  \"Dummy\",\n];\n\nfunction newSFZoneMap(ref, attrs) {\n  var obj = { ref };\n  for (let i = 0; i < 60; i++) {\n    if (attributeKeys[i] == \"VelRange\" || attributeKeys[i] == \"KeyRange\") {\n      obj[attributeKeys[i]] = {\n        hi: (attrs[i] & 0x7f00) >> 8,\n        lo: attrs[i] & 0x007f,\n      };\n    } else {\n      obj[attributeKeys[i]] = attrs[i];\n    }\n  }\n  return obj;\n}\n\n/**\n * proxys comma-separated str of attributes into\n * dot-accessing objects to make beter autocompletes in vscode\n * @param attrs csv strings\n * @returns Proxy<string,number>\n */\nfunction newSFZone(attrs) {\n  const attributeValues = attrs.map((s) => parseInt(s));\n  return new Proxy(attributeValues, {\n    get: (target, key) => {\n      const idx = attributeKeys.indexOf(key);\n      return idx > -1 ? target[idx] : null;\n    },\n  });\n}\nfunction semitone2hz(c) {\n  return Math.pow(2, (c - 6900) / 1200) * 440;\n}\n\n\n//# sourceURL=webpack://sf2rend/./sf2-service/zoneProxy.js?");

/***/ }),

/***/ "./spin/spin.js":
/*!**********************!*\
  !*** ./spin/spin.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"SpinNode\": () => (/* binding */ SpinNode),\n/* harmony export */   \"mkspinner\": () => (/* binding */ mkspinner)\n/* harmony export */ });\n/* harmony import */ var _fetch_drop_ship_fetch_drop_ship_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../fetch-drop-ship/fetch-drop-ship.js */ \"./fetch-drop-ship/fetch-drop-ship.js\");\n\n\nlet wasmbin = null;\nconst CH_META_LEN = 12;\nlet k;\nclass SpinNode extends AudioWorkletNode {\n  static async init(ctx) {\n    await ctx.audioWorklet.addModule(\n      document.location.pathname + \"./spin/spin-proc.js\"\n    );\n    if (!wasmbin) {\n      wasmbin = await fetch(document.location.pathname + \"./spin/spin.wasm\")\n        .then((res) => res.arrayBuffer())\n        .then((ab) => new Uint8Array(ab));\n    }\n  }\n  static alloc(ctx) {\n    if (!k) k = new SpinNode(ctx);\n    return k;\n  }\n  constructor(ctx) {\n    const sb = new SharedArrayBuffer(CH_META_LEN * 16 * 4);\n    super(ctx, \"spin-proc\", {\n      numberOfInputs: 0,\n      numberOfOutputs: 16,\n      outputChannelCount: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],\n      processorOptions: {\n        sb,\n        wasm: wasmbin,\n      },\n    });\n    this.sb = sb;\n    this.f32view = new Float32Array(this.sb);\n    this.u32view = new Uint32Array(this.sb);\n    this.fetchWorker = (0,_fetch_drop_ship_fetch_drop_ship_js__WEBPACK_IMPORTED_MODULE_0__.getWorker)(this.port);\n    // if(egPortzone.postMessage({});\n  }\n  reset() {\n    this.pcm_meta[0] = 2;\n  }\n  despose() {\n    this.pcm_meta[0] = -1;\n  }\n  get stride() {\n    return this.parameters.get(\"stride\").value;\n  }\n  get strideParam() {\n    return this.parameters.get(\"stride\"); //.value;\n  }\n  set stride(ratio) {\n    this.parameters.get(\"stride\").setValueAtTime(ratio, 0.001);\n  }\n  keyOn(channel, zone, key, vel) {\n    let updateOffset = 0;\n    const pcmMeta = this.u32view;\n    console.log(pcmMeta);\n    while (pcmMeta[updateOffset] != 0) updateOffset += CH_META_LEN;\n\n    pcmMeta.set(\n      new Uint32Array([1, channel, zone.SampleId, 0, 800]),\n      updateOffset\n    );\n    this.f32view.set(\n      new Float32Array([\n        zone.calcPitchRatio(key, this.context.sampleRate),\n        0,\n        0.1,\n        1 / this.context.sampleRate / Math.pow(2, zone.VolEnvAttack / 1200),\n      ]),\n      updateOffset + 5\n    );\n  }\n  async shipProgram(sf2program) {\n    (0,_fetch_drop_ship_fetch_drop_ship_js__WEBPACK_IMPORTED_MODULE_0__.requestDownload)(this.fetchWorker, sf2program, this.port);\n    return await new Promise((resolve) => {\n      this.fetchWorker.addEventListener(\n        \"message\",\n        function ({ data }) {\n          if (data.ack) resolve(data.cak);\n        },\n        { once: true }\n      );\n    });\n  }\n  handleMsg(e) {\n    console.log(e.data);\n  }\n  set sample({ channel, shdr, stride }) {\n    this.pcm_meta.set(\n      new Int32Array([stride, shdr.loops[0], shdr.loops[1], shdr.hdrRef]),\n      channel * CH_META_LEN\n    );\n    this.shRef = shdr.hdrRef;\n  }\n  get shref() {\n    return this.shRef;\n  }\n  get flsize() {\n    return this.pcm.byteLength;\n  }\n}\nasync function mkspinner(ctx, pcm, loops) {\n  const sp = new SpinNode(ctx, pcm, loops);\n\n  sp.connect(ctx.destination);\n  return sp;\n}\n\n\n//# sourceURL=webpack://sf2rend/./spin/spin.js?");

/***/ }),

/***/ "./src/adsr.js":
/*!*********************!*\
  !*** ./src/adsr.js ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"mkEnvelope\": () => (/* binding */ mkEnvelope)\n/* harmony export */ });\n/* harmony import */ var _midilist_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./midilist.js */ \"./src/midilist.js\");\n\nfunction mkEnvelope(ctx) {\n  const volumeEnveope = new GainNode(ctx, { gain: 0 });\n  let delay, attack, hold, decay, release, gainMax, sustain, _midiState, _zone;\n  function setZone(zone) {\n    [delay, attack, hold, decay, release] = [\n      zone.VolEnvDelay,\n      zone.VolEnvAttack,\n      zone.VolEnvHold,\n      zone.VolEnvDecay,\n      zone.VolEnvRelease,\n    ].map((v) => (v == -1 || v <= -12000 ? 0.001 : Math.pow(2, v / 1200)));\n    sustain = Math.pow(10, zone.VolEnvSustain / -200);\n    _zone = zone;\n  }\n  return {\n    set zone(zone) {\n      setZone(zone);\n    },\n    set midiState(staet) {\n      _midiState = staet;\n    },\n    keyOn(time) {\n      const sf2attenuate = Math.pow(10, _zone.Attenuation * -0.005);\n      const midiVol = _midiState[_midilist_js__WEBPACK_IMPORTED_MODULE_0__.effects.volumecoarse] / 128;\n      const midiExpre = _midiState[_midilist_js__WEBPACK_IMPORTED_MODULE_0__.effects.expressioncoarse] / 128;\n      gainMax = 1 * sf2attenuate * midiVol * midiExpre;\n\n      volumeEnveope.gain.linearRampToValueAtTime(\n        gainMax,\n        time - ctx.currentTime + delay + attack\n      );\n      volumeEnveope.gain.linearRampToValueAtTime(\n        sustain,\n        time - ctx.currentTime + attack + hold + decay\n      );\n    },\n    keyOff() {\n      volumeEnveope.gain.cancelScheduledValues(0);\n      //   console.log(release + \"rel\");\n      volumeEnveope.gain.linearRampToValueAtTime(0.0, release);\n    },\n    gainNode: volumeEnveope,\n  };\n}\n\n\n//# sourceURL=webpack://sf2rend/./src/adsr.js?");

/***/ }),

/***/ "./src/channel.js":
/*!************************!*\
  !*** ./src/channel.js ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"channel\": () => (/* binding */ channel)\n/* harmony export */ });\n/* harmony import */ var _spin_spin_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../spin/spin.js */ \"./spin/spin.js\");\n/* harmony import */ var _chart_chart_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../chart/chart.js */ \"./chart/chart.js\");\n/* harmony import */ var _sf2_service_read_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../sf2-service/read.js */ \"./sf2-service/read.js\");\n/* harmony import */ var _adsr_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./adsr.js */ \"./src/adsr.js\");\n/* harmony import */ var _lpf_lpf_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../lpf/lpf.js */ \"./lpf/lpf.js\");\n/* harmony import */ var parse_sf2_dist__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! parse-sf2/dist */ \"./node_modules/parse-sf2/dist/index.js\");\n\n\n\n\n\n\nfunction channel(ctx, sf2, id, ui) {\n  const activeNotes = [];\n  const spinner = _spin_spin_js__WEBPACK_IMPORTED_MODULE_0__.SpinNode.alloc(ctx);\n  const volEG = (0,_adsr_js__WEBPACK_IMPORTED_MODULE_3__.mkEnvelope)(ctx);\n  const lpf = new _lpf_lpf_js__WEBPACK_IMPORTED_MODULE_4__.LowPassFilterNode(ctx, 4000);\n  spinner.connect(lpf, id, 0).connect(volEG.gainNode).connect(ctx.destination);\n  let _midicc;\n  let filterKV, pg;\n\n  async function setProgram(pid, bankId) {\n    ui.name = \"pid \" + pid + \" bid \" + bankId;\n    pg = (0,_sf2_service_read_js__WEBPACK_IMPORTED_MODULE_2__.loadProgram)(sf2, pid, bankId);\n    await spinner.shipProgram(pg);\n    return pg;\n    // await pg.preload();\n  }\n  function silence() {\n    activeNotes().forEach((v) => v.volEG.keyOff(0));\n  }\n  async function keyOn(key, vel) {\n    const zone = pg.filterKV(key, vel)[0];\n\n    spinner.keyOn(id, zone, key, vel);\n    volEG.midiState = _midicc;\n    volEG.zone = zone;\n    lpf.frequency = semitone2hz(key * 100);\n    volEG.keyOn(ctx.currentTime + ctx.baseLatency);\n    activeNotes.push({ spinner, volEG, lpf, key });\n    ui.zone = zone;\n    ui.midi = key;\n    ui.velocity = vel;\n  }\n\n  function keyOff(key) {\n    for (let i = 0; i < activeNotes.length; i++) {\n      if (activeNotes[i].key == key) {\n        var unit = activeNotes[i];\n        unit.volEG.keyOff(ctx.currentTime + ctx.baseLatency);\n\n        break;\n      }\n    }\n  }\n\n  return {\n    keyOn,\n    silence,\n    keyOff,\n    setProgram,\n    id,\n    ctx,\n    set midicc(cc) {\n      _midicc = cc;\n    },\n  };\n}\nfunction semitone2hz(c) {\n  return Math.pow(2, (c - 6900) / 1200) * 440;\n}\nfunction AUnitPool() {\n  const pool = [];\n  function dequeue(pcm, shdr, zone) {\n    //if (pool.length < 5) return null;\n    if (pool.length < 1) return null;\n    for (const i in pool) {\n      if (pool[i].spinner.zhref == shdr.hdrRef) {\n        const r = pool[i];\n        r.volEG.zone = zone;\n        r.spinner.reset();\n        pool.splice(i, 1);\n        return r;\n      }\n    }\n    for (const i in pool) {\n      if (pool[i].spinner.flsize <= pcm.byteLength) {\n        const r = pool[i];\n        r.volEG.zone = zone;\n        r.spinner.reset();\n        pool.splice(i, 1);\n        return r;\n      }\n    }\n    return null;\n  }\n  function enqueue(unit) {\n    pool.push(unit);\n  }\n  return {\n    dequeue,\n    enqueue,\n    get _pool() {\n      return pool;\n    },\n    empty: () => pool.length == 0,\n  };\n}\n\n\n//# sourceURL=webpack://sf2rend/./src/channel.js?");

/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../mkdiv/mkdiv.js */ \"./mkdiv/mkdiv.js\");\n/* harmony import */ var _spin_spin_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../spin/spin.js */ \"./spin/spin.js\");\n/* harmony import */ var _lpf_lpf_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../lpf/lpf.js */ \"./lpf/lpf.js\");\n/* harmony import */ var _ui_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./ui.js */ \"./src/ui.js\");\n/* harmony import */ var _sf2_service_read_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../sf2-service/read.js */ \"./sf2-service/read.js\");\n/* harmony import */ var _midilist_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./midilist.js */ \"./src/midilist.js\");\n/* harmony import */ var _channel_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./channel.js */ \"./src/channel.js\");\n\n\n\n\n\n\n\n\nconst flist = document.querySelector(\"#sf2list\");\nconst cpanel = document.querySelector(\"#channelContainer\");\nconst { stdout } = (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.logdiv)(document.querySelector(\"pre\"));\nwindow.stdout = stdout;\nconst cmdPanel = document.querySelector(\"footer\");\n\nmain();\n\nasync function main() {\n  const timeslide = (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"input\", {\n    type: \"range\",\n    min: -2,\n    max: 4000,\n    value: -2,\n  });\n  const pt = (function () {\n    const _arr = [];\n    let _fn;\n    return {\n      onmessage(fn) {\n        _fn = fn;\n      },\n      postMessage(item) {\n        _arr.push(item);\n        if (_fn) _fn(_arr.shift());\n      },\n    };\n  })(11);\n\n  const controllers = (0,_ui_js__WEBPACK_IMPORTED_MODULE_3__.mkui)(cpanel, pt);\n  const sf2 = await loadf(\"./file.sf2\");\n  if (!sf2.presetRefs) return;\n  const ctx = await initAudio();\n  const midiSink = await initMidiSink(ctx, sf2, controllers, pt);\n  const { presets, totalTicks, midiworker } = await initMidiReader(\n    \"https://grep32bit.blob.core.windows.net/midi/Britney_Spears_-_Baby_One_More_Time.mid\"\n  );\n  timeslide.setAttribute(\"max\", totalTicks);\n  for await (const _ of (async function* g() {\n    for (const preset of presets) {\n      console.log(\"prload\" + preset);\n      const { pid, channel } = preset;\n      yield await midiSink.channels[channel].setProgram(\n        sf2,\n        pid,\n        channel == 9 ? 128 : 0\n      );\n    }\n  })()) {\n    //eslint\n  }\n  let cid = 0;\n  flist.onclick = ({ target }) =>\n    // target.classList.contain(\"chlink\") &&\n    midiSink.channels[cid++].setProgram(\n      target.getAttribute(\"pid\"),\n      target.getAttribute(\"bid\")\n    );\n  bindMidiWorkerToAudioAndUI(midiworker, pt, {\n    timeslide,\n    cmdPanel,\n    playlist: (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"div\", {}, await (0,_midilist_js__WEBPACK_IMPORTED_MODULE_5__.fetchmidilist)()),\n  });\n  bindMidiAccess(pt);\n}\n\nasync function loadf(file) {\n  flist.innerHTML = \"\";\n  return (0,_sf2_service_read_js__WEBPACK_IMPORTED_MODULE_4__.load)(file, {\n    onHeader(pid, bid, str) {\n      flist.append(\n        (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"a\", { class: \"chlink\", pid, bid }, [str]).wrapWith(\"li\")\n      );\n    },\n  });\n}\n\nfunction initMidiReader(url) {\n  return new Promise((resolve, reject) => {\n    const midiworker = new Worker(\"./dist/midiworker.js#\" + url, {\n      type: \"module\",\n    });\n    midiworker.addEventListener(\n      \"message\",\n      ({ data: { totalTicks, presets } }) =>\n        resolve({\n          midiworker,\n          totalTicks,\n          presets,\n        }),\n      { once: true }\n    );\n    midiworker.onerror = reject;\n    midiworker.onmessageerror = reject;\n  });\n}\nfunction bindMidiWorkerToAudioAndUI(\n  midiworker,\n  midiPort,\n  { timeslide, cmdPanel, playlist }\n) {\n  midiworker.addEventListener(\"message\", (e) => {\n    if (e.data.channel) {\n      midiPort.postMessage(e.data.channel);\n    } else if (e.data.tick) {\n      timeslide.value = e.data.tick; //(e.data.t);\n    }\n  });\n  (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"button\", { class: \"cmd\", cmd: \"start\" }, \"start\").attachTo(cmdPanel);\n  (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"button\", { class: \"cmd\", cmd: \"pause\" }, \"pause\").attachTo(cmdPanel);\n  (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"button\", { class: \"cmd\", cmd: \"rwd\", amt: \"rwd\" }, \"rwd\").attachTo(\n    cmdPanel\n  );\n\n  cmdPanel\n    .querySelectorAll(\"button.cmd\")\n    .forEach((btn) =>\n      btn.addEventListener(\"click\", (e) =>\n        midiworker.postMessage({ cmd: e.target.getAttribute(\"cmd\") })\n      )\n    );\n}\nasync function initMidiSink(ctx, sf2, controllers, pt, spinner) {\n  const channels = [];\n  const ccs = midiCCState();\n  for (let i = 0; i < 16; i++) {\n    channels[i] = (0,_channel_js__WEBPACK_IMPORTED_MODULE_6__.channel)(ctx, sf2, i, controllers[i]);\n    channels[i].midicc = ccs.subarray(i * 128, i * 128 + 128);\n  }\n  pt.onmessage(function (data) {\n    const [a, b, c] = data;\n    const stat = a >> 4;\n    const ch = a & 0x0f;\n    const key = b & 0x7f,\n      vel = c & 0x7f;\n    //  stdout(data);\n    stdout(\"midi msg channel:\" + ch + \" cmd \" + stat.toString(16));\n    switch (stat) {\n      case 0xb: //chan set\n        ccs[ch * 128 + key] = vel;\n        break;\n      case 0xc: //change porg\n        stdout(\"set program to \" + key + \" for \" + ch);\n        if (key != channels[ch].pid)\n          channels[ch].setProgram(key, ch == 9 ? 128 : 0);\n        break;\n      case 0x08:\n        channels[ch].keyOff(key, vel);\n        break;\n      case 0x09:\n        if (vel == 0) {\n          channels[ch].keyOff(key, vel);\n        } else {\n          stdout(\"playnote \" + key + \" for \" + ch);\n\n          channels[ch].keyOn(key, vel);\n        }\n        break;\n      default:\n        break;\n    }\n  });\n  function midiCCState() {\n    const ccs = new Uint8Array(128 * 16);\n    for (let i = 0; i < 16; i++) {\n      ccs[i * 128 + 7] = 100; //defalt volume\n      ccs[i * 128 + 11] = 127; //default expression\n      ccs[i * 128 + 10] = 64;\n    }\n\n    return ccs;\n  }\n  return { channels, ccs };\n}\nasync function initAudio() {\n  const ctx = new AudioContext({ sampleRate: 44100 });\n  await _spin_spin_js__WEBPACK_IMPORTED_MODULE_1__.SpinNode.init(ctx);\n  await _lpf_lpf_js__WEBPACK_IMPORTED_MODULE_2__.LowPassFilterNode.init(ctx);\n  return ctx;\n}\n\nasync function bindMidiAccess(port) {\n  const midiAccess = await navigator.requestMIDIAccess();\n  const midiInputs = Array.from(midiAccess.inputs.values());\n  const midiOutputs = Array.from(midiAccess.outputs.values());\n  midiInputs.forEach((input) => {\n    input.onmidimessage = ({ data, timestamp }) => {\n      port.postMessage(data);\n    };\n  });\n\n  return [midiInputs, midiOutputs];\n}\n\nwindow.onerror = (event, source, lineno, colno, error) => {\n  document.querySelector(\"#debug\").innerHTML = JSON.stringify([\n    event,\n    source,\n    lineno,\n    colno,\n    error,\n  ]);\n};\n\n\n//# sourceURL=webpack://sf2rend/./src/index.js?");

/***/ }),

/***/ "./src/midilist.js":
/*!*************************!*\
  !*** ./src/midilist.js ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"fetchmidilist\": () => (/* binding */ fetchmidilist),\n/* harmony export */   \"effects\": () => (/* binding */ effects)\n/* harmony export */ });\nvar xml_attr = [\n  \"Name\",\n  \"Url\",\n  \"LastModified\",\n  \"Etag\",\n  \"Size\",\n  \"ContentType\",\n  \"ContentEncoding\",\n  \"ContentLanguage\",\n];\n\nfunction fetchmidilist(\n  url = \"https://grep32bit.blob.core.windows.net/midi?resttype=container&comp=list\"\n) {\n  return new Promise((resolve, reject) => {\n    const xhr = new XMLHttpRequest();\n    xhr.open(\"GET\", url);\n    xhr.responseType = \"document\";\n    xhr.send();\n    xhr.onload = function () {\n      if (xhr.responseXML) {\n        const blobs = Array.from(xhr.responseXML.querySelectorAll(\"Blob\"));\n        resolve(\n          blobs\n            .map(function (b) {\n              var ff = new Map();\n              xml_attr.forEach(function (attr) {\n                ff.set(attr, b.querySelector(attr).textContent);\n              });\n              return ff;\n            })\n            .sort((a, b) =>\n              new Date(a.LastModified) < new Date(b.lastModified) ? -1 : 1\n            )\n        );\n      }\n    };\n    xhr.onerror = reject;\n    xhr.ontimeout = reject;\n  });\n}\nconst effects = {\n  bankselectcoarse: 0,\n  modulationwheelcoarse: 1,\n  breathcontrollercoarse: 2,\n  footcontrollercoarse: 4,\n  portamentotimecoarse: 5,\n  dataentrycoarse: 6,\n  volumecoarse: 7,\n  balancecoarse: 8,\n  pancoarse: 10,\n  expressioncoarse: 11,\n  pitchbendcoarse: 12,\n  effectcontrol2coarse: 13,\n  generalpurposeslider1: 16,\n  generalpurposeslider2: 17,\n  generalpurposeslider3: 18,\n  generalpurposeslider4: 19,\n  bankselectfine: 32,\n  modulationwheelfine: 33,\n  breathcontrollerfine: 34,\n  footcontrollerfine: 36,\n  portamentotimefine: 37,\n  dataentryfine: 38,\n  volumefine: 39,\n  balancefine: 40,\n  panfine: 42,\n  expressionfine: 43,\n  pitchbendfine: 44,\n  effectcontrol2fine: 45,\n  holdpedal: 64,\n  portamento: 65,\n  sustenutopedal: 66,\n  softpedal: 67,\n  legatopedal: 68,\n  hold2pedal: 69,\n  soundvariation: 70,\n  resonance: 71,\n  soundreleasetime: 72,\n  soundattacktime: 73,\n  brightness: 74,\n  soundcontrol6: 75,\n  soundcontrol7: 76,\n  soundcontrol8: 77,\n  soundcontrol9: 78,\n  soundcontrol10: 79,\n  generalpurposebutton1: 80,\n  generalpurposebutton2: 81,\n  generalpurposebutton3: 82,\n  generalpurposebutton4: 83,\n  reverblevel: 91,\n  tremololevel: 92,\n  choruslevel: 93,\n  celestelevel: 94,\n  phaserlevel: 95,\n  databuttonincrement: 96,\n  databuttondecrement: 97,\n  nonregisteredparametercoarse: 98,\n  nonregisteredparameterfine: 99,\n  registeredparametercoarse: 100,\n  registeredparameterfine: 101,\n};\n\n\n//# sourceURL=webpack://sf2rend/./src/midilist.js?");

/***/ }),

/***/ "./src/ui.js":
/*!*******************!*\
  !*** ./src/ui.js ***!
  \*******************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"TrackUI\": () => (/* binding */ TrackUI),\n/* harmony export */   \"mkui\": () => (/* binding */ mkui)\n/* harmony export */ });\n/* harmony import */ var _mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../mkdiv/mkdiv.js */ \"./mkdiv/mkdiv.js\");\n\nconst rowheight = 40,\n  colwidth = 80;\nconst pixelPerDecibel = rowheight;\nconst pixelPerSec = 12;\n\nclass TrackUI {\n  constructor(container, keyboard, idx, cb) {\n    this.nameLabel = container.querySelector(\".name\");\n    this.meters = container.querySelectorAll(\"meter\");\n    this.sliders = container.querySelectorAll(\"input[type='range']\");\n\n    this.led = container.querySelector(\"input[type=checkbox]\");\n\n    this.canc = container.querySelector(\".canvasContainer\");\n\n    this.keys = Array.from(keyboard.querySelectorAll(\"a\"));\n    this.keys.forEach((k, keyidx) => {\n      var refcnt = 0;\n      const midi = k.getAttribute(\"midi\");\n      k.onmousedown = () => {\n        refcnt++;\n        cb([0x90 | idx, midi, 111]);\n\n        k.addEventListener(\n          \"mouseup\",\n          () => refcnt-- > 0 && cb([0x80 | idx, midi, 111]),\n          { once: true }\n        );\n        k.addEventListener(\"mouseleave\", () => cb([0x80 | idx, midi, 111]), {\n          once: true,\n        });\n      };\n    });\n    this.polylines = Array.from(container.querySelectorAll(\"polyline\"));\n  }\n  set name(id) {\n    this.nameLabel.innerHTML = id;\n  }\n  set midi(v) {\n    this.meters[0].value = v;\n  }\n  set velocity(v) {\n    this.meters[1].value = v;\n  }\n  set active(b) {\n    b\n      ? this.led.setAttribute(\"checked\", \"checked\")\n      : this.led.removeAttribute(\"checked\");\n  }\n  set env1({ phases: [a, d, s, r], peak }) {\n    const points = [\n      [0, 0],\n      [a, 1],\n      [a + d, (100 - s) / 100],\n      [a + d + r, 0],\n    ]\n      .map(([x, y]) => [x * pixelPerSec, (1 - y) * 0.8 * rowheight].join(\",\"))\n      .join(\" \");\n    this.polylines[0].setAttribute(\"points\", points);\n  }\n  set env2({ phases: [a, d, s, r], peak }) {\n    const points = [\n      [0, 0],\n      [a, 1],\n      [a + d, (100 - s) / 100],\n      [a + d + r, 0],\n    ]\n      .map(([x, y]) => x * pixelPerSec + \",\" + y * pixelPerDecibel)\n      .join(\" \");\n    console.log(points);\n    this.polylines[1].setAttribute(\"points\", points);\n  }\n  get canvasContainer() {\n    return this.canc;\n  }\n  set zone(z) {\n    this.env1 = {\n      phases: [\n        z.VolEnvAttack,\n        z.VolEnvDecay,\n        z.VolEnvSustain,\n        z.VolEnvRelease,\n      ].map((v) => Math.pow(2, v / 1200)),\n      peak: Math.pow(10, z.Attenuation / -200),\n    };\n    console.log({\n      phases: [\n        z.VolEnvAttack,\n        z.VolEnvDecay,\n        z.VolEnvSustain,\n        z.VolEnvRelease,\n      ].map((v) => Math.pow(2, v / 1200)),\n      peak: Math.pow(10, z.Attenuation / -200),\n    });\n  }\n}\nconst range = (x, y) =>\n  Array.from(\n    (function* _(x, y) {\n      while (x < y) yield x++;\n    })(x, y)\n  );\n\nfunction mkui(cpanel, cb) {\n  cb = cb.postMessage;\n  const controllers = [];\n\n  const tb = (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"div\", {\n    border: 1,\n    style: \"display:grid;grid-template-columns:1fr 1fr\",\n  });\n  for (let i = 0; i < 16; i++) {\n    const row = (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"div\", { class: \"attrs\" }, [\n      (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"span\", { style: \"display:grid; grid-template-columns:1fr 1fr\" }, [\n        (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"span\", { class: \"name\" }, [\"channel \" + i]),\n        (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"input\", { type: \"checkbox\" }),\n        (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"meter\", { min: 0, max: 127, step: 1, aria: \"key\" }),\n        (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"meter\", { min: 0, max: 127, step: 1, aria: \"vel\" }),\n      ]),\n      (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"span\", { style: \"display:grid;grid-template-columns:2fr 2fr\" }, [\n        (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"label\", { for: \"exp_vol\" }, \"volume\"),\n        (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"input\", { min: 0, max: 127, step: 1, type: \"range\" }),\n        (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"label\", { for: \"pan\" }, \"pan\"),\n        (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"input\", { min: 0, max: 127, step: 1, type: \"range\" }),\n        (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"label\", { for: \"expression\" }, \"expression\"),\n        (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"input\", { min: 0, max: 127, step: 1, type: \"range\" }),\n      ]),\n      (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"div\", { style: \"display:grid; grid-template-columns:1fr 4fr\" }, [\n        (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mksvg)(\n          \"svg\",\n          {\n            style: \"width:80;height:40; display:inline;\",\n            viewBox: \"0 0 80 40\",\n          },\n          [\n            (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mksvg)(\"polyline\", {\n              fill: \"red\",\n              stroke: \"black\",\n            }),\n          ]\n        ),\n        (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"div\", { class: \"canvasContainer\" }),\n      ]),\n    ]);\n    const keyboard = (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\n      \"div\",\n      { class: \"keyboards hide\" },\n      range(55, 88).map((midi) => (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"a\", { midi }, [midi, \" \"]))\n    );\n    controllers.push(new TrackUI(row, keyboard, i, cb));\n    row.attachTo(tb);\n    keyboard.attachTo(row);\n  }\n\n  tb.attachTo(cpanel);\n  return controllers;\n}\n\n\n//# sourceURL=webpack://sf2rend/./src/ui.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			if (cachedModule.error !== undefined) throw cachedModule.error;
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		try {
/******/ 			var execOptions = { id: moduleId, module: module, factory: __webpack_modules__[moduleId], require: __webpack_require__ };
/******/ 			__webpack_require__.i.forEach(function(handler) { handler(execOptions); });
/******/ 			module = execOptions.module;
/******/ 			execOptions.factory.call(module.exports, module, module.exports, execOptions.require);
/******/ 		} catch(e) {
/******/ 			module.error = e;
/******/ 			throw e;
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = __webpack_module_cache__;
/******/ 	
/******/ 	// expose the module execution interceptor
/******/ 	__webpack_require__.i = [];
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript update chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference all chunks
/******/ 		__webpack_require__.hu = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + "." + __webpack_require__.h() + ".hot-update.js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get update manifest filename */
/******/ 	(() => {
/******/ 		__webpack_require__.hmrF = () => ("main." + __webpack_require__.h() + ".hot-update.json");
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/getFullHash */
/******/ 	(() => {
/******/ 		__webpack_require__.h = () => ("a6550458a0f6eb85a93f")
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/load script */
/******/ 	(() => {
/******/ 		var inProgress = {};
/******/ 		var dataWebpackPrefix = "sf2rend:";
/******/ 		// loadScript function to load a script via script tag
/******/ 		__webpack_require__.l = (url, done, key, chunkId) => {
/******/ 			if(inProgress[url]) { inProgress[url].push(done); return; }
/******/ 			var script, needAttach;
/******/ 			if(key !== undefined) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				for(var i = 0; i < scripts.length; i++) {
/******/ 					var s = scripts[i];
/******/ 					if(s.getAttribute("src") == url || s.getAttribute("data-webpack") == dataWebpackPrefix + key) { script = s; break; }
/******/ 				}
/******/ 			}
/******/ 			if(!script) {
/******/ 				needAttach = true;
/******/ 				script = document.createElement('script');
/******/ 		
/******/ 				script.charset = 'utf-8';
/******/ 				script.timeout = 120;
/******/ 				if (__webpack_require__.nc) {
/******/ 					script.setAttribute("nonce", __webpack_require__.nc);
/******/ 				}
/******/ 				script.setAttribute("data-webpack", dataWebpackPrefix + key);
/******/ 				script.src = url;
/******/ 			}
/******/ 			inProgress[url] = [done];
/******/ 			var onScriptComplete = (prev, event) => {
/******/ 				// avoid mem leaks in IE.
/******/ 				script.onerror = script.onload = null;
/******/ 				clearTimeout(timeout);
/******/ 				var doneFns = inProgress[url];
/******/ 				delete inProgress[url];
/******/ 				script.parentNode && script.parentNode.removeChild(script);
/******/ 				doneFns && doneFns.forEach((fn) => (fn(event)));
/******/ 				if(prev) return prev(event);
/******/ 			}
/******/ 			;
/******/ 			var timeout = setTimeout(onScriptComplete.bind(null, undefined, { type: 'timeout', target: script }), 120000);
/******/ 			script.onerror = onScriptComplete.bind(null, script.onerror);
/******/ 			script.onload = onScriptComplete.bind(null, script.onload);
/******/ 			needAttach && document.head.appendChild(script);
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hot module replacement */
/******/ 	(() => {
/******/ 		var currentModuleData = {};
/******/ 		var installedModules = __webpack_require__.c;
/******/ 		
/******/ 		// module and require creation
/******/ 		var currentChildModule;
/******/ 		var currentParents = [];
/******/ 		
/******/ 		// status
/******/ 		var registeredStatusHandlers = [];
/******/ 		var currentStatus = "idle";
/******/ 		
/******/ 		// while downloading
/******/ 		var blockingPromises;
/******/ 		
/******/ 		// The update info
/******/ 		var currentUpdateApplyHandlers;
/******/ 		var queuedInvalidatedModules;
/******/ 		
/******/ 		// eslint-disable-next-line no-unused-vars
/******/ 		__webpack_require__.hmrD = currentModuleData;
/******/ 		
/******/ 		__webpack_require__.i.push(function (options) {
/******/ 			var module = options.module;
/******/ 			var require = createRequire(options.require, options.id);
/******/ 			module.hot = createModuleHotObject(options.id, module);
/******/ 			module.parents = currentParents;
/******/ 			module.children = [];
/******/ 			currentParents = [];
/******/ 			options.require = require;
/******/ 		});
/******/ 		
/******/ 		__webpack_require__.hmrC = {};
/******/ 		__webpack_require__.hmrI = {};
/******/ 		
/******/ 		function createRequire(require, moduleId) {
/******/ 			var me = installedModules[moduleId];
/******/ 			if (!me) return require;
/******/ 			var fn = function (request) {
/******/ 				if (me.hot.active) {
/******/ 					if (installedModules[request]) {
/******/ 						var parents = installedModules[request].parents;
/******/ 						if (parents.indexOf(moduleId) === -1) {
/******/ 							parents.push(moduleId);
/******/ 						}
/******/ 					} else {
/******/ 						currentParents = [moduleId];
/******/ 						currentChildModule = request;
/******/ 					}
/******/ 					if (me.children.indexOf(request) === -1) {
/******/ 						me.children.push(request);
/******/ 					}
/******/ 				} else {
/******/ 					console.warn(
/******/ 						"[HMR] unexpected require(" +
/******/ 							request +
/******/ 							") from disposed module " +
/******/ 							moduleId
/******/ 					);
/******/ 					currentParents = [];
/******/ 				}
/******/ 				return require(request);
/******/ 			};
/******/ 			var createPropertyDescriptor = function (name) {
/******/ 				return {
/******/ 					configurable: true,
/******/ 					enumerable: true,
/******/ 					get: function () {
/******/ 						return require[name];
/******/ 					},
/******/ 					set: function (value) {
/******/ 						require[name] = value;
/******/ 					}
/******/ 				};
/******/ 			};
/******/ 			for (var name in require) {
/******/ 				if (Object.prototype.hasOwnProperty.call(require, name) && name !== "e") {
/******/ 					Object.defineProperty(fn, name, createPropertyDescriptor(name));
/******/ 				}
/******/ 			}
/******/ 			fn.e = function (chunkId) {
/******/ 				return trackBlockingPromise(require.e(chunkId));
/******/ 			};
/******/ 			return fn;
/******/ 		}
/******/ 		
/******/ 		function createModuleHotObject(moduleId, me) {
/******/ 			var _main = currentChildModule !== moduleId;
/******/ 			var hot = {
/******/ 				// private stuff
/******/ 				_acceptedDependencies: {},
/******/ 				_acceptedErrorHandlers: {},
/******/ 				_declinedDependencies: {},
/******/ 				_selfAccepted: false,
/******/ 				_selfDeclined: false,
/******/ 				_selfInvalidated: false,
/******/ 				_disposeHandlers: [],
/******/ 				_main: _main,
/******/ 				_requireSelf: function () {
/******/ 					currentParents = me.parents.slice();
/******/ 					currentChildModule = _main ? undefined : moduleId;
/******/ 					__webpack_require__(moduleId);
/******/ 				},
/******/ 		
/******/ 				// Module API
/******/ 				active: true,
/******/ 				accept: function (dep, callback, errorHandler) {
/******/ 					if (dep === undefined) hot._selfAccepted = true;
/******/ 					else if (typeof dep === "function") hot._selfAccepted = dep;
/******/ 					else if (typeof dep === "object" && dep !== null) {
/******/ 						for (var i = 0; i < dep.length; i++) {
/******/ 							hot._acceptedDependencies[dep[i]] = callback || function () {};
/******/ 							hot._acceptedErrorHandlers[dep[i]] = errorHandler;
/******/ 						}
/******/ 					} else {
/******/ 						hot._acceptedDependencies[dep] = callback || function () {};
/******/ 						hot._acceptedErrorHandlers[dep] = errorHandler;
/******/ 					}
/******/ 				},
/******/ 				decline: function (dep) {
/******/ 					if (dep === undefined) hot._selfDeclined = true;
/******/ 					else if (typeof dep === "object" && dep !== null)
/******/ 						for (var i = 0; i < dep.length; i++)
/******/ 							hot._declinedDependencies[dep[i]] = true;
/******/ 					else hot._declinedDependencies[dep] = true;
/******/ 				},
/******/ 				dispose: function (callback) {
/******/ 					hot._disposeHandlers.push(callback);
/******/ 				},
/******/ 				addDisposeHandler: function (callback) {
/******/ 					hot._disposeHandlers.push(callback);
/******/ 				},
/******/ 				removeDisposeHandler: function (callback) {
/******/ 					var idx = hot._disposeHandlers.indexOf(callback);
/******/ 					if (idx >= 0) hot._disposeHandlers.splice(idx, 1);
/******/ 				},
/******/ 				invalidate: function () {
/******/ 					this._selfInvalidated = true;
/******/ 					switch (currentStatus) {
/******/ 						case "idle":
/******/ 							currentUpdateApplyHandlers = [];
/******/ 							Object.keys(__webpack_require__.hmrI).forEach(function (key) {
/******/ 								__webpack_require__.hmrI[key](
/******/ 									moduleId,
/******/ 									currentUpdateApplyHandlers
/******/ 								);
/******/ 							});
/******/ 							setStatus("ready");
/******/ 							break;
/******/ 						case "ready":
/******/ 							Object.keys(__webpack_require__.hmrI).forEach(function (key) {
/******/ 								__webpack_require__.hmrI[key](
/******/ 									moduleId,
/******/ 									currentUpdateApplyHandlers
/******/ 								);
/******/ 							});
/******/ 							break;
/******/ 						case "prepare":
/******/ 						case "check":
/******/ 						case "dispose":
/******/ 						case "apply":
/******/ 							(queuedInvalidatedModules = queuedInvalidatedModules || []).push(
/******/ 								moduleId
/******/ 							);
/******/ 							break;
/******/ 						default:
/******/ 							// ignore requests in error states
/******/ 							break;
/******/ 					}
/******/ 				},
/******/ 		
/******/ 				// Management API
/******/ 				check: hotCheck,
/******/ 				apply: hotApply,
/******/ 				status: function (l) {
/******/ 					if (!l) return currentStatus;
/******/ 					registeredStatusHandlers.push(l);
/******/ 				},
/******/ 				addStatusHandler: function (l) {
/******/ 					registeredStatusHandlers.push(l);
/******/ 				},
/******/ 				removeStatusHandler: function (l) {
/******/ 					var idx = registeredStatusHandlers.indexOf(l);
/******/ 					if (idx >= 0) registeredStatusHandlers.splice(idx, 1);
/******/ 				},
/******/ 		
/******/ 				//inherit from previous dispose call
/******/ 				data: currentModuleData[moduleId]
/******/ 			};
/******/ 			currentChildModule = undefined;
/******/ 			return hot;
/******/ 		}
/******/ 		
/******/ 		function setStatus(newStatus) {
/******/ 			currentStatus = newStatus;
/******/ 			var results = [];
/******/ 		
/******/ 			for (var i = 0; i < registeredStatusHandlers.length; i++)
/******/ 				results[i] = registeredStatusHandlers[i].call(null, newStatus);
/******/ 		
/******/ 			return Promise.all(results);
/******/ 		}
/******/ 		
/******/ 		function trackBlockingPromise(promise) {
/******/ 			switch (currentStatus) {
/******/ 				case "ready":
/******/ 					setStatus("prepare");
/******/ 					blockingPromises.push(promise);
/******/ 					waitForBlockingPromises(function () {
/******/ 						return setStatus("ready");
/******/ 					});
/******/ 					return promise;
/******/ 				case "prepare":
/******/ 					blockingPromises.push(promise);
/******/ 					return promise;
/******/ 				default:
/******/ 					return promise;
/******/ 			}
/******/ 		}
/******/ 		
/******/ 		function waitForBlockingPromises(fn) {
/******/ 			if (blockingPromises.length === 0) return fn();
/******/ 			var blocker = blockingPromises;
/******/ 			blockingPromises = [];
/******/ 			return Promise.all(blocker).then(function () {
/******/ 				return waitForBlockingPromises(fn);
/******/ 			});
/******/ 		}
/******/ 		
/******/ 		function hotCheck(applyOnUpdate) {
/******/ 			if (currentStatus !== "idle") {
/******/ 				throw new Error("check() is only allowed in idle status");
/******/ 			}
/******/ 			return setStatus("check")
/******/ 				.then(__webpack_require__.hmrM)
/******/ 				.then(function (update) {
/******/ 					if (!update) {
/******/ 						return setStatus(applyInvalidatedModules() ? "ready" : "idle").then(
/******/ 							function () {
/******/ 								return null;
/******/ 							}
/******/ 						);
/******/ 					}
/******/ 		
/******/ 					return setStatus("prepare").then(function () {
/******/ 						var updatedModules = [];
/******/ 						blockingPromises = [];
/******/ 						currentUpdateApplyHandlers = [];
/******/ 		
/******/ 						return Promise.all(
/******/ 							Object.keys(__webpack_require__.hmrC).reduce(function (
/******/ 								promises,
/******/ 								key
/******/ 							) {
/******/ 								__webpack_require__.hmrC[key](
/******/ 									update.c,
/******/ 									update.r,
/******/ 									update.m,
/******/ 									promises,
/******/ 									currentUpdateApplyHandlers,
/******/ 									updatedModules
/******/ 								);
/******/ 								return promises;
/******/ 							},
/******/ 							[])
/******/ 						).then(function () {
/******/ 							return waitForBlockingPromises(function () {
/******/ 								if (applyOnUpdate) {
/******/ 									return internalApply(applyOnUpdate);
/******/ 								} else {
/******/ 									return setStatus("ready").then(function () {
/******/ 										return updatedModules;
/******/ 									});
/******/ 								}
/******/ 							});
/******/ 						});
/******/ 					});
/******/ 				});
/******/ 		}
/******/ 		
/******/ 		function hotApply(options) {
/******/ 			if (currentStatus !== "ready") {
/******/ 				return Promise.resolve().then(function () {
/******/ 					throw new Error("apply() is only allowed in ready status");
/******/ 				});
/******/ 			}
/******/ 			return internalApply(options);
/******/ 		}
/******/ 		
/******/ 		function internalApply(options) {
/******/ 			options = options || {};
/******/ 		
/******/ 			applyInvalidatedModules();
/******/ 		
/******/ 			var results = currentUpdateApplyHandlers.map(function (handler) {
/******/ 				return handler(options);
/******/ 			});
/******/ 			currentUpdateApplyHandlers = undefined;
/******/ 		
/******/ 			var errors = results
/******/ 				.map(function (r) {
/******/ 					return r.error;
/******/ 				})
/******/ 				.filter(Boolean);
/******/ 		
/******/ 			if (errors.length > 0) {
/******/ 				return setStatus("abort").then(function () {
/******/ 					throw errors[0];
/******/ 				});
/******/ 			}
/******/ 		
/******/ 			// Now in "dispose" phase
/******/ 			var disposePromise = setStatus("dispose");
/******/ 		
/******/ 			results.forEach(function (result) {
/******/ 				if (result.dispose) result.dispose();
/******/ 			});
/******/ 		
/******/ 			// Now in "apply" phase
/******/ 			var applyPromise = setStatus("apply");
/******/ 		
/******/ 			var error;
/******/ 			var reportError = function (err) {
/******/ 				if (!error) error = err;
/******/ 			};
/******/ 		
/******/ 			var outdatedModules = [];
/******/ 			results.forEach(function (result) {
/******/ 				if (result.apply) {
/******/ 					var modules = result.apply(reportError);
/******/ 					if (modules) {
/******/ 						for (var i = 0; i < modules.length; i++) {
/******/ 							outdatedModules.push(modules[i]);
/******/ 						}
/******/ 					}
/******/ 				}
/******/ 			});
/******/ 		
/******/ 			return Promise.all([disposePromise, applyPromise]).then(function () {
/******/ 				// handle errors in accept handlers and self accepted module load
/******/ 				if (error) {
/******/ 					return setStatus("fail").then(function () {
/******/ 						throw error;
/******/ 					});
/******/ 				}
/******/ 		
/******/ 				if (queuedInvalidatedModules) {
/******/ 					return internalApply(options).then(function (list) {
/******/ 						outdatedModules.forEach(function (moduleId) {
/******/ 							if (list.indexOf(moduleId) < 0) list.push(moduleId);
/******/ 						});
/******/ 						return list;
/******/ 					});
/******/ 				}
/******/ 		
/******/ 				return setStatus("idle").then(function () {
/******/ 					return outdatedModules;
/******/ 				});
/******/ 			});
/******/ 		}
/******/ 		
/******/ 		function applyInvalidatedModules() {
/******/ 			if (queuedInvalidatedModules) {
/******/ 				if (!currentUpdateApplyHandlers) currentUpdateApplyHandlers = [];
/******/ 				Object.keys(__webpack_require__.hmrI).forEach(function (key) {
/******/ 					queuedInvalidatedModules.forEach(function (moduleId) {
/******/ 						__webpack_require__.hmrI[key](
/******/ 							moduleId,
/******/ 							currentUpdateApplyHandlers
/******/ 						);
/******/ 					});
/******/ 				});
/******/ 				queuedInvalidatedModules = undefined;
/******/ 				return true;
/******/ 			}
/******/ 		}
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript)
/******/ 				scriptUrl = document.currentScript.src
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) scriptUrl = scripts[scripts.length - 1].src
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"main": 0
/******/ 		};
/******/ 		
/******/ 		__webpack_require__.f.j = (chunkId, promises) => {
/******/ 				// JSONP chunk loading for javascript
/******/ 				var installedChunkData = __webpack_require__.o(installedChunks, chunkId) ? installedChunks[chunkId] : undefined;
/******/ 				if(installedChunkData !== 0) { // 0 means "already installed".
/******/ 		
/******/ 					// a Promise means "currently loading".
/******/ 					if(installedChunkData) {
/******/ 						promises.push(installedChunkData[2]);
/******/ 					} else {
/******/ 						if(true) { // all chunks have JS
/******/ 							// setup Promise in chunk cache
/******/ 							var promise = new Promise((resolve, reject) => (installedChunkData = installedChunks[chunkId] = [resolve, reject]));
/******/ 							promises.push(installedChunkData[2] = promise);
/******/ 		
/******/ 							// start chunk loading
/******/ 							var url = __webpack_require__.p + __webpack_require__.u(chunkId);
/******/ 							// create error before stack unwound to get useful stacktrace later
/******/ 							var error = new Error();
/******/ 							var loadingEnded = (event) => {
/******/ 								if(__webpack_require__.o(installedChunks, chunkId)) {
/******/ 									installedChunkData = installedChunks[chunkId];
/******/ 									if(installedChunkData !== 0) installedChunks[chunkId] = undefined;
/******/ 									if(installedChunkData) {
/******/ 										var errorType = event && (event.type === 'load' ? 'missing' : event.type);
/******/ 										var realSrc = event && event.target && event.target.src;
/******/ 										error.message = 'Loading chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')';
/******/ 										error.name = 'ChunkLoadError';
/******/ 										error.type = errorType;
/******/ 										error.request = realSrc;
/******/ 										installedChunkData[1](error);
/******/ 									}
/******/ 								}
/******/ 							};
/******/ 							__webpack_require__.l(url, loadingEnded, "chunk-" + chunkId, chunkId);
/******/ 						} else installedChunks[chunkId] = 0;
/******/ 					}
/******/ 				}
/******/ 		};
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		var currentUpdatedModulesList;
/******/ 		var waitingUpdateResolves = {};
/******/ 		function loadUpdateChunk(chunkId) {
/******/ 			return new Promise((resolve, reject) => {
/******/ 				waitingUpdateResolves[chunkId] = resolve;
/******/ 				// start update chunk loading
/******/ 				var url = __webpack_require__.p + __webpack_require__.hu(chunkId);
/******/ 				// create error before stack unwound to get useful stacktrace later
/******/ 				var error = new Error();
/******/ 				var loadingEnded = (event) => {
/******/ 					if(waitingUpdateResolves[chunkId]) {
/******/ 						waitingUpdateResolves[chunkId] = undefined
/******/ 						var errorType = event && (event.type === 'load' ? 'missing' : event.type);
/******/ 						var realSrc = event && event.target && event.target.src;
/******/ 						error.message = 'Loading hot update chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')';
/******/ 						error.name = 'ChunkLoadError';
/******/ 						error.type = errorType;
/******/ 						error.request = realSrc;
/******/ 						reject(error);
/******/ 					}
/******/ 				};
/******/ 				__webpack_require__.l(url, loadingEnded);
/******/ 			});
/******/ 		}
/******/ 		
/******/ 		self["webpackHotUpdatesf2rend"] = (chunkId, moreModules, runtime) => {
/******/ 			for(var moduleId in moreModules) {
/******/ 				if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 					currentUpdate[moduleId] = moreModules[moduleId];
/******/ 					if(currentUpdatedModulesList) currentUpdatedModulesList.push(moduleId);
/******/ 				}
/******/ 			}
/******/ 			if(runtime) currentUpdateRuntime.push(runtime);
/******/ 			if(waitingUpdateResolves[chunkId]) {
/******/ 				waitingUpdateResolves[chunkId]();
/******/ 				waitingUpdateResolves[chunkId] = undefined;
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		var currentUpdateChunks;
/******/ 		var currentUpdate;
/******/ 		var currentUpdateRemovedChunks;
/******/ 		var currentUpdateRuntime;
/******/ 		function applyHandler(options) {
/******/ 			if (__webpack_require__.f) delete __webpack_require__.f.jsonpHmr;
/******/ 			currentUpdateChunks = undefined;
/******/ 			function getAffectedModuleEffects(updateModuleId) {
/******/ 				var outdatedModules = [updateModuleId];
/******/ 				var outdatedDependencies = {};
/******/ 		
/******/ 				var queue = outdatedModules.map(function (id) {
/******/ 					return {
/******/ 						chain: [id],
/******/ 						id: id
/******/ 					};
/******/ 				});
/******/ 				while (queue.length > 0) {
/******/ 					var queueItem = queue.pop();
/******/ 					var moduleId = queueItem.id;
/******/ 					var chain = queueItem.chain;
/******/ 					var module = __webpack_require__.c[moduleId];
/******/ 					if (
/******/ 						!module ||
/******/ 						(module.hot._selfAccepted && !module.hot._selfInvalidated)
/******/ 					)
/******/ 						continue;
/******/ 					if (module.hot._selfDeclined) {
/******/ 						return {
/******/ 							type: "self-declined",
/******/ 							chain: chain,
/******/ 							moduleId: moduleId
/******/ 						};
/******/ 					}
/******/ 					if (module.hot._main) {
/******/ 						return {
/******/ 							type: "unaccepted",
/******/ 							chain: chain,
/******/ 							moduleId: moduleId
/******/ 						};
/******/ 					}
/******/ 					for (var i = 0; i < module.parents.length; i++) {
/******/ 						var parentId = module.parents[i];
/******/ 						var parent = __webpack_require__.c[parentId];
/******/ 						if (!parent) continue;
/******/ 						if (parent.hot._declinedDependencies[moduleId]) {
/******/ 							return {
/******/ 								type: "declined",
/******/ 								chain: chain.concat([parentId]),
/******/ 								moduleId: moduleId,
/******/ 								parentId: parentId
/******/ 							};
/******/ 						}
/******/ 						if (outdatedModules.indexOf(parentId) !== -1) continue;
/******/ 						if (parent.hot._acceptedDependencies[moduleId]) {
/******/ 							if (!outdatedDependencies[parentId])
/******/ 								outdatedDependencies[parentId] = [];
/******/ 							addAllToSet(outdatedDependencies[parentId], [moduleId]);
/******/ 							continue;
/******/ 						}
/******/ 						delete outdatedDependencies[parentId];
/******/ 						outdatedModules.push(parentId);
/******/ 						queue.push({
/******/ 							chain: chain.concat([parentId]),
/******/ 							id: parentId
/******/ 						});
/******/ 					}
/******/ 				}
/******/ 		
/******/ 				return {
/******/ 					type: "accepted",
/******/ 					moduleId: updateModuleId,
/******/ 					outdatedModules: outdatedModules,
/******/ 					outdatedDependencies: outdatedDependencies
/******/ 				};
/******/ 			}
/******/ 		
/******/ 			function addAllToSet(a, b) {
/******/ 				for (var i = 0; i < b.length; i++) {
/******/ 					var item = b[i];
/******/ 					if (a.indexOf(item) === -1) a.push(item);
/******/ 				}
/******/ 			}
/******/ 		
/******/ 			// at begin all updates modules are outdated
/******/ 			// the "outdated" status can propagate to parents if they don't accept the children
/******/ 			var outdatedDependencies = {};
/******/ 			var outdatedModules = [];
/******/ 			var appliedUpdate = {};
/******/ 		
/******/ 			var warnUnexpectedRequire = function warnUnexpectedRequire(module) {
/******/ 				console.warn(
/******/ 					"[HMR] unexpected require(" + module.id + ") to disposed module"
/******/ 				);
/******/ 			};
/******/ 		
/******/ 			for (var moduleId in currentUpdate) {
/******/ 				if (__webpack_require__.o(currentUpdate, moduleId)) {
/******/ 					var newModuleFactory = currentUpdate[moduleId];
/******/ 					/** @type {TODO} */
/******/ 					var result;
/******/ 					if (newModuleFactory) {
/******/ 						result = getAffectedModuleEffects(moduleId);
/******/ 					} else {
/******/ 						result = {
/******/ 							type: "disposed",
/******/ 							moduleId: moduleId
/******/ 						};
/******/ 					}
/******/ 					/** @type {Error|false} */
/******/ 					var abortError = false;
/******/ 					var doApply = false;
/******/ 					var doDispose = false;
/******/ 					var chainInfo = "";
/******/ 					if (result.chain) {
/******/ 						chainInfo = "\nUpdate propagation: " + result.chain.join(" -> ");
/******/ 					}
/******/ 					switch (result.type) {
/******/ 						case "self-declined":
/******/ 							if (options.onDeclined) options.onDeclined(result);
/******/ 							if (!options.ignoreDeclined)
/******/ 								abortError = new Error(
/******/ 									"Aborted because of self decline: " +
/******/ 										result.moduleId +
/******/ 										chainInfo
/******/ 								);
/******/ 							break;
/******/ 						case "declined":
/******/ 							if (options.onDeclined) options.onDeclined(result);
/******/ 							if (!options.ignoreDeclined)
/******/ 								abortError = new Error(
/******/ 									"Aborted because of declined dependency: " +
/******/ 										result.moduleId +
/******/ 										" in " +
/******/ 										result.parentId +
/******/ 										chainInfo
/******/ 								);
/******/ 							break;
/******/ 						case "unaccepted":
/******/ 							if (options.onUnaccepted) options.onUnaccepted(result);
/******/ 							if (!options.ignoreUnaccepted)
/******/ 								abortError = new Error(
/******/ 									"Aborted because " + moduleId + " is not accepted" + chainInfo
/******/ 								);
/******/ 							break;
/******/ 						case "accepted":
/******/ 							if (options.onAccepted) options.onAccepted(result);
/******/ 							doApply = true;
/******/ 							break;
/******/ 						case "disposed":
/******/ 							if (options.onDisposed) options.onDisposed(result);
/******/ 							doDispose = true;
/******/ 							break;
/******/ 						default:
/******/ 							throw new Error("Unexception type " + result.type);
/******/ 					}
/******/ 					if (abortError) {
/******/ 						return {
/******/ 							error: abortError
/******/ 						};
/******/ 					}
/******/ 					if (doApply) {
/******/ 						appliedUpdate[moduleId] = newModuleFactory;
/******/ 						addAllToSet(outdatedModules, result.outdatedModules);
/******/ 						for (moduleId in result.outdatedDependencies) {
/******/ 							if (__webpack_require__.o(result.outdatedDependencies, moduleId)) {
/******/ 								if (!outdatedDependencies[moduleId])
/******/ 									outdatedDependencies[moduleId] = [];
/******/ 								addAllToSet(
/******/ 									outdatedDependencies[moduleId],
/******/ 									result.outdatedDependencies[moduleId]
/******/ 								);
/******/ 							}
/******/ 						}
/******/ 					}
/******/ 					if (doDispose) {
/******/ 						addAllToSet(outdatedModules, [result.moduleId]);
/******/ 						appliedUpdate[moduleId] = warnUnexpectedRequire;
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 			currentUpdate = undefined;
/******/ 		
/******/ 			// Store self accepted outdated modules to require them later by the module system
/******/ 			var outdatedSelfAcceptedModules = [];
/******/ 			for (var j = 0; j < outdatedModules.length; j++) {
/******/ 				var outdatedModuleId = outdatedModules[j];
/******/ 				var module = __webpack_require__.c[outdatedModuleId];
/******/ 				if (
/******/ 					module &&
/******/ 					(module.hot._selfAccepted || module.hot._main) &&
/******/ 					// removed self-accepted modules should not be required
/******/ 					appliedUpdate[outdatedModuleId] !== warnUnexpectedRequire &&
/******/ 					// when called invalidate self-accepting is not possible
/******/ 					!module.hot._selfInvalidated
/******/ 				) {
/******/ 					outdatedSelfAcceptedModules.push({
/******/ 						module: outdatedModuleId,
/******/ 						require: module.hot._requireSelf,
/******/ 						errorHandler: module.hot._selfAccepted
/******/ 					});
/******/ 				}
/******/ 			}
/******/ 		
/******/ 			var moduleOutdatedDependencies;
/******/ 		
/******/ 			return {
/******/ 				dispose: function () {
/******/ 					currentUpdateRemovedChunks.forEach(function (chunkId) {
/******/ 						delete installedChunks[chunkId];
/******/ 					});
/******/ 					currentUpdateRemovedChunks = undefined;
/******/ 		
/******/ 					var idx;
/******/ 					var queue = outdatedModules.slice();
/******/ 					while (queue.length > 0) {
/******/ 						var moduleId = queue.pop();
/******/ 						var module = __webpack_require__.c[moduleId];
/******/ 						if (!module) continue;
/******/ 		
/******/ 						var data = {};
/******/ 		
/******/ 						// Call dispose handlers
/******/ 						var disposeHandlers = module.hot._disposeHandlers;
/******/ 						for (j = 0; j < disposeHandlers.length; j++) {
/******/ 							disposeHandlers[j].call(null, data);
/******/ 						}
/******/ 						__webpack_require__.hmrD[moduleId] = data;
/******/ 		
/******/ 						// disable module (this disables requires from this module)
/******/ 						module.hot.active = false;
/******/ 		
/******/ 						// remove module from cache
/******/ 						delete __webpack_require__.c[moduleId];
/******/ 		
/******/ 						// when disposing there is no need to call dispose handler
/******/ 						delete outdatedDependencies[moduleId];
/******/ 		
/******/ 						// remove "parents" references from all children
/******/ 						for (j = 0; j < module.children.length; j++) {
/******/ 							var child = __webpack_require__.c[module.children[j]];
/******/ 							if (!child) continue;
/******/ 							idx = child.parents.indexOf(moduleId);
/******/ 							if (idx >= 0) {
/******/ 								child.parents.splice(idx, 1);
/******/ 							}
/******/ 						}
/******/ 					}
/******/ 		
/******/ 					// remove outdated dependency from module children
/******/ 					var dependency;
/******/ 					for (var outdatedModuleId in outdatedDependencies) {
/******/ 						if (__webpack_require__.o(outdatedDependencies, outdatedModuleId)) {
/******/ 							module = __webpack_require__.c[outdatedModuleId];
/******/ 							if (module) {
/******/ 								moduleOutdatedDependencies =
/******/ 									outdatedDependencies[outdatedModuleId];
/******/ 								for (j = 0; j < moduleOutdatedDependencies.length; j++) {
/******/ 									dependency = moduleOutdatedDependencies[j];
/******/ 									idx = module.children.indexOf(dependency);
/******/ 									if (idx >= 0) module.children.splice(idx, 1);
/******/ 								}
/******/ 							}
/******/ 						}
/******/ 					}
/******/ 				},
/******/ 				apply: function (reportError) {
/******/ 					// insert new code
/******/ 					for (var updateModuleId in appliedUpdate) {
/******/ 						if (__webpack_require__.o(appliedUpdate, updateModuleId)) {
/******/ 							__webpack_require__.m[updateModuleId] = appliedUpdate[updateModuleId];
/******/ 						}
/******/ 					}
/******/ 		
/******/ 					// run new runtime modules
/******/ 					for (var i = 0; i < currentUpdateRuntime.length; i++) {
/******/ 						currentUpdateRuntime[i](__webpack_require__);
/******/ 					}
/******/ 		
/******/ 					// call accept handlers
/******/ 					for (var outdatedModuleId in outdatedDependencies) {
/******/ 						if (__webpack_require__.o(outdatedDependencies, outdatedModuleId)) {
/******/ 							var module = __webpack_require__.c[outdatedModuleId];
/******/ 							if (module) {
/******/ 								moduleOutdatedDependencies =
/******/ 									outdatedDependencies[outdatedModuleId];
/******/ 								var callbacks = [];
/******/ 								var errorHandlers = [];
/******/ 								var dependenciesForCallbacks = [];
/******/ 								for (var j = 0; j < moduleOutdatedDependencies.length; j++) {
/******/ 									var dependency = moduleOutdatedDependencies[j];
/******/ 									var acceptCallback =
/******/ 										module.hot._acceptedDependencies[dependency];
/******/ 									var errorHandler =
/******/ 										module.hot._acceptedErrorHandlers[dependency];
/******/ 									if (acceptCallback) {
/******/ 										if (callbacks.indexOf(acceptCallback) !== -1) continue;
/******/ 										callbacks.push(acceptCallback);
/******/ 										errorHandlers.push(errorHandler);
/******/ 										dependenciesForCallbacks.push(dependency);
/******/ 									}
/******/ 								}
/******/ 								for (var k = 0; k < callbacks.length; k++) {
/******/ 									try {
/******/ 										callbacks[k].call(null, moduleOutdatedDependencies);
/******/ 									} catch (err) {
/******/ 										if (typeof errorHandlers[k] === "function") {
/******/ 											try {
/******/ 												errorHandlers[k](err, {
/******/ 													moduleId: outdatedModuleId,
/******/ 													dependencyId: dependenciesForCallbacks[k]
/******/ 												});
/******/ 											} catch (err2) {
/******/ 												if (options.onErrored) {
/******/ 													options.onErrored({
/******/ 														type: "accept-error-handler-errored",
/******/ 														moduleId: outdatedModuleId,
/******/ 														dependencyId: dependenciesForCallbacks[k],
/******/ 														error: err2,
/******/ 														originalError: err
/******/ 													});
/******/ 												}
/******/ 												if (!options.ignoreErrored) {
/******/ 													reportError(err2);
/******/ 													reportError(err);
/******/ 												}
/******/ 											}
/******/ 										} else {
/******/ 											if (options.onErrored) {
/******/ 												options.onErrored({
/******/ 													type: "accept-errored",
/******/ 													moduleId: outdatedModuleId,
/******/ 													dependencyId: dependenciesForCallbacks[k],
/******/ 													error: err
/******/ 												});
/******/ 											}
/******/ 											if (!options.ignoreErrored) {
/******/ 												reportError(err);
/******/ 											}
/******/ 										}
/******/ 									}
/******/ 								}
/******/ 							}
/******/ 						}
/******/ 					}
/******/ 		
/******/ 					// Load self accepted modules
/******/ 					for (var o = 0; o < outdatedSelfAcceptedModules.length; o++) {
/******/ 						var item = outdatedSelfAcceptedModules[o];
/******/ 						var moduleId = item.module;
/******/ 						try {
/******/ 							item.require(moduleId);
/******/ 						} catch (err) {
/******/ 							if (typeof item.errorHandler === "function") {
/******/ 								try {
/******/ 									item.errorHandler(err, {
/******/ 										moduleId: moduleId,
/******/ 										module: __webpack_require__.c[moduleId]
/******/ 									});
/******/ 								} catch (err2) {
/******/ 									if (options.onErrored) {
/******/ 										options.onErrored({
/******/ 											type: "self-accept-error-handler-errored",
/******/ 											moduleId: moduleId,
/******/ 											error: err2,
/******/ 											originalError: err
/******/ 										});
/******/ 									}
/******/ 									if (!options.ignoreErrored) {
/******/ 										reportError(err2);
/******/ 										reportError(err);
/******/ 									}
/******/ 								}
/******/ 							} else {
/******/ 								if (options.onErrored) {
/******/ 									options.onErrored({
/******/ 										type: "self-accept-errored",
/******/ 										moduleId: moduleId,
/******/ 										error: err
/******/ 									});
/******/ 								}
/******/ 								if (!options.ignoreErrored) {
/******/ 									reportError(err);
/******/ 								}
/******/ 							}
/******/ 						}
/******/ 					}
/******/ 		
/******/ 					return outdatedModules;
/******/ 				}
/******/ 			};
/******/ 		}
/******/ 		__webpack_require__.hmrI.jsonp = function (moduleId, applyHandlers) {
/******/ 			if (!currentUpdate) {
/******/ 				currentUpdate = {};
/******/ 				currentUpdateRuntime = [];
/******/ 				currentUpdateRemovedChunks = [];
/******/ 				applyHandlers.push(applyHandler);
/******/ 			}
/******/ 			if (!__webpack_require__.o(currentUpdate, moduleId)) {
/******/ 				currentUpdate[moduleId] = __webpack_require__.m[moduleId];
/******/ 			}
/******/ 		};
/******/ 		__webpack_require__.hmrC.jsonp = function (
/******/ 			chunkIds,
/******/ 			removedChunks,
/******/ 			removedModules,
/******/ 			promises,
/******/ 			applyHandlers,
/******/ 			updatedModulesList
/******/ 		) {
/******/ 			applyHandlers.push(applyHandler);
/******/ 			currentUpdateChunks = {};
/******/ 			currentUpdateRemovedChunks = removedChunks;
/******/ 			currentUpdate = removedModules.reduce(function (obj, key) {
/******/ 				obj[key] = false;
/******/ 				return obj;
/******/ 			}, {});
/******/ 			currentUpdateRuntime = [];
/******/ 			chunkIds.forEach(function (chunkId) {
/******/ 				if (
/******/ 					__webpack_require__.o(installedChunks, chunkId) &&
/******/ 					installedChunks[chunkId] !== undefined
/******/ 				) {
/******/ 					promises.push(loadUpdateChunk(chunkId, updatedModulesList));
/******/ 					currentUpdateChunks[chunkId] = true;
/******/ 				}
/******/ 			});
/******/ 			if (__webpack_require__.f) {
/******/ 				__webpack_require__.f.jsonpHmr = function (chunkId, promises) {
/******/ 					if (
/******/ 						currentUpdateChunks &&
/******/ 						!__webpack_require__.o(currentUpdateChunks, chunkId) &&
/******/ 						__webpack_require__.o(installedChunks, chunkId) &&
/******/ 						installedChunks[chunkId] !== undefined
/******/ 					) {
/******/ 						promises.push(loadUpdateChunk(chunkId));
/******/ 						currentUpdateChunks[chunkId] = true;
/******/ 					}
/******/ 				};
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		__webpack_require__.hmrM = () => {
/******/ 			if (typeof fetch === "undefined") throw new Error("No browser support: need fetch API");
/******/ 			return fetch(__webpack_require__.p + __webpack_require__.hmrF()).then((response) => {
/******/ 				if(response.status === 404) return; // no update available
/******/ 				if(!response.ok) throw new Error("Failed to fetch update manifest " + response.statusText);
/******/ 				return response.json();
/******/ 			});
/******/ 		};
/******/ 		
/******/ 		// no on chunks loaded
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			for(moduleId in moreModules) {
/******/ 				if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 					__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 				}
/******/ 			}
/******/ 			if(runtime) var result = runtime(__webpack_require__);
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkIds[i]] = 0;
/******/ 			}
/******/ 		
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunksf2rend"] = self["webpackChunksf2rend"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// module cache are used so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.js");
/******/ 	
/******/ })()
;