if(!self.define){let e,i={};const r=(r,s)=>(r=new URL(r+".js",s).href,i[r]||new Promise((i=>{if("document"in self){const e=document.createElement("script");e.src=r,e.onload=i,document.head.appendChild(e)}else e=r,importScripts(r),i()})).then((()=>{let e=i[r];if(!e)throw new Error(`Module ${r} didn’t register its module`);return e})));self.define=(s,t)=>{const n=e||("document"in self?document.currentScript.src:"")||location.href;if(i[n])return;let o={};const c=e=>r(e,n),d={module:{uri:n},exports:o,require:c};i[n]=Promise.all(s.map((e=>d[e]||c(e)))).then((e=>(t(...e),o)))}}define(["./workbox-d249b2c8"],(function(e){"use strict";self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"468.js",revision:"17957561c150e2aefc8143da3bb4de85"},{url:"index.html",revision:"25722db11cfd56785864cd98c0654d76"},{url:"main.js",revision:"a391eb06d1065df37b4e0b699b4e2c3a"},{url:"main.js.LICENSE.txt",revision:"4e0e34f265fae8f33b01b27ae29d9d6f"},{url:"timer.worker.js",revision:"2530f92f72cfcd366e90ca16b4105eaf"}],{})}));