import { load } from "./sf2-service/index.js";
import { awncontroller } from "./spin-oscillators/index.js";


const zones = new Array(16).fill({
  instrument: "",
});
let sf2service,spincontroller,ctx,dup2;


async function main() {
  const comms = (await import("./mkdiv.js")).logdiv("pre", "#rx1");
  const stdout = comms.stdout;
  const stderr = comms.stderr;
	ctx = new AudioContext();
  sf2service = await load("./file.sf2");
	spincontroller=  await awncontroller(ctx, sf2service);
  spincontroller.loadProgram(0,0);


  stdout("pgload");
  stderr("hello");
}

main();
