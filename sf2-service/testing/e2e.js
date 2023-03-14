import { mkcanvas, chart } from "https://unpkg.com/mk-60fps@1.1.0/chart.js";
import { mkdiv, wrapList } from "https://unpkg.com/mkdiv@3.1.0/mkdiv.js";
import SF2Service from "../index.js";
const sf2url = "https://grep32bit.blob.core.windows.net/sf2/GeneralUserGS.sf2";

const sf2file = new SF2Service(sf2url);
const loadWait = sf2file.load();
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
  console.log(sf2file.programNames);
  const [presetId, zref] = document.location.hash.substring(1).split("|");
  const pid = presetId % 128;
  const bid = presetId ^ 128;
  const program = sf2file.loadProgram(pid, bid);
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
          oninput(e) {
            document.location.hash = [presetId, e.target.value].join("|");
          },
        },
        kRangeList
      )
    ),
  ]);

  const zoneSelect = zref
    ? program.zMap.find((z) => z.ref + "" == zref)
    : program.filterKV(60, -1)?.[0] ?? program.zMap[0];

  if (!zoneSelect) {
    return;
  }
  const zattrs = Object.entries(zoneSelect).filter(
    ([attr, val], idx) => val && idx < 60
  );
  const canvas = mkcanvas({ container: main });

  const articleMain = mkdiv("div", { class: "note-preview" }, [
    mkdiv(
      "div",
      {
        style:
          "display:flex flex-direction:row; max-height:50vh; overflow-y:scroll; gap:0 20px 20px",
      },
      [
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
      ]
    ),
  ]);

  const mainRight = mkdiv("div", { class: "note" }, [
    mkdiv("div", { class: "note-title" }, [sf2file.programNames[presetId]]),
    articleHeader,
    articleMain,
  ]);
  main.attachTo(document.body);
  mainRight.attachTo(main);
  await program.preload();
  const pcm = await zoneSelect.shdr.data();
  console.log(pcm);
  chart(canvas, pcm);
}
