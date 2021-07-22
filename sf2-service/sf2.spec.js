import { initVoice, loadre } from "./render.js";
const { mem, newVoice, render, loadPCM } = loadre();

const v = newVoice();

const { setAttr, output1, output2 } = initVoice(newVoice(), mem);
const l = loadPCM(55);
