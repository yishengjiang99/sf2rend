import { mkcanvas, chart } from "https://unpkg.com/mk-60fps@1.1.0/chart.js";
import { mkdiv } from "https://unpkg.com/mkdiv@3.1.0/mkdiv.js";
import { SpinNode } from "./spin/spin.js";
import { mkpath } from "./src/path.js";
import SF2Service from "./sf2-service/index.js";
const sf2url = "file.sf2";

const sf2file = new SF2Service(sf2url);
const loadWait = sf2file.load();

let program, spinner, zref, presetId;

renderMain();
window.addEventListener("hashchange", renderMain);
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
  const [leftNav, rightPanel] = [
    mkdiv(
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
    ),
    mkdiv("div", { class: "col note-viewer" }),
  ];
  const main = mkdiv("div", { class: "main" }, [leftNav, rightPanel]);
  const presetId = document.location.hash.substring(1).split("|");
  const intpre = parseInt(presetId);
  const pid = intpre;
  const bid = 0;
  program = sf2file.loadProgram(pid, bid);
  console.log(program.zMap);
  if (!zref) zref = program.filterKV(55, 55)[0]?.zref;

  const kRangeList = program.zMap.map(
    (z) =>
      `<option value=${z.ref} ${z.ref + "" == zref ? "selected" : ""}>${
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
          oninput: (e) => renderZ(e.target.value),
        },
        kRangeList
      )
    ),
  ]);
  const articleMain = mkdiv("div", { class: "note-preview" }, [
    mkdiv("div", {
      style:
        "display:flex flex-direction:row; max-height:50vh; overflow-y:scroll; gap:0 20px 20px",
    }),
  ]).attachTo(main);
  const mainRight = mkdiv("div", { class: "note" }, [
    mkdiv("div", { class: "note-title" }, [sf2file.programNames[presetId]]),
    articleHeader,
    ,
  ]).attachTo(rightPanel);
  document.body.append(main);
  const canvas = mkcanvas({ container: articleHeader });

  renderZ(zref);
  async function renderZ(zref) {
    let zoneSelect = zref
      ? program.zMap.find((z) => z.ref + "" == zref)
      : program.zMap[0];
    articleMain.innerHTML = 0;

    if (zoneSelect) {
      const zattrs = Object.entries(zoneSelect).filter(
        ([attr, val], idx) => idx < 60
      );

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
        ..."Sustain,Attenuation,VolEnv,Filter,LFO".split(",").map((keyword) =>
          mkdiv(
            "div",
            { style: "padding:10px;color:gray;" },
            zattrs
              .filter(([k]) => k.includes(keyword))
              .map(([k, v]) => k + ": " + v)
              .join("<br>")
          )
        ),
      ]);
      zoneinfo.attachTo(articleMain);
    }
  }
}
const button = mkdiv("button", "start");
button.attachTo(document.body);
button.addEventListener("click", start, { once: true });
async function start() {
  const ctx = new AudioContext();
  if (ctx.state == "suspended") {
    await ctx.resume();
  }
  spinner = (await mkpath(ctx)).spinner;
  spinner.shipProgram(program, presetId);
}
