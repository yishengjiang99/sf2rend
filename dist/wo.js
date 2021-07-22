import { initVoice, loadre } from "../sf2-service/render.js";
// @ts-ignore
try {
  const { mem, newVoice, render, loadPCM } = loadre();
  const { setAttr, output1, output2 } = initVoice();
  const l = loadPCM(55);
  console.log(l);
} catch (e) {
  console.trace(e);
}
debugger;
