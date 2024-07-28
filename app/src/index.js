import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import mkpath from 'sf2rend/src/mkpath'
import SF2Service from 'sf2-service'
import {wasmbin as pdtawasm} from 'mkspin/pdta.wasm.js';
import {sfbkstream} from 'sf2-service/sfbk-stream.js'

const {pdtaBuffer, sdtaStart, infos} = await sfbkstream("file.sf2");
const root = ReactDOM.createRoot(document.getElementById('root'));
const mem = new WebAssembly.Memory({
  initial: 111
})
let heap;

const wa = new WebAssembly.Instance(new WebAssembly.Module(pdtawasm), {
  env: {
    memory: mem,
    printf: (format, ...args) => console.log(String.fromCharCode(heap[format]) + args.join(','))
  },
});
heap = new Uint8Array(mem.buffer, wa.exports.__heap_base);
const {findPreset, globalZone} = wa.exports;
const pdtaLoc = wa.exports.__heap_base;
heap.set(pdtaBuffer);
wa.exports.readpdta(pdtaLoc);
for (let i = 0;i < 122;i++) {
  const ph = findPreset(i, 0);
  const pz = globalZone(ph);

}

root.render(
  <React.StrictMode>
    <pre>{JSON.stringify(pdtaBuffer.length, ",", sdtaStart)}</pre>
  </React.StrictMode>
);

// mkpath(new OfflineAudioContext(2, 48000, 48000), {
//   sf2Service: new SF2Service("file.sf2"),
// }).then(async path => {
//   await path.loadsf2();
//   const root = ReactDOM.createRoot(document.getElementById('root'));
//   root.render(
//     <React.StrictMode>
//       <pre>{JSON.stringify(pdtaBuffer)}</pre>
//     </React.StrictMode>
//   );

// })


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
