import { mkcanvas, chart } from "./node_modules/mk-60fps/chart.js";
import { mkdiv } from "https://unpkg.com/mkdiv@3.1.0/mkdiv.js";
import { mkpath } from "./src/mkpath.js";
import SF2Service from "./sf2-service/index.js";
import { newSFZone } from "./sf2-service/zoneProxy.js";

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
  audioPath,
  volMeters,
  activeChannel = 0;
renderMain();
window.addEventListener("hashchange", () => rendProgram(activeChannel));
async function renderMain() {
  await loadWait;
  if (!spinner) {
    audioPath = await startSpinner();
    spinner = audioPath.spinner;
  }
  document.body.innerHTML = "";
  mkdiv("nav", [
    (volMeters = mkdiv("div", { id: "volmeter", style: "min-height:2em" })),
    mkdiv("div", [
      mkdiv(
        "button",
        {
          "data-channel": 0,
          "data-key": 60,
          "data-vel": 88,
          onmousedown: ({ target: { dataset } }) => {
            dataset.channel;
            rendSample(dataset.channel, dataset.key, dataset.vel);
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
  const vrPanel = mkdiv("div", { class: "col" });
  main = mkdiv("div", { class: "main" }, [leftNav, rightPanel, vrPanel]);
  document.body.append(main);
  audioPath.viewTimeseries({ container: vrPanel });
  await audioPath.startAudio();
  rendProgram(0);
}

function rendProgram(channel) {
  const presetId = document.location.hash.substring(1).split("|");
  const intpre = parseInt(presetId);
  const pid = intpre || channel;
  const bid = intpre & 0x7f;

  program = sf2file.loadProgram(pid, bid);
  if (!zone) zone = program.filterKV(55, 98)[0];
  audioPath.channelState[channel].program = program;
  audioPath.channelState[channel].zoneObj = newSFZone(zone);
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
  spinner
    .shipProgram(program, intpre)
    .then((ee) => audioPath.bindKeyboard(channel));
}
async function renderZ(zoneSelect) {
  if (!zoneSelect) {
    return;
  }
  zoneObj = newSFZone(zoneSelect);
  const pcm = await zoneSelect.shdr.data();
  chart(canvas, pcm);

  const zoneinfo = mkdiv("div", [
    renderSampleView(zoneSelect),
    ..."Attenuation,VolEnv,Filter,LFO,Sample"
      .split(",")
      .map((keyword) => renderArticle(keyword, zoneSelect)),
  ]);

  articleMain.replaceChildren(zoneinfo);
}

function renderSampleView(zoneSelect) {
  return mkdiv("div", [
    "smpl: ",
    zoneSelect.shdr.SampleId,
    zoneSelect.SampleModes,
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
  ]);
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
function renderLPFView(zone) {}
function renderArticle(keyword, zone) {
  let canvas;
  const zoneObj = newSFZone(zone);
  const zattrs = Object.entries(zone).filter(([k]) => k.includes(keyword));

  const attrVals = mkdiv(
    "ul",
    zattrs.map(([k, v]) =>
      mkdiv("li", [
        mkdiv("label", [k, ":"]),
        mkdiv("dd", [v]),
        mkdiv("input", {
          type: "range",
          ...min_max_vals(k),
          value: v,
          oninput: (e) => {
            e.target.parentElement.querySelector("dd").textContent =
              e.target.value;
            zoneObj[k] = e.target.value;
            if (canvas) drawEV(zoneObj, canvas);
          },
        }),
      ])
    )
  );
  const details = mkdiv("div");
  const article = mkdiv("details", { class: "article" }, [
    mkdiv("summary", keyword),
    attrVals,
    details,
  ]);
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
  const audioPath = await mkpath(ctx, [analyzer]);
  spinner = audioPath.spinner;

  spinner.port.onmessage = ({ data }) => {
    if (data.egStages) {
      volMeters.innerHTML = data.egStages.join("&nbsp");
    }
    if (data.ack) {
      console.log(data.ack);
    }
  };
  return audioPath;
}
async function rendSample(chan, key, vel) {
  if (ctx.state !== "running") await ctx.resume();
  if (!zoneObj) return;
  const { arr, ref } = zoneObj;
  audioPath.channelState[parseInt(chan)] = { key, vel, zoneObj };

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
/* eslint-disable no-undef */
