import mkpath from "./path.js";
import SF2Service from "../sf2-service/index.js";
async function main() {
  if (ctx.state !== "running") {
    await ctx.resume();
  }
  const ctx = new AudioContext();

  console.log("adsfsdsa");
  const { spinner } = await mkpath(ctx);
  const stream = new Response(
    new ReadableStream({
      start(controller) {
        const buffer = new Int16Array(1024);
        for (let i = 0; i < 1024 * 4; i += 1024) {
          for (let j = 0; j < 1024; j++) {
            buffer[j] = Math.sin(((2 * Math.PI) / 48000) * 220) * 0x7fff;
          }
          controller.enqueue(buffer);
        }
      },
    })
  );
  const GOTACK = new Promise((resolve) =>
    spinner.port.addEventListener("message", ({ data }) => {
      console.log(data);
      resolve();
    })
  );
  spinner.port.postMessage(
    {
      segments: {
        sampleId: 0,
        nSamples: 1024 * 4,
        loops: [480, 4800],
        sampleRate: 48000,
      },
      stream: stream.body,
    },
    [stream.body]
  );
  spinner.port.postMessage([0x90 | 0, 60, 55]);
  //  const ob = await ctx.startRendering();
  await stream.body.closed;
  await GOTACK;
  console.log("done");
}

async function* main2() {
  console.log("adsfsdsa");
  const ctx = new AudioContext();
  if (ctx.state == "suspended") {
    await ctx.resume();
  }

  const spinner = await mkpath(ctx);
  const sf2 = new SF2Service("file.sf2");
  await sf2.load();
  const p = sf2.loadProgram(4, 0);
  await spinner.shipProgram(sf2.loadProgram(p, 0), 4);
  const zones = p.filterKV(50, 50).filter((z) => z.SampleId !== 0);
  let i = 0;
  while (zones.length) {
    yield spinner.keyOn(0, zones.shift(), i + 50, i + 30);
    yield spinner.KeyOff(9, i + 50, i + 70);
    console.log(zones.length);

    i++;
  }
  console.log(zones.length);
}

window.addEventListener("keydown", main2);
