import { mkcanvas, chart } from "./node_modules/mk-60fps/chart.js";
import { mkdiv } from "https://unpkg.com/mkdiv@3.1.0/mkdiv.js";
import { SpinNode } from "./spin/spin.js";
import { mkpath } from "./src/path.js";
import SF2Service from "./sf2-service/index.js";
import { newSFZone } from "./sf2-service/zoneProxy.js";
import { timeseries } from "./timeseries.js";

const sf2url = "file.sf2";

const sf2file = new SF2Service(sf2url);
const loadWait = sf2file.load();

let program,
  spinner,
  zone,
  articleMain,
  canvas,
  main,
  rightPanel,
  zoneObj,
  vrPanel;

renderMain();
window.addEventListener("hashchange", rendProgram);
Array(16).map((i) => mkdiv("span"));
async function renderMain() {
  await loadWait;
  document.body.innerHTML = "";
  mkdiv("nav", [
    mkdiv("div", { id: "volmeter", style: "min-height:2em" }),
    mkdiv("div", [
      mkdiv(
        "button",
        {
          onmousedown: (e) => {
            rendSample(e);
          },
        },
        "play"
      ),
      mkdiv(
        "button",
        {
          onclick: () => spinner.port.postMessage({ cmd: "panic" }),
        },
        "panick"
      ),
    ]),
  ]).attachTo(document.body);
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
  rightPanel = mkdiv("div", { class: "col note-viewer" }, [
    mkdiv("button", { onmousedown: (e) => rendSample(e) }, "play"),
  ]);
  const leftNav = mkdiv(
    "section",
    {
      class: "col sidebar",
    },
    [
      mkdiv(
        "section",
        { class: "sidebar-header" },
        sf2file.url.split("/").pop()
      ),
      mkdiv("nav", {}, progList),
    ]
  );
  vrPanel = mkdiv("div", { class: "col" });
  main = mkdiv("div", { class: "main" }, [leftNav, rightPanel, vrPanel]);
  document.body.append(main);
  await startSpinner();
  rendProgram();
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
    mkdiv(
      "div",
      {
        style:
          "display:flex flex-direction:row; max-height:50vh; overflow-y:scroll; gap:0 20px 20px",
      },
      []
    ),
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
  zoneObj = newSFZone(zoneSelect);

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
}

//drawEV(zone.arr.slice(33, 39), volEGCanvas);
function min_max_vals(k) {
  if (k.includes("Sustain")) {
    return { min: 0, max: 1000, step: 10 };
  } else
    return {
      min: -12000,
      max: 5000,
      step: 10,
    };
}
function renderArticle(keyword, zone) {
  let canvas;
  const zoneObj = newSFZone(zone);
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
          ...min_max_vals(k),
          value: v,
          oninput: (e) => {
            e.target.parentElement.querySelector("label").textContent =
              e.target.value;
            zoneObj[k] = e.target.value;
            if (canvas) drawEV(zoneObj, canvas);
          },
        }),
      ])
    )
  );
  const details = mkdiv("div");
  const article = mkdiv("article", { class: "article" }, [attrVals, details]);
  if (keyword === "VolEnv") {
    canvas = mkcanvas({ container: details, title: "amp eg" });
    drawEV(zoneObj, canvas);
  }
  return article;
}
let ctx;
async function startSpinner() {
  ctx = ctx || new AudioContext();
  const analyzer = new AnalyserNode(ctx, { fft: 1024 });
  if (!spinner) spinner = await mkpath(ctx, [analyzer]);
  timeseries({
    analyzer,
    width: 540,
    height: 255,
    canvas: mkcanvas({ container: vrPanel }).canvas,
  });
  const volMeters = document.querySelector("#volmeter");
  spinner.port.onmessage = ({ data }) => {
    if (data.egStages) {
      volMeters.innerHTML = data.egStages.join("&nbsp");
    }
    if (data.ack) {
      console.log(data.ack);
    }
  };
}
async function rendSample(e) {
  if (ctx.state !== "running") await ctx.resume();
  const { arr, ref } = zoneObj;
  spinner.port.postMessage({
    cmd: "newZone",
    zone: { arr, ref },
  });
  console.log(1);
  spinner.port.postMessage([
    0x90,
    0,
    zoneObj.ref,
    zoneObj.calcPitchRatio(55, spinner.context.sampleRate),
    122,
  ]);
  e.target.addEventListener(
    "mousedown",
    () => {
      spinner.port.postMessage([0x80, 0, 123]);
    },
    { once: true }
  );
}
const drawEV = async (zone, target) => {
  const [delay, att, hold, decay, sustain, release] = zone.arr.slice(33, 39);
  console.log(delay, att, hold, decay, sustain, release);
  const tc2time = (t) => Math.pow(2, t / 1200);
  const ctx = new OfflineAudioContext(1, 6000, 3000);
  const amp = new GainNode(ctx, { gain: 0 });
  const o = new ConstantSourceNode(ctx, { offset: 0.2 });
  o.connect(new DelayNode(ctx, { delayTime: tc2time(delay) }));

  // amp.gain.setValueAtTime(0, tc2time(delay));
  amp.gain.linearRampToValueAtTime(1, tc2time(att));
  amp.gain.cancelAndHoldAtTime(tc2time(att));
  amp.gain.setTargetAtTime(
    (1440 - sustain) / 1440,
    tc2time(att) + tc2time(hold),
    tc2time(decay)
  );
  amp.gain.cancelAndHoldAtTime(
    tc2time(att) + tc2time(tc2time(decay)) + tc2time(hold)
  );
  amp.gain.cancelAndHoldAtTime(
    tc2time(att) + tc2time(tc2time(decay)) + tc2time(hold) + 0.1
  );

  o.connect(amp);
  amp.connect(ctx.destination);
  o.start(0);
  const rendbuff = await ctx.startRendering();
  chart(target, rendbuff.getChannelData(0));
};
