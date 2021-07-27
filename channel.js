import { mkdiv } from "./mkdiv/mkdiv.js";
import { LowPassFilterNode } from "./lpf/lpf.js";
import { SpinNode } from "./spin/spin.js";
import mkEnvelope from "./adsr.js";
import { semitone2hz } from "./sf2-service/zoneProxy.js";
// import { EGNode } from "./eg/index.js";

export async function realCtx() {
  const ctx = new AudioContext();
  await SpinNode.init(ctx);
  await LowPassFilterNode.init(ctx);
  // await EGNode.init(ctx);
  return ctx;
}

export function channel(ctx, sf2, id = 0) {
  const spinnerMap = {};
  const spinnerArray = () => Object.values(spinnerMap);
  let filterKV;
  let vcount = 0;
  const SpinPool = [];
  function silence() {
    spinnerMap.forEach((v) => v.volAmp.keyOff(0));
  }
  function mkZoneRoute(zoneAttrs) {
    const { ref, pcm, shdr, ...zone } = zoneAttrs;
    const [spinner, volEG, lpf] = [
      new SpinNode(ctx, { pcm, loops: shdr.loops }),
      mkEnvelope(ctx, zone),
      new LowPassFilterNode(ctx, semitone2hz(zone.FilterFc)),
    ];
    spinner.connect(lpf).connect(volEG.gainNode).connect(ctx.destination);
    return { spinner, lpf, volEG, zref: ref };
  }

  function keyOn(key, vel, time) {
    const zoneAttrs = filterKV(key, vel)[0];
    const { spinner, volEG, lpf, zref } =
      SpinPool.length > 0 ? SpinPool.shift() : mkZoneRoute(zoneAttrs);

    if (zref != zoneAttrs.ref) {
      volEG.zone = zoneAttrs;
      //spinner.pcm = zoneAttrs.pcm;
    }
    volEG.keyOn(time);
    spinnerMap[zref] = { spinner, volEG, lpf, zref };
    vcount++;
    if (vcount > 2) {
      //  spinnerMap.shift().volAmp.keyOff(ctx.baseLatency);
      //vcount--;
    }
    setTimeout(spinner.dispose, 10000);
  }
  function keyOff(key) {
    const arr = spinnerArray();
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].key == key) {
        arr[i].volAmp.keyOff();
        // spinnerMap.splice(i, 1);
        SpinPool.push(arr.splice(i, 1));
        vcount--;
      }
    }
  }
  async function setProgram(pid, bankId) {
    const pg = sf2.loadProgram(pid, bankId);
    filterKV = pg.filterKV;
    await pg.preload();
  }
  return {
    keyOn,
    silence,
    keyOff,
    setProgram,
    id,
    ctx,
  };
}

export function keyboard(channel, container) {
  const label = mkdiv("label", { for: "vslide" });
  const vslide = mkdiv("input", {
    type: "range",
    id: "vslide" + channel.id,
    min: "0",
    max: 128,
    step: 1,
    oninput: (e) => (label.innerHTML = e.target.value),
  });
  mkdiv("button", { onclick: () => channel.silence() }, ["panic"]).attachTo(
    container
  );
  mkdiv("div", {}, ["velocity", vslide, label]).attachTo(container);
  const keysboard = mkdiv("div");
  for (let i = 0x2a; i < 0x6c; i++) {
    mkdiv(
      "button",
      {
        onmousedown: (e) => {
          waitForOffkey(e.target).then(() => channel.keyOff(i));
          channel.keyOn(i, vslide.value);
        },
      },
      i.toString(16)
    ).attachTo(keysboard);
  }
  keysboard.attachTo(container);
  function waitForOffkey(target) {
    return new Promise((resolve) => {
      target.addEventListener("mouseup", resolve, {
        once: true,
      });
      target.addEventListener("mouseleave", resolve, {
        once: true,
      });
      target.addEventListener("touchend", resolve);
      setTimeout(resolve, 2000);
    });
  }
}
