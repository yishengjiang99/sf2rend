import { mkdiv } from "./mkdiv/mkdiv.js";
const rowheight = 40,
  colwidth = 80;
const pixelPerDecibel = rowheight;
const pixelPerSec = colwidth / 2;

export class TrackUI {
  constructor(container, keyboard, idx, cb) {
    this.nameLabel = container.querySelector(".name");
    this.meters = container.querySelectorAll("meter");
    this.sliders = container.querySelectorAll("input[type='range']");

    this.led = container.querySelector("input[type=checkbox");
    this.polylines = Array.from(container.querySelectorAll("polyline"));
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
        setTimeout(() => {
          cb([0x80 | idx, keyidx, 111]);
        }, 1000);
      };
      k.onmouseut = () => {
        if (refcnt > 0) cb([0x80 | idx, keyidx, 111]);
      };
    });
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
      .map(([x, y]) => [x * pixelPerSec, rowheight - y * rowheight].join(","))
      .join(" ");
    console.log(points);
    this.polylines[0].setAttribute("points", points);
  }
  set env2({ phases: [a, d, s, r], peak }) {
    const points = [
      [0, 0],
      [a, 1],
      [a + d, (100 - s) / 100],
      [a + d + r, 0],
    ]
      .map(([x, y]) => x * pixelPerSec + "," + y * pixelPerDecibel)
      .join(" ");
    console.log(points);
    this.polylines[1].setAttribute("points", points);
  }

  set zone(z) {
    this.env1 = {
      phases: [
        z.VolEnvAttack,
        z.VolEnvDecay,
        z.VolEnvSustain,
        z.VolEnvRelease,
      ].map((v) => Math.pow(2, v / 1200)),
      peak: 100 * Math.pow(10, z.Attenuation / -200),
    };
    this.sliders[0].value = z.Attenuation;
    this.sliders[1].value = z.FilterFc / 1200;
  }
}
const range = (x, y) =>
  Array.from(
    (function* _(x, y) {
      while (x < y) yield x++;
    })(x, y)
  );

export function mkui(cpanel, cb) {
  const controllers = [];

  const tb = mkdiv("table", { border: 1 });
  for (let i = 0; i < 16; i++) {
    const row = mkdiv(
      "tr",
      { class: "attrs" },
      [
        mkdiv("span", { class: "name" }, ["channel " + i]),
        mkdiv("meter", { min: 0, max: 127, step: 1, aria: "key" }),
        mkdiv("meter", { min: 0, max: 127, step: 1, aria: "vel" }),
        mkdiv("div", {}, [
          mkdiv("input", { min: -1000, max: 1000, step: 1, type: "range" }),
          mkdiv("input", { min: -1000, max: 1000, step: 1, type: "range" }),
          mkdiv("input", { min: -1000, max: 1000, step: 1, type: "range" }),
        ]),
        mkdiv("svg", { width: "80", height: "30" }),
        mkdiv("polyline", { stroke: "black", strokeWidth: 1, points: "" }),
      ].map((dv) => dv.wrapWith("td"))
    );
    const keyboard = mkdiv(
      "tr",
      { class: "keyboards" },
      mkdiv(
        "td",
        { colspan: 5 },
        range(55, 88).map((midi) => mkdiv("a", { midi }, [midi, " "]))
      )
    );
    controllers.push(new TrackUI(row, keyboard, i, cb));
    row.attachTo(tb);
    keyboard.attachTo(tb);
  }

  tb.attachTo(cpanel);
  return { controllers };
}
