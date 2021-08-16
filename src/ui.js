import { mkdiv, mksvg } from "../mkdiv/mkdiv.js";
const rowheight = 40,
  colwidth = 80;
const pixelPerDecibel = rowheight;
const pixelPerSec = 12;

export class TrackUI {
  constructor(container, keyboard, idx, cb) {
    this.nameLabel = container.querySelector(".name");
    this.meters = container.querySelectorAll("meter");
    this.sliders = container.querySelectorAll("input[type='range']");

    this.led = container.querySelector("input[type=checkbox]");

    this.canc = container.querySelector(".canvasContainer");

    this.keys = Array.from(keyboard.querySelectorAll("a"));
    this.keys.forEach((k, keyidx) => {
      var refcnt = 0;
      const midi = k.getAttribute("midi");
      k.onmousedown = () => {
        refcnt++;
        cb([0x90 | idx, midi, 111]);

        k.addEventListener(
          "mouseup",
          () => refcnt-- > 0 && cb([0x80 | idx, midi, 111]),
          { once: true }
        );
        k.addEventListener("mouseleave", () => cb([0x80 | idx, midi, 111]), {
          once: true,
        });
      };
    });
    this.polylines = Array.from(container.querySelectorAll("polyline"));
  }
  set name(id) {
    this.nameLabel.innerHTML = id;
  }
  set midi(v) {
    this.meters[0].value = v;
  }
  set velocity(v) {
    this.meters[1].value = v;
  }
  set active(b) {
    b
      ? this.led.setAttribute("checked", "checked")
      : this.led.removeAttribute("checked");
  }
  set env1({ phases: [a, d, s, r], peak }) {
    const points = [
      [0, 0],
      [a, 1],
      [a + d, (100 - s) / 100],
      [a + d + r, 0],
    ]
      .map(([x, y]) => [x * pixelPerSec, (1 - y) * 0.8 * rowheight].join(","))
      .join(" ");
    this.polylines[0].setAttribute("points", points);
  }

  get canvasContainer() {
    return this.canc;
  }
  set zone(z) {}
}
const range = (x, y) =>
  Array.from(
    (function* _(x, y) {
      while (x < y) yield x++;
    })(x, y)
  );

export function mkui(cpanel, cb) {
  cb = cb.postMessage;
  const controllers = [];

  const tb = mkdiv("div", {
    border: 1,
    style:
      "display:grid;grid-template-columns:1fr; margin-bottom:10px;background:#333333;grid-row-gap:20px;",
  });
  for (let i = 0; i < 16; i++) {
    const keyboard = mkdiv(
      "div",
      { class: "keyboards", style: "display:none" },
      range(55, 69).map((midi) => mkdiv("a", { midi }, [midi, " "]))
    );
    const row = mkdiv(
      "div",
      {
        class: "attrs",
        onmouseenter: (e) => {
          e.target.querySelector(".keyboards").style.display = "block";
        },
        onmouseleave: (e) => {
          e.target.querySelector(".keyboards").style.display = "none";
        },
        style: "display:grid; grid-template-columns:1fr 1fr 1fr",
      },
      [
        mkdiv("div", { style: "display:grid; grid-template-columns:1fr" }, [
          mkdiv("span", { class: "name" }, ["channel " + i]),
          mkdiv("input", { type: "checkbox" }),
          mkdiv("meter", { min: 0, max: 127, step: 1, aria: "key" }),
          mkdiv("meter", { min: 0, max: 127, step: 1, aria: "vel" }),
        ]),
        mkdiv("div", { style: "display:grid;grid-template-columns:2fr 2fr" }, [
          mkdiv("label", { for: "exp_vol" }, "volume"),
          mkdiv("input", { min: 0, max: 127, step: 1, type: "range" }),
          mkdiv("label", { for: "pan" }, "pan"),
          mkdiv("input", { min: 0, max: 127, step: 1, type: "range" }),
          mkdiv("label", { for: "expression" }, "expression"),
          mkdiv("input", { min: 0, max: 127, step: 1, type: "range" }),
        ]),
        mkdiv(
          "div",
          {
            style:
              "display:grid; grid-template-columns:1fr 4fr;background-color:grey",
          },
          [
            mksvg(
              "svg",
              {
                style: "width:80;height:40; display:inline;",
                viewBox: "0 0 80 40",
              },
              [
                mksvg("polyline", {
                  fill: "red",
                  stroke: "black",
                }),
              ]
            ),
            mkdiv("div", { class: "canvasContainer" }),
          ]
        ),
        keyboard,
      ]
    );

    controllers.push(new TrackUI(row, keyboard, i, cb));
    row.attachTo(tb);
    keyboard.attachTo(row);
  }

  tb.attachTo(cpanel);
  return controllers;
}
