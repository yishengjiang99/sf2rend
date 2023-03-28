import { mkcanvas } from "./node_modules/mk-60fps/chart.js";
import { mkdiv } from "https://unpkg.com/mkdiv@3.1.0/mkdiv.js";
import {
  program,
  sf2file,
  zone,
  renderZ,
  articleMain,
  rightPanel,
  canvas,
  startSpinner,
  spinner,
} from "./e2e.js";

export async function rendProgram(program, zone, container) {
  const presetId = document.location.hash.substring(1).split("|");
  const intpre = parseInt(presetId);
  const pid = intpre;
  const bid = 0;

  program = sf2file.loadProgram(pid, bid);
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
  const articleHeader = mkdiv(
    "div",
    { class: "note-header" },

    mkdiv(
      "select",
      {
        oninput: (e) => renderZ(program.zMap.filter((z) => e.target.value)[0]),
      },
      kRangeList
    )
  );
  const articleMain = mkdiv("div", { class: "note-preview" }, [
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

  const canvas = mkcanvas({ container: articleHeader });
  await startSpinner();
  await spinner.shipProgram(program);
  renderZ(zone);
}
