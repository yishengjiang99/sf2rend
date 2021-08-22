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

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"WIDTH\": () => (/* binding */ WIDTH),\n/* harmony export */   \"HEIGHT\": () => (/* binding */ HEIGHT),\n/* harmony export */   \"resetCanvas\": () => (/* binding */ resetCanvas),\n/* harmony export */   \"chart\": () => (/* binding */ chart),\n/* harmony export */   \"mkcanvas\": () => (/* binding */ mkcanvas),\n/* harmony export */   \"renderFrames\": () => (/* binding */ renderFrames),\n/* harmony export */   \"mkdiv\": () => (/* binding */ mkdiv),\n/* harmony export */   \"wrapDiv\": () => (/* binding */ wrapDiv),\n/* harmony export */   \"wrapList\": () => (/* binding */ wrapList)\n/* harmony export */ });\n//@ts-ignore\nconst WIDTH = 480; // / 2,\nconst HEIGHT = 320;\nfunction get_w_h(canvasCtx) {\n  return [\n    canvasCtx.canvas.getAttribute(\"width\")\n      ? parseInt(canvasCtx.canvas.getAttribute(\"width\"))\n      : WIDTH,\n    canvasCtx.canvas.getAttribute(\"height\")\n      ? parseInt(canvasCtx.canvas.getAttribute(\"height\"))\n      : HEIGHT,\n  ];\n}\nfunction resetCanvas(c) {\n  if (!c) return;\n  const canvasCtx = c;\n  const [_width, _height] = get_w_h(canvasCtx);\n  canvasCtx.clearRect(0, 0, _width, _height);\n  canvasCtx.fillStyle = \"black\";\n  canvasCtx.fillRect(0, 0, _width, _height);\n}\nfunction chart(canvasCtx, dataArray) {\n  resetCanvas(canvasCtx);\n  const [_width, _height] = get_w_h(canvasCtx);\n  let max = 0,\n    min = 0,\n    x = 0;\n  let iWIDTH = _width / dataArray.length; //strokeText(`r m s : ${sum / bufferLength}`, 10, 20, 100)\n  for (let i = 1; i < dataArray.length; i++) {\n    max = dataArray[i] > max ? dataArray[i] : max;\n  }\n  canvasCtx.beginPath();\n  // canvasCtx.lineWidth = 0.1;\n  // canvasCtx.moveTo(0, _height / 2);\n  // canvasCtx.lineTo(_width, _height / 2);\n  // canvasCtx.stroke();\n  canvasCtx.lineWidth = 2;\n  canvasCtx.strokeStyle = \"white\";\n  canvasCtx.moveTo(0, _height / 2);\n  for (let i = 1; i < dataArray.length; i++) {\n    x += iWIDTH;\n    canvasCtx.lineTo(x, _height / 2 - (_height / 4) * dataArray[i]);\n  }\n  canvasCtx.stroke();\n  canvasCtx.restore();\n  canvasCtx.font = \"1em Arial\";\n}\nfunction mkcanvas(params = {}) {\n  const { width, height, container, title } = Object.assign(\n    {\n      container: document.body,\n      title: \"\",\n      width: WIDTH,\n      height: HEIGHT,\n    },\n    params\n  );\n  const canvas = document.createElement(\"canvas\");\n  canvas.setAttribute(\"width\", `${width}`);\n  canvas.setAttribute(\"height\", `${height}`);\n  const canvasCtx = canvas.getContext(\"2d\");\n  canvasCtx.lineWidth = 2;\n  canvasCtx.strokeStyle = \"white\";\n  canvasCtx.fillStyle = \"black\";\n  canvasCtx.font = \"2em\";\n  const wrap = mkdiv(\"div\", {}, [title ? mkdiv(\"h5\", {}, title) : \"\", canvas]);\n  container.append(wrap);\n  canvas.ondblclick = () => resetCanvas(canvasCtx);\n  return canvasCtx;\n}\nasync function renderFrames(\n  canvsCtx,\n  arr,\n  fps = 60,\n  samplesPerFrame = 48000 / 60\n) {\n  let nextframe,\n    offset = 0;\n  while (arr.length > offset) {\n    if (!nextframe || performance.now() > nextframe) {\n      chart(canvsCtx, arr.slice(offset, offset + samplesPerFrame));\n      nextframe = 1 / fps + performance.now();\n      offset += samplesPerFrame / 4;\n    }\n    await new Promise((r) => requestAnimationFrame(r));\n  }\n  function onclick({ x, target }) {\n    offset += (x < target.clientWidth / 2 ? -1 : 1) * samplesPerFrame;\n    chart(canvsCtx, arr.slice(offset, offset + samplesPerFrame));\n    const existingSlider = canvsCtx.canvas?.parentElement?.querySelector(\n      \"input[type='range']\"\n    );\n    const slider =\n      existingSlider ||\n      mkdiv(\"input\", {\n        type: \"range\",\n        min: -10,\n        max: 100,\n        value: 100,\n        step: 0,\n        oninput: (e) => {\n          const { max, value } = e.target;\n          offset = (arr.length * parseInt(value)) / parseInt(max);\n          chart(canvsCtx, arr.slice(offset, offset + samplesPerFrame));\n        },\n      }).attachTo(canvsCtx.canvas.parentElement);\n  }\n  canvsCtx.canvas.addEventListener(\"click\", onclick);\n  canvsCtx.canvas.addEventListener(\"dblclick\", function (e) {\n    e.x;\n    offset += (e.x < canvsCtx.canvas.width / 2 ? -1 : 1) * samplesPerFrame;\n    chart(canvsCtx, arr.slice(offset, offset + samplesPerFrame));\n  });\n}\nfunction mkdiv(type, attr = {}, children = \"\") {\n  // if (attr && typeof attr != \"object\" && !children)\n  //   return mkdiv(type, {}, attr);\n  const div = document.createElement(type);\n  for (const key in attr) {\n    if (key.match(/on(.*)/)) {\n      div.addEventListener(key.match(/on(.*)/)[1], attr[key]);\n    } else {\n      div.setAttribute(key, attr[key]);\n    }\n  }\n  const charray = !Array.isArray(children) ? [children] : children;\n  charray.forEach((c) => {\n    typeof c == \"string\" ? (div.innerHTML += c) : div.append(c);\n  });\n  return div;\n}\nHTMLElement.prototype.attachTo = function (parent) {\n  parent.append(this);\n  return this;\n};\nHTMLElement.prototype.wrapWith = function (tag) {\n  const parent = mkdiv(tag);\n  parent.append(this);\n  return parent;\n};\n\nfunction wrapDiv(div, tag, attrs = {}) {\n  return mkdiv(tag, attrs, [div]);\n}\nfunction wrapList(divs) {\n  return mkdiv(\"div\", {}, divs);\n}\n\n\n//# sourceURL=webpack://sf2rend/./chart/chart.js?");

/***/ }),

/***/ "./fetch-drop-ship/fetch-drop-ship.js":
/*!********************************************!*\
  !*** ./fetch-drop-ship/fetch-drop-ship.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"requestDownload\": () => (/* binding */ requestDownload),\n/* harmony export */   \"getWorker\": () => (/* binding */ getWorker)\n/* harmony export */ });\nasync function requestDownload(program, port) {\n  await Promise.all(\n    Object.values(program.shdrMap).map(async (shdr) => {\n      const res = await fetch(program.url, {\n        headers: {\n          Range: `bytes=${shdr.range.join(\"-\")}`,\n        },\n      });\n\n      port.postMessage(\n        {\n          segments: {\n            sampleId: shdr.SampleId,\n            nSamples: (shdr.range[1] + 1 - shdr.range[0]) / 2,\n          },\n          stream: res.body,\n        },\n        [res.body]\n      );\n      await res.body.closed;\n    })\n  );\n}\nconst getWorker = () => {};\n\n\n//# sourceURL=webpack://sf2rend/./fetch-drop-ship/fetch-drop-ship.js?");

/***/ }),

/***/ "./mkdiv/mkdiv.js":
/*!************************!*\
  !*** ./mkdiv/mkdiv.js ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"mkdiv\": () => (/* binding */ mkdiv),\n/* harmony export */   \"mksvg\": () => (/* binding */ mksvg),\n/* harmony export */   \"logdiv\": () => (/* binding */ logdiv),\n/* harmony export */   \"wrapDiv\": () => (/* binding */ wrapDiv),\n/* harmony export */   \"wrapList\": () => (/* binding */ wrapList)\n/* harmony export */ });\nfunction mkdiv(type, attr = {}, children = \"\") {\n  // if (attr && typeof attr != \"object\" && !children)\n  //   return mkdiv(type, {}, attr);\n  const div = document.createElement(type);\n  for (const key in attr) {\n    if (key.match(/on(.*)/)) {\n      div.addEventListener(key.match(/on(.*)/)[1], attr[key]);\n    } else {\n      div.setAttribute(key, attr[key]);\n    }\n  }\n  const charray = !Array.isArray(children) ? [children] : children;\n  charray.forEach((c) => {\n    typeof c == \"string\" ? (div.innerHTML += c) : div.append(c);\n  });\n  div.attachTo = function (parent) {\n    if (parent) parent.append(this);\n    return this;\n  };\n  div.wrapWith = function (tag) {\n    const parent = mkdiv(tag);\n    parent.append(this);\n    return parent;\n  };\n  return div;\n}\nfunction mksvg(tag, attrs = {}, children = []) {\n  var el = document.createElementNS(\"http://www.w3.org/2000/svg\", tag);\n  for (var k in attrs) {\n    if (k == \"xlink:href\") {\n      el.setAttributeNS(\"http://www.w3.org/1999/xlink\", \"href\", attrs[k]);\n    } else {\n      el.setAttribute(k, attrs[k]);\n    }\n  }\n  const charray = !Array.isArray(children) ? [children] : children;\n  charray.forEach((c) => el.append(c));\n  return el;\n}\n\nfunction logdiv(\n  infoPanel = mkdiv(\"pre\", {\n    style:\n      \"width:30em;min-height:299px;scroll-width:0;max-height:299px;overflow-y:scroll\",\n  })\n) {\n  const logs = [];\n  let rx1 = \"\",\n    rx2 = \"\";\n  const stderr = (str) => {\n    rx1 = str;\n    rx2 = str;\n  };\n  const stdout = (log) => {\n    logs.push((performance.now() / 1e3).toFixed(3) + \": \" + log);\n    if (logs.length > 100) logs.shift();\n    infoPanel.innerHTML = rx1 + \"\\n\" + logs.join(\"\\n\");\n    infoPanel.scrollTop = infoPanel.scrollHeight;\n  };\n  return {\n    stderr,\n    stdout,\n    infoPanel,\n    errPanel: mkdiv(\"span\"),\n  };\n}\nfunction wrapDiv(div, tag, attrs = {}) {\n  return mkdiv(tag, attrs, [div]);\n}\nfunction wrapList(divs, tag = \"div\") {\n  return mkdiv(tag, {}, divs);\n}\n\n\n//# sourceURL=webpack://sf2rend/./mkdiv/mkdiv.js?");

/***/ }),

/***/ "./sf2-service/read.js":
/*!*****************************!*\
  !*** ./sf2-service/read.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"s16ArrayBuffer2f32\": () => (/* binding */ s16ArrayBuffer2f32),\n/* harmony export */   \"load\": () => (/* binding */ load),\n/* harmony export */   \"loadProgram\": () => (/* binding */ loadProgram)\n/* harmony export */ });\n/* harmony import */ var _skip_to_pdta_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./skip_to_pdta.js */ \"./sf2-service/skip_to_pdta.js\");\n/* harmony import */ var _zoneProxy_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./zoneProxy.js */ \"./sf2-service/zoneProxy.js\");\n\n\n\nfunction s16ArrayBuffer2f32(ab) {\n  const b16 = new Int16Array(ab);\n\n  const f32 = new Float32Array(ab.byteLength / 2);\n  for (let i = 0; i < b16.length; i++) {\n    //} of b16){\n    f32[i] = b16[i] / 0xffff;\n  }\n  return f32;\n}\n\nasync function load(url, { onHeader, onSample, onZone } = {}) {\n  let heap, presetRef, shdrref, _sdtaStart, presetRefs;\n\n  const Module = await __webpack_require__.e(/*! import() */ \"sf2-service_pdta_js\").then(__webpack_require__.bind(__webpack_require__, /*! ./pdta.js */ \"./sf2-service/pdta.js\"));\n  const module = await Module.default();\n  const { pdtaBuffer, sdtaStart, fullUrl } = await (0,_skip_to_pdta_js__WEBPACK_IMPORTED_MODULE_0__.sfbkstream)(url);\n\n  _sdtaStart = sdtaStart;\n  function devnull() {}\n  const a = module._malloc(pdtaBuffer.byteLength);\n\n  module.onHeader = onHeader || devnull;\n  module.onSample = () => onSample || devnull;\n  module.onZone = onZone || devnull;\n\n  module.HEAPU8.set(pdtaBuffer, a);\n  const memend = module._loadpdta(a);\n  shdrref = module._shdrref(a);\n  presetRefs = new Uint32Array(module.HEAPU32.buffer, module._presetRef(), 255);\n  heap = module.HEAPU8.buffer.slice(0, memend);\n  const heapref = new WeakRef(heap);\n  return {\n    url: fullUrl,\n    pdtaRef: a,\n    heapref,\n    presetRefs,\n    heap,\n    shdrref,\n    sdtaStart,\n  };\n}\n\nfunction loadProgram(\n  { url, presetRefs, heap, shdrref, sdtaStart },\n  pid,\n  bkid = 0\n) {\n  const rootRef = presetRefs[pid | bkid];\n  const zMap = [];\n  const f32buffers = {};\n  const shdrMap = {};\n  const shdrDataMap = {};\n  for (\n    let zref = rootRef, zone = zref2Zone(zref);\n    zone && zone.SampleId != -1;\n    zone = zref2Zone((zref += 120))\n  ) {\n    const mapKey = zone.SampleId;\n    if (!shdrMap[mapKey]) {\n      shdrMap[mapKey] = getShdr(zone.SampleId);\n      shdrMap[mapKey].data = async () =>\n        shdrMap[mapKey].pcm ||\n        (await fetch(url, {\n          headers: {\n            Range: `bytes=${shdrMap[mapKey].range.join(\"-\")}`,\n          },\n        })\n          .then((res) => res.arrayBuffer())\n          .then((ab) => {\n            shdrMap[mapKey].pcm = s16ArrayBuffer2f32(ab);\n            return shdrMap[mapKey].pcm;\n          }));\n    }\n    zMap.push({\n      ...zone,\n      get shdr() {\n        return shdrMap[zone.SampleId];\n      },\n      get pcm() {\n        return shdrMap[zone.SampleId].data();\n      },\n      calcPitchRatio(key, sr) {\n        const rootkey =\n          zone.OverrideRootKey > -1\n            ? zone.OverrideRootKey\n            : shdrMap[zone.SampleId].originalPitch;\n        const samplePitch =\n          rootkey * 100 + zone.CoarseTune * 100 + zone.FineTune * 1;\n        const pitchDiff = (key * 100 - samplePitch) / 1200;\n        const r =\n          Math.pow(2, pitchDiff) * (shdrMap[zone.SampleId].sampleRate / sr);\n        return r;\n      },\n    });\n  }\n  async function preload() {\n    await Promise.all(\n      Object.keys(shdrMap).map((sampleId) => shdrMap[sampleId].data())\n    );\n  }\n  function zref2Zone(zref) {\n    const zone = new Int16Array(heap, zref, 60);\n    return (0,_zoneProxy_js__WEBPACK_IMPORTED_MODULE_1__.newSFZoneMap)(zref, zone);\n  }\n  function getShdr(SampleId) {\n    const hdrRef = shdrref + SampleId * 46;\n    const dv = heap.slice(hdrRef, hdrRef + 46);\n    const [start, end, startloop, endloop, sampleRate] = new Uint32Array(\n      dv,\n      20,\n      5\n    );\n    const [originalPitch] = new Uint8Array(dv, 20 + 5 * 4, 1);\n    const range = [sdtaStart + start * 2, sdtaStart + end * 2 + 1];\n    //      \"bytes=\" + (sdtaStart + start * 2) + \"-\" + (sdtaStart + end * 2 + 1);\n    const loops = [startloop - start, endloop - start];\n    return {\n      nsamples: end - start + 1,\n      range,\n      loops,\n      SampleId,\n      sampleRate,\n      originalPitch,\n      url,\n      hdrRef,\n    };\n  }\n  return {\n    zMap,\n    preload,\n    shdrMap,\n    url,\n    zref: rootRef,\n    filterKV: function (key, vel) {\n      return zMap.filter(\n        (z) =>\n          (vel == -1 || (z.VelRange.lo <= vel && z.VelRange.hi >= vel)) &&\n          (key == -1 || (z.KeyRange.lo <= key && z.KeyRange.hi >= key))\n      );\n    },\n  };\n}\n\n\n//# sourceURL=webpack://sf2rend/./sf2-service/read.js?");

/***/ }),

/***/ "./sf2-service/skip_to_pdta.js":
/*!*************************************!*\
  !*** ./sf2-service/skip_to_pdta.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"sfbkstream\": () => (/* binding */ sfbkstream),\n/* harmony export */   \"readAB\": () => (/* binding */ readAB)\n/* harmony export */ });\nasync function sfbkstream(url) {\n  const res = await fetch(url, { headers: { Range: \"bytes=0-6400\" } });\n\n  const ab = await res.arrayBuffer();\n\n  const [preample, r] = skipToSDTA(ab);\n  const sdtaSize = r.get32();\n  const sdtaStart = r.offset + 8;\n  const pdtastart = sdtaStart + sdtaSize + 4;\n\n  const pdtaHeader = {\n    headers: { Range: \"bytes=\" + pdtastart + \"-\" },\n  };\n\n  return {\n    nsamples: (pdtastart - sdtaStart) / 2,\n    sdtaStart,\n    infos: preample,\n    pdtaBuffer: new Uint8Array(\n      await (await fetch(url, pdtaHeader)).arrayBuffer()\n    ),\n    fullUrl: res.url,\n  };\n}\nfunction skipToSDTA(ab) {\n  const infosection = new Uint8Array(ab);\n  const r = readAB(infosection);\n  const [riff, filesize, sig, list] = [\n    r.readNString(4),\n    r.get32(),\n    r.readNString(4),\n    r.readNString(4),\n  ];\n  let infosize = r.get32();\n  console.log(r.readNString(4), filesize, list, r.offset);\n  console.log(infosize, r.offset);\n  const infos = [];\n  console.assert(infosize < 10000);\n  while (infosize >= 8) {\n    const [section, size] = [r.readNString(4), r.get32()];\n    infos.push({ section, text: r.readNString(size) });\n    infosize = infosize - 8 - size;\n  }\n  r.readNString(4);\n  return [infos, r];\n}\nfunction readAB(arb) {\n  const u8b = new Uint8Array(arb);\n  let _offset = 0;\n  function get8() {\n    return u8b[_offset++];\n  }\n  function getStr(n) {\n    const str = u8b.subarray(_offset, _offset + n); //.map((v) => atob(v));\n    _offset += n;\n    return str; //uab.subarray(_offset,_offset+n).map(v=>v&0x7f);;\n  }\n  function get32() {\n    return get8() | (get8() << 8) | (get8() << 16) | (get8() << 24);\n  }\n  const get16 = () => get8() | (get8() << 8);\n  const getS16 = () => {\n    const u16 = get16();\n    if (u16 & 0x8000) return -0x10000 + u16;\n    else return u16;\n  };\n  const readN = (n) => {\n    const ret = u8b.slice(_offset, n);\n    _offset += n;\n    return ret;\n  };\n  function varLenInt() {\n    let n = get8();\n    while (n & 0x80) {\n      n = get8();\n    }\n    return n;\n  }\n  const skip = (n) => {\n    _offset = _offset + n;\n  };\n  const read32String = () => getStr(4);\n  const readNString = (n) => getStr(n);\n  return {\n    skip,\n    get8,\n    get16,\n    getS16,\n    readN,\n    read32String,\n    varLenInt,\n    get32,\n    readNString,\n    get offset() {\n      return _offset;\n    },\n    set offset(n) {\n      _offset = n;\n    },\n  };\n}\n\n\n//# sourceURL=webpack://sf2rend/./sf2-service/skip_to_pdta.js?");

/***/ }),

/***/ "./sf2-service/zoneProxy.js":
/*!**********************************!*\
  !*** ./sf2-service/zoneProxy.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"newSFZoneMap\": () => (/* binding */ newSFZoneMap),\n/* harmony export */   \"newSFZone\": () => (/* binding */ newSFZone),\n/* harmony export */   \"semitone2hz\": () => (/* binding */ semitone2hz)\n/* harmony export */ });\nconst attributeKeys = [\n  \"StartAddrOfs\",\n  \"EndAddrOfs\",\n  \"StartLoopAddrOfs\",\n  \"EndLoopAddrOfs\",\n  \"StartAddrCoarseOfs\",\n  \"ModLFO2Pitch\",\n  \"VibLFO2Pitch\",\n  \"ModEnv2Pitch\",\n  \"FilterFc\",\n  \"FilterQ\",\n  \"ModLFO2FilterFc\",\n  \"ModEnv2FilterFc\",\n  \"EndAddrCoarseOfs\",\n  \"ModLFO2Vol\",\n  \"Unused1\",\n  \"ChorusSend\",\n  \"ReverbSend\",\n  \"Pan\",\n  \"Unused2\",\n  \"Unused3\",\n  \"Unused4\",\n  \"ModLFODelay\",\n  \"ModLFOFreq\",\n  \"VibLFODelay\",\n  \"VibLFOFreq\",\n  \"ModEnvDelay\",\n  \"ModEnvAttack\",\n  \"ModEnvHold\",\n  \"ModEnvDecay\",\n  \"ModEnvSustain\",\n  \"ModEnvRelease\",\n  \"Key2ModEnvHold\",\n  \"Key2ModEnvDecay\",\n  \"VolEnvDelay\",\n  \"VolEnvAttack\",\n  \"VolEnvHold\",\n  \"VolEnvDecay\",\n  \"VolEnvSustain\",\n  \"VolEnvRelease\",\n  \"Key2VolEnvHold\",\n  \"Key2VolEnvDecay\",\n  \"Instrument\",\n  \"Reserved1\",\n  \"KeyRange\",\n  \"VelRange\",\n  \"StartLoopAddrCoarseOfs\",\n  \"Keynum\",\n  \"Velocity\",\n  \"Attenuation\",\n  \"Reserved2\",\n  \"EndLoopAddrCoarseOfs\",\n  \"CoarseTune\",\n  \"FineTune\",\n  \"SampleId\",\n  \"SampleModes\",\n  \"Reserved3\",\n  \"ScaleTune\",\n  \"ExclusiveClass\",\n  \"OverrideRootKey\",\n  \"Dummy\",\n];\n\nfunction newSFZoneMap(ref, attrs) {\n  var obj = { ref };\n  for (let i = 0; i < 60; i++) {\n    if (attributeKeys[i] == \"VelRange\" || attributeKeys[i] == \"KeyRange\") {\n      obj[attributeKeys[i]] = {\n        hi: (attrs[i] & 0x7f00) >> 8,\n        lo: attrs[i] & 0x007f,\n      };\n    } else {\n      obj[attributeKeys[i]] = attrs[i];\n    }\n  }\n  obj.arr = attrs;\n  return obj;\n}\n\n/**\n * proxys comma-separated str of attributes into\n * dot-accessing objects to make beter autocompletes in vscode\n * @param attrs csv strings\n * @returns Proxy<string,number>\n */\nfunction newSFZone(attrs) {\n  const attributeValues = attrs.map((s) => parseInt(s));\n  return new Proxy(attributeValues, {\n    get: (target, key) => {\n      const idx = attributeKeys.indexOf(key);\n      return idx > -1 ? target[idx] : null;\n    },\n  });\n}\nfunction semitone2hz(c) {\n  return Math.pow(2, (c - 6900) / 1200) * 440;\n}\n\n\n//# sourceURL=webpack://sf2rend/./sf2-service/zoneProxy.js?");

/***/ }),

/***/ "./spin/spin.js":
/*!**********************!*\
  !*** ./spin/spin.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"SpinNode\": () => (/* binding */ SpinNode),\n/* harmony export */   \"mkspinner\": () => (/* binding */ mkspinner)\n/* harmony export */ });\n/* harmony import */ var _fetch_drop_ship_fetch_drop_ship_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../fetch-drop-ship/fetch-drop-ship.js */ \"./fetch-drop-ship/fetch-drop-ship.js\");\n/* harmony import */ var _srp_shared_riff_pipe_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../srp/shared-riff-pipe.js */ \"./srp/shared-riff-pipe.js\");\n\n\nlet wasm = null;\nconst CH_META_LEN = 24;\nconst RENDER_BLOCK = 128;\nconst N_CHANNELS = 32;\nlet k;\nfunction basename() {\n  const root = document.location.pathname.split(\"/sf2rend\")[0];\n  return root + \"/sf2rend/\";\n}\nclass SpinNode extends AudioWorkletNode {\n  static async init(ctx) {\n    console.log(basename() + \"spin/spin-proc.js\");\n\n    await ctx.audioWorklet.addModule(basename() + \"spin/spin-proc.js\");\n    if (!wasm) {\n      const res = await fetch(basename() + \"spin/spin.wasm\");\n      const ab = await res.arrayBuffer();\n      wasm = new Uint8Array(ab);\n    }\n  }\n  static alloc(ctx) {\n    if (!k) k = new SpinNode(ctx);\n    return k;\n  }\n  constructor(ctx) {\n    const rendSb = new SharedArrayBuffer(\n      RENDER_BLOCK * N_CHANNELS * Float32Array.BYTES_PER_ELEMENT\n    );\n    const pipe = new _srp_shared_riff_pipe_js__WEBPACK_IMPORTED_MODULE_1__.SharedRiffPipe(1 << 12);\n\n    super(ctx, \"spin-proc\", {\n      numberOfInputs: 0,\n      numberOfOutputs: 1,\n      outputChannelCount: [2],\n      processorOptions: {\n        rendSb,\n        wasm,\n        statusBuffer: pipe.array.buffer,\n      },\n    });\n    this.rendSb = rendSb;\n    this.pipe = pipe;\n  }\n\n  keyOn(channel, zone, key, vel) {\n    this.pipe.send(\n      0x0090,\n      new Uint32Array([\n        channel,\n        zone.SampleId,\n        zone.shdr.loops[0],\n        zone.shdr.loops[1],\n        zone.ref,\n        zone.calcPitchRatio(key, this.context.sampleRate) * 0xffff,\n      ]).buffer\n    );\n  }\n  keyOff(channel, key, vel) {\n    this.pipe.send(0x0080, new Uint32Array([channel]).buffer);\n  }\n\n  async shipProgram(sf2program, presetId) {\n    await (0,_fetch_drop_ship_fetch_drop_ship_js__WEBPACK_IMPORTED_MODULE_0__.requestDownload)(sf2program, this.port);\n    console.log(\"resolve dl\");\n    await this.postZoneAttributes(sf2program, presetId);\n    console.log(\"resolve st\");\n  }\n  async postZoneAttributes(sf2program, presetId) {\n    this.port.postMessage({\n      presetId,\n      zArr: sf2program.zMap.map((z) => {\n        const shz = new Int16Array(60);\n        shz.set(z.arr);\n        return {\n          arr: shz.buffer,\n          ref: z.ref,\n        };\n      }),\n    });\n  }\n  handleMsg(e) {\n    console.log(e.data);\n  }\n  get outputSnapshot() {\n    return this.output_floats;\n  }\n}\nasync function mkspinner(ctx, pcm, loops) {\n  const sp = new SpinNode(ctx, pcm, loops);\n\n  sp.connect(ctx.destination);\n  return sp;\n}\n\n\n//# sourceURL=webpack://sf2rend/./spin/spin.js?");

/***/ }),

/***/ "./src/adsr.js":
/*!*********************!*\
  !*** ./src/adsr.js ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"mkEnvelope\": () => (/* binding */ mkEnvelope)\n/* harmony export */ });\n/* harmony import */ var _midilist_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./midilist.js */ \"./src/midilist.js\");\n\nfunction mkEnvelope(ctx) {\n  const volumeEnveope = new GainNode(ctx, { gain: 0 });\n  let delay, attack, hold, decay, release, gainMax, sustain, _midiState, _zone;\n  function setZone(zone) {\n    [delay, attack, hold, decay, release] = [\n      zone.VolEnvDelay,\n      zone.VolEnvAttack,\n      zone.VolEnvHold,\n      zone.VolEnvDecay,\n      zone.VolEnvRelease,\n    ].map((v) => (v == -1 || v <= -12000 ? 0.0001 : Math.pow(2, v / 1200)));\n    sustain = Math.pow(10, zone.VolEnvSustain / -200);\n    _zone = zone;\n  }\n  return {\n    set zone(zone) {\n      setZone(zone);\n    },\n    set midiState(staet) {\n      _midiState = staet;\n    },\n    keyOn(vel) {\n      const sf2attenuate = Math.pow(10, _zone.Attenuation * -0.005);\n      const midiVol = _midiState[_midilist_js__WEBPACK_IMPORTED_MODULE_0__.effects.volumecoarse] / 128;\n      const midiExpre = _midiState[_midilist_js__WEBPACK_IMPORTED_MODULE_0__.effects.expressioncoarse] / 128;\n      gainMax = (sf2attenuate * midiVol * midiExpre * vel) / 128;\n\n      volumeEnveope.gain.linearRampToValueAtTime(gainMax, delay + attack);\n      if (decay > 0.001)\n        volumeEnveope.gain.linearRampToValueAtTime(\n          gainMax * (1 - sustain),\n          delay + attack + hold + decay\n        );\n\n      return { phases: [attack, decay, sustain, release], peak: gainMax };\n    },\n    keyOff() {\n      volumeEnveope.gain.linearRampToValueAtTime(0.0, release);\n    },\n    gainNode: volumeEnveope,\n  };\n}\n\n\n//# sourceURL=webpack://sf2rend/./src/adsr.js?");

/***/ }),

/***/ "./src/channel.js":
/*!************************!*\
  !*** ./src/channel.js ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"channel\": () => (/* binding */ channel)\n/* harmony export */ });\n/* harmony import */ var _sf2_service_read_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../sf2-service/read.js */ \"./sf2-service/read.js\");\n\nfunction channel(aggCtx, channelId, ui) {\n  const activeNotes = [];\n  const ctx = aggCtx.ctx;\n  const spinner = aggCtx.spinner;\n  const volEG = aggCtx.egs[channelId];\n  let _midicc;\n  let _pg;\n  let _pid;\n  return {\n    get pid() {\n      return _pid;\n    },\n    set midicc(midicc) {\n      _midicc = midicc;\n    },\n    set program({ pg, pid, bankId, name }) {\n      _pg = pg;\n      _pid = pid;\n      ui.name = name || \"pid \" + pid + \" bid \" + bankId;\n    },\n    keyOn(key, vel) {\n      if (!_pg) return;\n      let eg;\n      console.assert(_pg != null);\n      const zone = _pg.filterKV(key, vel)[0];\n      volEG.zone = zone;\n      volEG.midiState = _midicc;\n      spinner.keyOn(channelId, zone, key, vel);\n      eg = volEG.keyOn(vel);\n\n      requestAnimationFrame(() => {\n        ui.velocity = vel;\n        ui.midi = key;\n        ui.env1 = eg;\n      });\n    },\n    keyOff(key, vel) {\n      if (!_pg) return;\n\n      spinner.keyOff(channelId, key, vel);\n      //volEG.keyOff();\n    },\n  };\n}\nfunction semitone2hz(c) {\n  return Math.pow(2, (c - 6900) / 1200) * 440;\n}\n\n\n//# sourceURL=webpack://sf2rend/./src/channel.js?");

/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"queryDivs\": () => (/* binding */ queryDivs),\n/* harmony export */   \"main\": () => (/* binding */ main),\n/* harmony export */   \"mkeventsPipe\": () => (/* binding */ mkeventsPipe),\n/* harmony export */   \"initMidiReader\": () => (/* binding */ initMidiReader),\n/* harmony export */   \"shareEventBufferWithMidiWorker\": () => (/* binding */ shareEventBufferWithMidiWorker),\n/* harmony export */   \"bindMidiWorkerToAudioAndUI\": () => (/* binding */ bindMidiWorkerToAudioAndUI),\n/* harmony export */   \"initMidiSink\": () => (/* binding */ initMidiSink),\n/* harmony export */   \"initAudio\": () => (/* binding */ initAudio),\n/* harmony export */   \"bindMidiAccess\": () => (/* binding */ bindMidiAccess)\n/* harmony export */ });\n/* harmony import */ var _mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../mkdiv/mkdiv.js */ \"./mkdiv/mkdiv.js\");\n/* harmony import */ var _spin_spin_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../spin/spin.js */ \"./spin/spin.js\");\n/* harmony import */ var _ui_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./ui.js */ \"./src/ui.js\");\n/* harmony import */ var _sf2_service_read_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../sf2-service/read.js */ \"./sf2-service/read.js\");\n/* harmony import */ var _chart_chart_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../chart/chart.js */ \"./chart/chart.js\");\n/* harmony import */ var _midilist_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./midilist.js */ \"./src/midilist.js\");\n/* harmony import */ var _channel_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./channel.js */ \"./src/channel.js\");\n/* harmony import */ var _adsr_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./adsr.js */ \"./src/adsr.js\");\n\n\n\n\n\n\n\n\nlet _loadProgram;\n\nconst programNames = [];\nlet sf2;\nconst cdnroot = `https://grep32bit.blob.core.windows.net/midi/`;\n\nif (document.location.href.includes(\"index.html\")) {\n  const { flist, cpanel, cmdPanel, timeslide, stdout } = queryDivs();\n  (0,_midilist_js__WEBPACK_IMPORTED_MODULE_5__.fetchAndLoadPlaylist)();\n  main(queryDivs());\n  window.onerror = (event, source, lineno, colno, error) => {\n    document.querySelector(\"#debug\").innerHTML = JSON.stringify([\n      event,\n      source,\n      lineno,\n      colno,\n      error,\n    ]);\n  };\n}\nfunction queryDivs() {\n  const flist = document.querySelector(\"#sf2list\");\n  const cpanel = document.querySelector(\"#channelContainer\");\n  const cmdPanel = document.querySelector(\"footer\");\n  const timeslide = document.querySelector(\"progress\");\n  const { stdout } = (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.logdiv)(document.querySelector(\"pre\"));\n  return { flist, cpanel, cmdPanel, timeslide, stdout };\n}\nasync function main({ cpanel, cmdPanel, stdout, flist, timeslide }) {\n  if (!cpanel) cpanel = (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"div\");\n  window.stdout = stdout;\n  const midiurl =\n    cdnroot + (document.location.search.substring(1) || \"song.mid\");\n  console.log(midiurl);\n  const sf2file = \"/sf2rend/file.sf2\";\n  const pt = mkeventsPipe();\n\n  const controllers = (0,_ui_js__WEBPACK_IMPORTED_MODULE_2__.mkui)(cpanel, pt);\n  const programs = (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"datalist\", { id: \"programs\" });\n  const drums = (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"datalist\", { id: \"drums\" });\n  document.body.append(programs);\n  document.body.append(drums);\n  sf2 = await (0,_sf2_service_read_js__WEBPACK_IMPORTED_MODULE_3__.load)(sf2file, {\n    onHeader(pid, bid, str) {\n      const list = bid ? drums : programs;\n      list.append((0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"option\", { class: \"chlink\", value: str, pid }));\n      programNames[pid | bid] = str;\n    },\n  });\n  if (!sf2.presetRefs) return;\n  const ctx = await initAudio();\n\n  const midiSink = await initMidiSink(ctx, sf2, controllers, pt);\n  _loadProgram = async function (channel, pid, bankId) {\n    const sf2pg = (0,_sf2_service_read_js__WEBPACK_IMPORTED_MODULE_3__.loadProgram)(sf2, pid, bankId);\n    midiSink.channels[channel].program = {\n      pg: sf2pg,\n      pid,\n      bankId: bankId,\n      name: programNames[bankId | pid],\n    };\n\n    const ret = await ctx.spinner.shipProgram(sf2pg, bankId | pid);\n  };\n  function updateCanvas() {\n    for (let i = 0; i < 16; i++) {\n      if (ctx.egs[i].gainNode.gain > 0.000001) {\n        (0,_chart_chart_js__WEBPACK_IMPORTED_MODULE_4__.chart)(\n          midiSink.canvases[i],\n          ctx.spinner.outputSnapshot.subarray(i * 128, i * 128 + 128)\n        );\n      }\n    }\n    //requestAnimationFrame(updateCanvas);\n  }\n  const { presets, totalTicks, midiworker } = await initMidiReader(midiurl);\n  timeslide.setAttribute(\"max\", totalTicks / 255);\n\n  for await (const _ of (async function* g(presets) {\n    yield await _loadProgram(0, 0, 0);\n    yield await _loadProgram(9, 0, 128);\n    for (const preset of presets) {\n      const { pid, channel, t } = preset;\n      if (t > 0) continue;\n      const bkid = channel == 9 ? 128 : 0;\n      yield await _loadProgram(channel, pid, bkid);\n    }\n  })(presets)) {\n    //eslint\n    console.log(\"preset sent\");\n  }\n  let cid = 0;\n  flist.onclick = ({ target }) =>\n    _loadProgram(cid++, target.getAttribute(\"pid\"), target.getAttribute(\"bid\"));\n\n  bindMidiWorkerToAudioAndUI(midiworker, pt, {\n    timeslide,\n    cmdPanel,\n  });\n  shareEventBufferWithMidiWorker(ctx.spinner, midiworker);\n  bindMidiAccess(pt);\n}\nfunction mkeventsPipe() {\n  const _arr = [];\n  let _fn;\n  return {\n    onmessage(fn) {\n      _fn = fn;\n    },\n    postMessage(item) {\n      _arr.push(item);\n      if (_fn) _fn(_arr.shift());\n    },\n  };\n}\nfunction initMidiReader(url) {\n  return new Promise((resolve, reject) => {\n    const midiworker = new Worker(\"./dist/midiworker.js#\" + url, {\n      type: \"module\",\n    });\n    midiworker.addEventListener(\n      \"message\",\n      ({ data: { totalTicks, presets } }) =>\n        resolve({\n          midiworker,\n          totalTicks,\n          presets,\n        }),\n      { once: true }\n    );\n    midiworker.onerror = reject;\n    midiworker.onmessageerror = reject;\n  });\n}\nfunction shareEventBufferWithMidiWorker(spinner, midiworker) {\n  midiworker.postMessage({ evtPipe: spinner.pipe });\n}\nfunction bindMidiWorkerToAudioAndUI(\n  midiworker,\n  midiPort,\n  { timeslide, cmdPanel }\n) {\n  midiworker.addEventListener(\"message\", (e) => {\n    if (e.data.channel) {\n      midiPort.postMessage(e.data.channel);\n    } else if (e.data.qn) {\n      timeslide.value = e.data.qn; //(e.data.t);\n    } else {\n      stdout(JSON.stringify(e.data, null, 0));\n    }\n  });\n  timeslide.value = 0;\n  (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"button\", { class: \"cmd\", cmd: \"start\" }, \"start\").attachTo(cmdPanel);\n  (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"button\", { class: \"cmd\", cmd: \"pause\" }, \"pause\").attachTo(cmdPanel);\n  (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"button\", { class: \"cmd\", cmd: \"rwd\", amt: \"rwd\" }, \"rwd\").attachTo(\n    cmdPanel\n  );\n\n  cmdPanel\n    .querySelectorAll(\"button.cmd\")\n    .forEach((btn) =>\n      btn.addEventListener(\"click\", (e) =>\n        midiworker.postMessage({ cmd: e.target.getAttribute(\"cmd\") })\n      )\n    );\n}\nfunction resetGM() {\n  cid = 0;\n  midiSink.channels.forEach((c) => c.keyOff(1, 1));\n}\nasync function initMidiSink(ctx, sf2, controllers, pt) {\n  const channels = [];\n  const ccs = new Uint8Array(128 * 16);\n  const canvases = [];\n  for (let i = 0; i < 16; i++) {\n    channels[i] = (0,_channel_js__WEBPACK_IMPORTED_MODULE_6__.channel)(ctx, i, controllers[i]);\n    channels[i].midicc = ccs.subarray(i * 128, i * 128 + 128);\n    ccs[i * 128 + 7] = 100; //defalt volume\n    ccs[i * 128 + 11] = 127; //default expression\n    ccs[i * 128 + 10] = 64;\n    const canvasContainer = controllers[i].canvasContainer;\n    canvases[i] = (0,_chart_chart_js__WEBPACK_IMPORTED_MODULE_4__.mkcanvas)({\n      container: canvasContainer,\n      height: canvasContainer.clientHeight,\n      width: canvasContainer.clientWidth,\n    });\n  }\n  pt.onmessage(function (data) {\n    const [a, b, c] = data;\n    const stat = a >> 4;\n    const ch = a & 0x0f;\n    const key = b & 0x7f,\n      vel = c & 0x7f;\n    // stdout(\"midi msg channel:\" + ch + \" cmd \" + stat.toString(16));\n    switch (stat) {\n      case 0xb: //chan set\n        ccs[ch * 128 + key] = vel;\n        break;\n      case 0xc: //change porg\n        const pid = key,\n          bankId = ch == 9 ? 128 : 0;\n        if (pid != channels[ch].pid) {\n          _loadProgram(ch, pid, bankId);\n        }\n        break;\n      case 0x08:\n        channels[ch].keyOff(key, vel);\n        break;\n      case 0x09:\n        if (vel == 0) {\n          channels[ch].keyOff(key, vel);\n        } else {\n          // stdout(\"playnote \" + key + \" for \" + ch);\n\n          channels[ch].keyOn(key, vel);\n        }\n        break;\n      default:\n        break;\n    }\n  });\n\n  return { channels, ccs, canvases };\n}\nasync function initAudio() {\n  const ctx = new AudioContext({ sampleRate: 44100 });\n  await _spin_spin_js__WEBPACK_IMPORTED_MODULE_1__.SpinNode.init(ctx);\n  const spinner = new _spin_spin_js__WEBPACK_IMPORTED_MODULE_1__.SpinNode(ctx);\n\n  // const DC = new AudioBufferSourceNode(ctx, {\n  //   buffer: new AudioBuffer({\n  //     numberOfChannels: 1,\n  //     sampleRate: ctx.sampleRate,\n  //     length: 1,\n  //   }),\n  //   loop: true,\n  // });\n  // DC.buffer.getChannelData(0)[0] = 1;\n\n  const egs = [];\n  const masterMixer = new GainNode(ctx, { gain: 1 });\n  spinner.connect(ctx.destination);\n\n  for (let i = 0; i < 16; i++) {\n    egs[i] = (0,_adsr_js__WEBPACK_IMPORTED_MODULE_7__.mkEnvelope)(ctx);\n\n    // egs[i].gainNode.connect(spinner, 0, i);\n    // DC.connect(egs[i].gainNode);\n    // .connect(new ChannelMergerNode(ctx, { numberOfInputs: 16 }), i, 0)\n    // .connect(masterMixer);\n  }\n  // DC.start();\n  // masterMixer.connect(ctx.destination);\n  document.addEventListener(\"mousedown\", async () => await ctx.resume(), {\n    once: true,\n  });\n  return { ctx, spinner, egs, masterMixer };\n}\n\nasync function bindMidiAccess(port) {\n  const midiAccess = await navigator.requestMIDIAccess();\n  const midiInputs = Array.from(midiAccess.inputs.values());\n  const midiOutputs = Array.from(midiAccess.outputs.values());\n  midiInputs.forEach((input) => {\n    input.onmidimessage = ({ data, timestamp }) => {\n      port.postMessage(data);\n    };\n  });\n\n  return [midiInputs, midiOutputs];\n}\n\n\n//# sourceURL=webpack://sf2rend/./src/index.js?");

/***/ }),

/***/ "./src/midilist.js":
/*!*************************!*\
  !*** ./src/midilist.js ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"fetchAndLoadPlaylist\": () => (/* binding */ fetchAndLoadPlaylist),\n/* harmony export */   \"fetchmidilist\": () => (/* binding */ fetchmidilist),\n/* harmony export */   \"effects\": () => (/* binding */ effects)\n/* harmony export */ });\n/* harmony import */ var _mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../mkdiv/mkdiv.js */ \"./mkdiv/mkdiv.js\");\n\nvar xml_attr = [\n  \"Name\",\n  \"Url\",\n  \"LastModified\",\n  \"Etag\",\n  \"Size\",\n  \"ContentType\",\n  \"ContentEncoding\",\n  \"ContentLanguage\",\n];\nconst cdnroot = `https://grep32bit.blob.core.windows.net/midi/`;\nasync function fetchAndLoadPlaylist() {\n  let listsdiv = document.querySelector(\"#midilist\");\n  if (!listsdiv) listsdiv = document.createElement(\"div\");\n  const playlist = await fetchmidilist();\n  playlist.forEach((l) =>\n    listsdiv.append(\n      (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\n        \"a\",\n        {\n          href: \"index.html?\" + l.get(\"Url\").replace(cdnroot, \"\"),\n        },\n        l.get(\"Name\")\n      ).wrapWith(\"li\")\n    )\n  );\n  return listsdiv;\n}\nfunction fetchmidilist(\n  url = \"https://grep32bit.blob.core.windows.net/midi?resttype=container&comp=list\"\n) {\n  return new Promise((resolve, reject) => {\n    const xhr = new XMLHttpRequest();\n    xhr.open(\"GET\", url);\n    xhr.responseType = \"document\";\n    xhr.send();\n    xhr.onload = function () {\n      if (xhr.responseXML) {\n        const blobs = Array.from(xhr.responseXML.querySelectorAll(\"Blob\"));\n        resolve(\n          blobs\n            .map(function (b) {\n              var ff = new Map();\n              xml_attr.forEach(function (attr) {\n                ff.set(attr, b.querySelector(attr).textContent);\n              });\n              return ff;\n            })\n            .sort((a, b) =>\n              new Date(a.LastModified) < new Date(b.lastModified) ? -1 : 1\n            )\n        );\n      }\n    };\n    xhr.onerror = reject;\n    xhr.ontimeout = reject;\n  });\n}\nconst effects = {\n  bankselectcoarse: 0,\n  modulationwheelcoarse: 1,\n  breathcontrollercoarse: 2,\n  footcontrollercoarse: 4,\n  portamentotimecoarse: 5,\n  dataentrycoarse: 6,\n  volumecoarse: 7,\n  balancecoarse: 8,\n  pancoarse: 10,\n  expressioncoarse: 11,\n  pitchbendcoarse: 12,\n  effectcontrol2coarse: 13,\n  generalpurposeslider1: 16,\n  generalpurposeslider2: 17,\n  generalpurposeslider3: 18,\n  generalpurposeslider4: 19,\n  bankselectfine: 32,\n  modulationwheelfine: 33,\n  breathcontrollerfine: 34,\n  footcontrollerfine: 36,\n  portamentotimefine: 37,\n  dataentryfine: 38,\n  volumefine: 39,\n  balancefine: 40,\n  panfine: 42,\n  expressionfine: 43,\n  pitchbendfine: 44,\n  effectcontrol2fine: 45,\n  holdpedal: 64,\n  portamento: 65,\n  sustenutopedal: 66,\n  softpedal: 67,\n  legatopedal: 68,\n  hold2pedal: 69,\n  soundvariation: 70,\n  resonance: 71,\n  soundreleasetime: 72,\n  soundattacktime: 73,\n  brightness: 74,\n  soundcontrol6: 75,\n  soundcontrol7: 76,\n  soundcontrol8: 77,\n  soundcontrol9: 78,\n  soundcontrol10: 79,\n  generalpurposebutton1: 80,\n  generalpurposebutton2: 81,\n  generalpurposebutton3: 82,\n  generalpurposebutton4: 83,\n  reverblevel: 91,\n  tremololevel: 92,\n  choruslevel: 93,\n  celestelevel: 94,\n  phaserlevel: 95,\n  databuttonincrement: 96,\n  databuttondecrement: 97,\n  nonregisteredparametercoarse: 98,\n  nonregisteredparameterfine: 99,\n  registeredparametercoarse: 100,\n  registeredparameterfine: 101,\n};\n\n\n//# sourceURL=webpack://sf2rend/./src/midilist.js?");

/***/ }),

/***/ "./src/ui.js":
/*!*******************!*\
  !*** ./src/ui.js ***!
  \*******************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"TrackUI\": () => (/* binding */ TrackUI),\n/* harmony export */   \"mkui\": () => (/* binding */ mkui)\n/* harmony export */ });\n/* harmony import */ var _mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../mkdiv/mkdiv.js */ \"./mkdiv/mkdiv.js\");\n\nconst rowheight = 40,\n  colwidth = 80;\nconst pixelPerDecibel = rowheight;\nconst pixelPerSec = 12;\n\nclass TrackUI {\n  constructor(container, keyboard, idx, cb) {\n    this.nameLabel = container.querySelector(\"input[type='list']\");\n    this.meters = container.querySelectorAll(\"meter\");\n    this.sliders = container.querySelectorAll(\"input[type='range']\");\n\n    this.led = container.querySelector(\"input[type=checkbox]\");\n\n    this.canc = container.querySelector(\".canvasContainer\");\n\n    this.keys = Array.from(keyboard.querySelectorAll(\"a\"));\n    this.keys.forEach((k, keyidx) => {\n      var refcnt = 0;\n      const midi = k.getAttribute(\"midi\");\n      k.onmousedown = () => {\n        refcnt++;\n        cb([0x90 | idx, midi, 111]);\n\n        k.addEventListener(\n          \"mouseup\",\n          () => refcnt-- > 0 && cb([0x80 | idx, midi, 111]),\n          { once: true }\n        );\n        k.addEventListener(\"mouseleave\", () => cb([0x80 | idx, midi, 111]), {\n          once: true,\n        });\n      };\n    });\n    this.polylines = Array.from(container.querySelectorAll(\"polyline\"));\n  }\n  set name(id) {\n    this.nameLabel.value = id;\n  }\n  set midi(v) {\n    this.meters[0].value = v;\n  }\n  set velocity(v) {\n    this.meters[1].value = v;\n  }\n  set active(b) {\n    b\n      ? this.led.setAttribute(\"checked\", \"checked\")\n      : this.led.removeAttribute(\"checked\");\n  }\n  set env1({ phases: [a, d, s, r], peak }) {\n    const points = [\n      [0, 0],\n      [a, 1],\n      [a + d, s / 100],\n      [a + d + r, 0],\n    ]\n      .map(([x, y]) => [x * pixelPerSec, (1 - y) * 0.8 * rowheight].join(\",\"))\n      .join(\" \");\n    this.polylines[0].setAttribute(\"points\", points);\n  }\n\n  get canvasContainer() {\n    return this.canc;\n  }\n  set zone(z) {\n    document.querySelector(\"#debug\").innerHTML = JSON.stringify(z, null, 1);\n  }\n}\nconst range = (x, y) =>\n  Array.from(\n    (function* _(x, y) {\n      while (x < y) yield x++;\n    })(x, y)\n  );\n\nfunction mkui(cpanel, cb) {\n  cb = cb.postMessage;\n  const controllers = [];\n\n  const tb = (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"div\", {\n    border: 1,\n    style:\n      \"display:grid;grid-template-columns:1fr; margin-bottom:10px;background:#333333;grid-row-gap:20px;\",\n  });\n  for (let i = 0; i < 16; i++) {\n    const keyboard = (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\n      \"div\",\n      { class: \"keyboards\" },\n      range(55, 69).map((midi) => (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"a\", { midi }, [midi, \" \"]))\n    );\n    const row = (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\n      \"div\",\n      {\n        class: \"attrs\",\n\n        style: \"display:grid; grid-template-columns:1fr 2fr 3fr\",\n      },\n      [\n        (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"div\", { style: \"display:grid; grid-template-columns:1fr\" }, [\n          (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\n            \"input\",\n            { type: \"list\", list: \"programs\", value: \"\", class: \"name\" },\n            [\"channel \" + i]\n          ),\n          (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"input\", { type: \"checkbox\" }),\n          (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"meter\", { min: 0, max: 127, step: 1, aria: \"key\" }),\n          (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"meter\", { min: 0, max: 127, step: 1, aria: \"vel\" }),\n        ]),\n        (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"div\", { style: \"display:grid;grid-template-columns:2fr 2fr\" }, [\n          (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"label\", { for: \"exp_vol\" }, \"volume\"),\n          (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"input\", { min: 0, max: 127, step: 1, type: \"range\" }),\n          (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"label\", { for: \"pan\" }, \"pan\"),\n          (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"input\", { min: 0, max: 127, step: 1, type: \"range\" }),\n          (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"label\", { for: \"expression\" }, \"expression\"),\n          (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"input\", { min: 0, max: 127, step: 1, type: \"range\" }),\n        ]),\n        (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\n          \"div\",\n          {\n            style:\n              \"display:grid; grid-template-columns:1fr 4fr;background-color:grey\",\n          },\n          [\n            (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mksvg)(\n              \"svg\",\n              {\n                style: \"width:80px;height:59px; display:inline;\",\n                viewBox: \"0 0 80 40\",\n              },\n              [\n                (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mksvg)(\"polyline\", {\n                  fill: \"red\",\n                  stroke: \"black\",\n                }),\n              ]\n            ),\n            (0,_mkdiv_mkdiv_js__WEBPACK_IMPORTED_MODULE_0__.mkdiv)(\"div\", { class: \"canvasContainer\" }),\n          ]\n        ),\n        keyboard,\n      ]\n    );\n\n    controllers.push(new TrackUI(row, keyboard, i, cb));\n    row.attachTo(tb);\n    keyboard.attachTo(row);\n  }\n\n  tb.attachTo(cpanel);\n  return controllers;\n}\n\n\n//# sourceURL=webpack://sf2rend/./src/ui.js?");

/***/ }),

/***/ "./srp/shared-riff-pipe.js":
/*!*********************************!*\
  !*** ./srp/shared-riff-pipe.js ***!
  \*********************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"SharedRiffPipe\": () => (/* binding */ SharedRiffPipe)\n/* harmony export */ });\nconst sendingFlag = 0x8000,\n  headerBytesLength = 8;\nclass SharedRiffPipe {\n  array;\n  byteLenth;\n  constructor(byteLenthOrArray) {\n    if (byteLenthOrArray.byteLength) {\n      this.byteLenth = byteLenthOrArray.byteLength;\n      this.array = new Uint32Array(byteLenthOrArray);\n    } else {\n      this.byteLenth = byteLenthOrArray;\n      const sharedBuffer = new SharedArrayBuffer(byteLenthOrArray);\n      this.array = new Uint32Array(sharedBuffer);\n    }\n  }\n  msgLen(offset) {\n    return this.array[offset / 4 + 1];\n  }\n  get hasMsg() {\n    return this.array[0] & sendingFlag;\n  }\n  free_slot(byteLength) {\n    let offset;\n    for (\n      offset = 0;\n      offset < this.byteLenth - byteLength - headerBytesLength &&\n      this.array[offset << 2] & 0x8000;\n      offset += this.msgLen(offset) + headerBytesLength\n    ) {}\n    if (offset > this.byteLenth - headerBytesLength - byteLength)\n      throw \"stack overflow\";\n    return offset >> 2;\n  }\n  send(fourcc, msgArr) {\n    const offset = this.free_slot(msgArr.byteLength);\n    this.array[offset] = fourcc | sendingFlag;\n    this.array[offset + 1] = msgArr.byteLength;\n    this.array.set(new Uint32Array(msgArr), offset + 2);\n  }\n  read(offset = 0) {\n    const msgs = [];\n    while (offset < this.byteLenth / 4 && this.array[offset] & sendingFlag) {\n      const msgByteLen = this.array[offset + 1];\n      this.array[offset] ^= sendingFlag;\n      msgs.push({\n        fourcc: this.array[offset],\n        size: msgByteLen,\n        chunk: this.array.subarray(offset + 2, offset + 2 + msgByteLen / 4),\n      });\n      offset = offset + 2 + msgByteLen / 4;\n    }\n    return msgs;\n  }\n  shareWith(msgPort) {\n    msgPort.postMessage({ sharedRiff: msgPort });\n  }\n}\n\n\n//# sourceURL=webpack://sf2rend/./srp/shared-riff-pipe.js?");

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
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
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
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		// no on chunks loaded
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
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
/******/ 		var chunkLoadingGlobal = globalThis["webpackChunksf2rend"] = globalThis["webpackChunksf2rend"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.js");
/******/ 	
/******/ })()
;