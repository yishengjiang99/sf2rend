import { loadprog } from "./fetch-drop-ship.js";
import { load } from "../sf2-service/read.js";
loadprog(load("./file.sf2").then(sf2=>loadProgram(sf2,0,0));
