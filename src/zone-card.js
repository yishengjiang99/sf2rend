import { mkdiv, logdiv, mksvg } from "https://unpkg.com/mkdiv@3.1.2/mkdiv.js";

function zoneInfo(zone) {
  const zattrs = Object.entries(zone).filter(
    ([_, val], idx) => val && idx < 60
  );
  return mkdiv("div", { class: "note-preview" }, [
    mkdiv(
      "div",
      {
        style:
          "display:flex flex-direction:row; max-height:50vh; overflow-y:scroll; gap:0 20px 20px",
      },
      [
        mkdiv("div", [
          "smpl: ",
          zone.shdr.SampleId,
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
}
