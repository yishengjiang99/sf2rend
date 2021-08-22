/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./fetch-drop-ship/worker.js":
/*!***********************************!*\
  !*** ./fetch-drop-ship/worker.js ***!
  \***********************************/
/***/ (() => {

eval("// self.addEventListener(\"message\", rulel());\n\n// function rulel() {\n//   return ({ data: { url, smpls, destination, ...data } }) => {\n//     if (destination) {\n//       self.destport = destination;\n//       self.destport.onmessage = ({ data }) => postMessage(data);\n//     } else if (url && smpls) {\n//       loadsdta(url, smpls, self.destport);\n//     } else if (data && self.destport) self.destport.postMessage(data);\n//   };\n// }\n// function loadprog(sf2,port){\n//   const samples = Object.values(sf2_program.shdrMap).sort(\n//     (a, b) => a.sampleId < b.sampleId\n//   );\n//   let lastSid = null;\n//   let payload = [];\n//   for (const sample of samples) {\n//     if (\n//       lastSid != null &&\n//       lastSid + 1 != sample.SampleId &&\n//       payload.length > 0\n//     ) {\n//       loadsdta({url,payload});\n//       lastSid = null;\n//       payload = [];\n//     }\n//     lastSid = sample.SampleId;\n//     payload.push({\n//       sampleId: lastSid,\n//       range: sample.range,\n//     });\n//   }\n//   if (payload.length > 0) {\n//     loadsdta({url,payload});\n\n//   }\n// }\n// }\n// async function loadsdta(url, smpls, destination) {\n//   let min, max;\n//   const segments = {};\n//   smpls.sort((a, b) => a.sampleId < b.sampleId);\n//   for (const { range } of smpls) {\n//     min = min ? (range[0] < min ? range[0] : min) : range[0];\n//     max = max ? (range[1] > max ? range[1] : max) : range[1];\n//   }\n//   for (const { range, sampleId } of smpls) {\n//     segments[sampleId] = {\n//       startByte: range[0] - min,\n//       endByte: range[1] - min,\n//     };\n//   }\n//   const res = await fetch(url, {\n//     headers: {\n//       range: \"bytes=\" + [min, max].join(\"-\"),\n//     },\n//   });\n//   destination.postMessage(\n//     { stream: res.body, segments, nsamples: (max - min + 1) / 2 },\n//     [res.body]\n//   );\n//   await res.body.close;\n// }\n\n\n//# sourceURL=webpack://sf2rend/./fetch-drop-ship/worker.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./fetch-drop-ship/worker.js"]();
/******/ 	
/******/ })()
;