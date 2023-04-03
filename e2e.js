import { mkcanvas, chart } from "./chart/chart.js";
import { mkdiv } from "./mkdiv/mkdiv.js";
import { mkpath } from "./src/mkpath.js";
import SF2Service from "./sf2-service/index.js";
import { newSFZone, newSFZoneMap } from "./sf2-service/zoneProxy.js";
import { playZone } from "./playProgram.js";
const sf2url = "file.sf2";

const sf2file = new SF2Service(sf2url);
const loadWait = sf2file.load();

let program,
  spinner,
  zone,
  canvas,
  main,
  rightPanel,
  zoneObj,
  rightTop,
  rightMain,
  audioPath,
  volMeters,
  vrPanel;
renderMain().then(() => {
  if (document.hash != "") rendProgram();
});

window.addEventListener("hashchange", rendProgram);

async function renderMain() {
  await loadWait;
  document.body.innerHTML = "";
  mkdiv("nav", [
    (volMeters = mkdiv("div", { id: "volmeter", style: "min-height:2em" })),
    mkdiv("div", [
      mkdiv(
        "button",
        {
          onclick: () => audioPath.silenceAll(),
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
  rightPanel = mkdiv("div", { class: "col right-panel" }, []);
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
  vrPanel = mkdiv("div", { class: "col vrPanel" });
  rightMain = mkdiv("div", { id: "art-main", class: "note-preview" }, [
    mkdiv("div", {
      style:
        "display:flex flex-direction:row; max-height:50vh; overflow-y:scroll; gap:0 20px 20px",
    }),
  ]);
  rightTop = mkdiv("div", { class: "note" });
  const canvasDiv = mkdiv("div");
  canvas = mkcanvas({ container: canvasDiv });
  rightPanel = mkdiv("div", { class: "col right-panel" }, [
    rightTop,
    canvasDiv,
    rightMain,
  ]);
  main = mkdiv("div", { class: "main" }, [leftNav, rightPanel, vrPanel]);
  document.body.append(main);
}

async function rendProgram() {
  const hashId = document.location.hash.substring(1).split("|");
  const intpre = parseInt(hashId[0]);
  const pid = intpre;
  const bid = 0;
  const zoneRef = hashId[1];

  program = sf2file.loadProgram(pid, bid);
  if (!zone) {
    zone = zoneRef
      ? program.zMap.find((z) => z.ref == zoneRef)
      : program.filterKV(60, 98)[0];
  }
  console.log("adsf", program, zone);
  const zoneSelect = mkdiv(
    "select",
    {
      oninput: (e) => {
        window.location.hash = "#" + pid + "|" + e.target.value;
      },
    },
    program.zMap.map(
      (z) =>
        `<option value=${z.ref}>${z.PBagId + "|" + z.IbagId} ${
          "key " +
          [z.KeyRange.lo, z.KeyRange.hi].join("-") +
          " vel " +
          [z.VelRange.lo, z.VelRange.hi].join("-")
        }</option>`
    )
  );

  zoneSelect.value = zoneRef;

  rightTop.replaceChildren(zoneSelect);
  if (!spinner) {
    await startSpinner();
  }
  await spinner.shipProgram(program, pid);

  if (zone) await renderZ(zone);
}
async function renderZ(zoneSelect) {
  if (!zoneSelect) {
    return;
  }
  zoneObj = newSFZone(zoneSelect);
  const pcm = await zoneSelect.shdr.data();
  chart(canvas, pcm, {
    annotate: [1111, 2222],
  });

  const zoneinfo = mkdiv("div", [
    mkdiv(
      "button",
      {
        onclick: (e) => rendSample(zoneSelect, zoneSelect.KeyRange.lo),
      },
      zoneSelect.KeyRange.lo
    ),
    mkdiv(
      "button",
      {
        onclick: (e) => rendSample(zoneSelect, zoneSelect.KeyRange.hi),
      },
      zoneSelect.KeyRange.hi
    ),
    mkdiv(
      "button",
      {
        onclick: () => playZone(ctx, zoneSelect, zoneSelect.KeyRange.lo),
      },
      "play"
    ),
    mkdiv(
      "button",
      {
        onclick: () => playZone(ctx, zoneSelect, zoneSelect.KeyRange.hi),
      },
      "play"
    ),
    "pitch r",
    zoneSelect.calcPitchRatio(zoneSelect.KeyRange.hi, ctx.sampleRate),
    renderSampleView(zoneSelect),
    ..."Attenuation,Addr,VolEnv,Filter,LFO"
      .split(",")
      .map((keyword) => renderArticle(keyword, zoneSelect)),
  ]);
  rightMain.replaceChildren(zoneinfo);
}

function renderSampleView(zoneSelect) {
  return mkdiv("div", [
    "smpl: ",
    zoneSelect.shdr.SampleId,
    " ",
    zoneSelect.shdr.name,
    "<br>nsample: ",
    zoneSelect.shdr.nsamples,
    "<br>srate: " + zoneSelect.shdr.originalPitch,
    "<br>Range: ",
    JSON.stringify(zoneSelect.shdr.range),
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
  }
  if (k.includes("Env")) {
    return { min: -12000, max: 5000, step: 100 };
  } else
    switch (k) {
      case "Attenuation":
        return { min: 0, max: 1000 };
      default:
        break;
    }
}
function renderArticle(keyword, zone) {
  let canvas;
  const zoneObj = newSFZone(zone);
  const zattrs = Object.entries(zone).filter(([k]) => k.includes(keyword));

  const attrVals = mkdiv(
    "ul",
    zattrs.map(([k, v]) =>
      mkdiv("li", [
        mkdiv("label", [k, ":"]),
        mkdiv("code", [v]),
        mkdiv("input", {
          type: "range",
          ...min_max_vals(k),
          value: v,
          oninput: (e) => {
            e.target.parentElement.querySelector("code").textContent =
              e.target.value;
            zoneObj[k] = e.target.value;
            if (canvas) drawEV(zoneObj, canvas);
            spinner.port.postMessage({
              update: [program.pid | program.bkid, zoneObj.ref],
              arr: zoneObj.arr,
            });
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
  ctx = new AudioContext();
  audioPath = await mkpath(ctx);
  await audioPath.startAudio();
  spinner = audioPath.spinner;

  spinner.port.onmessage = ({ data }) => {
    if (data.currentFrame) {
      volMeters.innerHTML = data.currentFrame;
    }
    if (data.zack == "update") {
      console.log(newSFZoneMap(1111, data.arr));
    } else {
      // console.log(data);
    }
  };
  return audioPath;
}
async function rendSample(zone, key) {
  spinner.port.postMessage([
    0x90,
    0,
    key,
    55,
    [program.pid | program.bkid, zone.ref],
  ]);
  setTimeout(() => {
    spinner.port.postMessage([0x80, 0, key, 55]);
  }, 2100);
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
