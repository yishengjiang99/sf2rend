import {
  mkcanvas,
  chart,
  renderFrames,
} from "https://unpkg.com/mk-60fps@1.1.0/chart.js";
import { mkdiv } from "https://unpkg.com/mkdiv@3.1.0/mkdiv.js";
import { SpinNode } from "./spin/spin.js";
import { mkpath } from "./src/path.js";
import SF2Service from "./sf2-service/index.js";
const sf2url = "file.sf2";

const sf2file = new SF2Service(sf2url);
const loadWait = sf2file.load();

let program,
  spinner,
  zone,
  presetId,
  articleMain,
  canvas,
  main,
  rightPanel,
  volEGCanvas,
  modEGCanvas;

renderMain();
window.addEventListener("hashchange", rendProgram);

async function renderMain() {
  await loadWait;
  document.body.innerHTML = "";
  const progList = mkdiv(
    "ul",
    { class: "notes-list" },
    sf2file.programNames.map((n, presetId) =>
      mkdiv(
        "div",
        { class: "menu-link" },
        mkdiv("a", { href: `#${presetId}` }, n)
      )
    )
  );
  rightPanel = mkdiv("div", { class: "col note-viewer" });
  const leftNav = mkdiv(
    "section",
    {
      class: "col sidebar",
    },
    [
      mkdiv("button", { onclick: () => rendSample() }, "play"),
      mkdiv(
        "section",
        { class: "sidebar-header" },
        sf2file.url.split("/").pop()
      ),
      mkdiv("nav", {}, progList),
    ]
  );
  main = mkdiv("div", { class: "main" }, [leftNav, rightPanel]);
  document.body.append(main);
  await startSpinner();
  // rendProgram();
}

function rendProgram() {
  const presetId = document.location.hash.substring(1).split("|");
  const intpre = parseInt(presetId);
  const pid = intpre;
  const bid = 0;
  program = sf2file.loadProgram(pid, bid);
  if (!zone) zone = program.filterKV(55, 55)[0];

  const kRangeList = program.zMap.map(
    (z) =>
      `<option value=${z.ref} ${z.ref + "" == zone.ref ? "selected" : ""}>${
        z.Unused1 + "|" + z.Unused2
      } ${
        "key " +
        [z.KeyRange.lo, z.KeyRange.hi].join("-") +
        " vel " +
        [z.VelRange.lo, z.VelRange.hi].join("-")
      }</option>`
  );
  const articleHeader = mkdiv("div", { class: "note-header" }, [
    mkdiv(
      "div",
      { class: "note-menu" },
      mkdiv(
        "select",
        {
          oninput: (e) =>
            renderZ(program.zMap.filter((z) => e.target.value)[0]),
        },
        kRangeList
      )
    ),
  ]);
  articleMain = mkdiv("div", { class: "note-preview" }, [
    mkdiv("div", {
      style:
        "display:flex flex-direction:row; max-height:50vh; overflow-y:scroll; gap:0 20px 20px",
    }),
  ]);
  const mainRight = mkdiv("div", { class: "note" }, [
    mkdiv("div", { class: "note-title" }, [sf2file.programNames[presetId]]),
    articleHeader,
  ]);
  rightPanel.replaceChildren(mainRight, articleMain);

  canvas = mkcanvas({ container: articleHeader });
  renderZ(zone);
  spinner.shipProgram(program, intpre);
}
async function renderZ(zoneSelect) {
  if (!zoneSelect) {
    return;
  }
  const zoneObj = newSFZone(zoneSelect.arr);

  const zattrs = Object.entries(zoneObj).filter(([attr, val], idx) => idx < 60);

  const pcm = await zoneSelect.shdr.data();
  chart(canvas, pcm);

  const zoneinfo = mkdiv("div", [
    mkdiv("div", [
      "smpl: ",
      zoneSelect.shdr.SampleId,
      " ",
      zoneSelect.shdr.name,
      "<br>nsample: ",
      zoneSelect.shdr.nsamples,
      "<br>srate: " + zoneSelect.shdr.originalPitch,
      "<br>Range: ",
      zoneSelect.shdr.range.join("-"),
      "<br>",
      "loop: ",
      zoneSelect.shdr.loops.join("-"),
      "<br>",

      JSON.stringify(zoneSelect.KeyRange),
      "<br>",
      JSON.stringify(zoneSelect.VolRange),
    ]),
    ..."Attenuation,VolEnv,Filter,LFO"
      .split(",")
      .map((keyword) => renderArticle(keyword, zoneSelect)),
  ]);

  articleMain.replaceChildren(zoneinfo);

  //drawEV(zone.arr.slice(33, 39), volEGCanvas);

  function renderArticle(keyword, zone) {
    let canvas;
    const zoneObj = newSFZone(zone.arr);
    const zattrs = Object.entries(zone)
      .filter(([attr, val], idx) => idx < 60)
      .filter(([k]) => k.includes(keyword));

    const attrVals = mkdiv(
      "ul",
      zattrs.map(([k, v]) =>
        mkdiv("li", [
          k,
          ": ",
          mkdiv("label", [v]),
          mkdiv("input", {
            type: "range",
            min: -12000,
            max: 5000,
            step: 10,
            value: v,
            oninput: (e) => {
              e.target.parentElement.querySelector("label").textContent =
                e.target.value;
              zoneObj[k] = e.target.value;
              drawEV(zoneObj, canvas);
            },
          }),
        ])
      )
    );
    const details = mkdiv("div");
    const article = mkdiv("article", [attrVals, details]);
    if (keyword === "VolEnv") {
      canvas = mkcanvas({ container: details, title: "amp eg" });
      drawEV(zoneObj, canvas);
    }
    return article;
  }
}
let ctx;
async function startSpinner() {
  ctx = ctx || new AudioContext();
  if (!spinner) spinner = await mkpath(ctx);
}
async function rendSample() {
  if (ctx.state !== "running") await ctx.resume();

  spinner.port.postMessage([
    0x90,
    0,
    zone.ref,
    zone.calcPitchRatio(55, spinner.context.sampleRate),
    122,
  ]);
}
const drawEV = async (zone, target) => {
  const [delay, att, hold, decay, sustain, release] = zone.arr.slice(33, 39);
  console.log(delay, att, hold, decay, sustain, release);
  const tc2time = (t) => Math.pow(2, t / 1200);
  const ctx = new OfflineAudioContext(1, 6000, 3000);
  const amp = new GainNode(ctx, { gain: 0 });
  const o = new ConstantSourceNode(ctx, { offset: 1 });
  amp.gain.linearRampToValueAtTime(1, tc2time(att) + tc2time(delay));
  amp.gain.cancelAndHoldAtTime(tc2time(att) + tc2time(delay));
  amp.gain.setTargetAtTime(
    sustain / 10 / 1400,
    tc2time(att) + tc2time(delay) + tc2time(hold),
    1 / tc2time(decay)
  );
  amp.gain.cancelAndHoldAtTime(
    tc2time(att) + tc2time(delay) + tc2time(hold) + 0.1
  );
  amp.gain.setTargetAtTime(0, 0.7, 1 / tc2time(release));
  o.connect(amp);
  amp.connect(ctx.destination);
  o.start(0);
  const rendbuff = await ctx.startRendering();
  chart(target, rendbuff.getChannelData(0));
};

/**
 * proxys comma-separated str of attributes into
 * dot-accessing objects to make beter autocompletes in vscode
 * @param attrs csv strings
 * @returns Proxy<string,number>
 */
export function newSFZone(attrs) {
  const attributeValues = newSFZoneMap(1, attrs);
  return new Proxy(attributeValues, {
    get: (target, key) => {
      if (key == "arr") return attributeValues.arr;
      const idx = attributeKeys.indexOf(key);
      return idx > -1 ? target[idx] : null;
    },
    set: (target, key, val) => {
      const idx = attributeKeys.indexOf(key);
      console.log(idx, key);
      if (idx > -1) {
        target.arr[idx] = parseInt(val);
        return true;
      }
      return false;
    },
  });
}
