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

window.addEventListener("click", start, { once: true });

async function start() {
  const ctx = new AudioContext();
  if (ctx.state == "suspended") {
    await ctx.resume();
  }
  spinner = (await mkpath(ctx)).spinner;
  spinner.shipProgram(program, presetId);
  const zones = p.filterKV(key, vel).filter((z) => z.SampleId !== 0);
  let i = 0;
  while (zones.length) {
    spinner.keyOn(0, zones.shift(), i + 50, i + 30);
    spinner.KeyOff(9, i + 50, i + 70);
    console.log(zones.length);
    i++;
  }
}

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
  document.location.hash.substring(1).split("|");
  const intpre = parseInt(presetId);
  const pid = intpre;
  const bid = 0;
  program = sf2file.loadProgram(pid, bid);
  if (!zref) zref = program.filterKV(55, 55)[0].zref;

  const kRangeList = program.zMap.map(
    (z) =>
      `<option value=${z.ref} ${z.ref + "" == zref ? "selected" : ""}>${
        z.SampleId
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
  ]);
  const mainRight = mkdiv("div", { class: "note" }, [
    mkdiv("div", { class: "note-title" }, [sf2file.programNames[presetId]]),
    articleHeader,
    articleMain,
  ]).attachTo(rightPanel);
  document.body.append(main);

  renderZ(zref);
  async function renderZ(zref) {
    let zoneSelect = zref
      ? program.zMap.find((z) => z.ref + "" == zref)
      : program.zMap[0];

    if (zoneSelect) {
      const zattrs = Object.entries(zoneSelect).filter(
        ([attr, val], idx) => val && idx < 60
      );

      const pcm = await zoneSelect.shdr.data();
      const canvas = mkcanvas({ container: articleHeader });
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

          JSON.stringify(zoneSelect.KeyRange),
        ]),
        ..."Addr,KeyRange,Attenuation,VolEnv,Filter,LFO"
          .split(",")
          .map((keyword) =>
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
      zoneinfo.attachTo(mainRight);
    }
  }

  console.log(program);
}
