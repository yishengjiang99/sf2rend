import { mkdiv, mksvg } from "../mkdiv/mkdiv.js";
import { midi_ch_cmds } from "./midilist.js";
import { attributeKeys } from "../sf2-service/zoneProxy.js";
const rowheight = 40,
  colwidth = 80;
const pixelPerDecibel = rowheight;
const pixelPerSec = 12;

export class TrackUI {
  constructor(idx, cb) {
    const i = idx;
    let refcnt = 0;
    const keyboard = mkdiv(
      "div",
      { class: "keyboards" },
      range(48, 72).map((midi) =>
        mkdiv(
          "a",
          {
            midi,
            onmousedown: (e) => {
              refcnt++;
              cb([0x90 | idx, midi, this.velocityInput]);

              e.target.addEventListener(
                "mouseup",
                () => refcnt >= 0 && cb([0x80 | idx, midi, this.velocityInput]),
                { once: true }
              );
            },
          },
          [midi % 12 ? " " : mkdiv("br"), midi]
        )
      )
    );
    const container = mkdiv(
      "div",
      {
        class: "attrs",

        style:
          "display:grid; grid-template-columns:1fr 1fr; grid-column-gap:10px;",
      },
      [
        mkdiv(
          "input",
          {
            type: "list",
            list: "programs",
            value: "",
            class: "name",
            onfocus: (e) => {
              e.target.placeholder = e.target.value;
              e.target.value = "";
            },
            onunfocus: (e) => {
              if (e.target.value == "") e.target.value = e.target.placeholder;
            },
            onchange: (e) => {
              const pid = Array.from(e.target.list.options).filter(
                (d) => d.value == e.target.value
              );
              if (!pid || !pid.length) throw "target not found";
              const pidval = pid[0].getAttribute("pid");
              cb([midi_ch_cmds.change_program | idx, pidval, 0]);
            },
          },
          ["channel " + i]
        ),
        mkdiv("input", { type: "checkbox" }),
        mkdiv(
          "div",
          {
            style: "display:grid; grid-template-columns:1fr 1fr; ",
          },
          [
            "midi",
            mkdiv("meter", { min: 0, max: 127, step: 1, aria: "key" }),

            // mkdiv("label", { for: "velin" }, "velocity"),
            "vel",
            mkdiv("input", {
              type: "range",
              id: "velin",
              min: 1,
              max: 127,
              step: 1,
              aria: "vel",
            }),
            mkdiv("label", { for: "vol" }, "volume"),

            mkdiv("input", {
              min: 0,
              max: 127,
              value: 100,
              step: 1,
              id: "vol",
              type: "range",
              oninput: (e) => cb([0xb0 | idx, 7, e.target.value]),
            }),
            mkdiv("label", { for: "pan" }, "pan"),
            mkdiv("input", {
              min: 0,
              max: 127,
              step: 1,
              type: "range",
              value: 64,
              oninput: (e) => cb([0xb0 | idx, 10, e.target.value]),
            }),
            mkdiv("label", { for: "expression" }, "expression"),
            mkdiv("input", {
              min: 0,
              max: 127,
              step: 1,
              value: 127,
              type: "range",
              oninput: (e) => cb([0xb0 | idx, 11, e.target.value]),
            }),
          ]
        ),
        mkdiv("div", {}, [
          mksvg(
            "svg",
            {
              style: "width:80px;height:59px; display:inline;",
              viewBox: "0 0 80 60",
            },
            [
              mksvg("polyline", {
                fill: "red",
                stroke: "black",
              }),
            ]
          ),
          keyboard,
        ]),
      ]
    );

    this.nameLabel = container.querySelector("input[type='list']");
    this.meters = container.querySelectorAll("meter");
    [this.velinput, ...this.sliders] = Array.from(
      container.querySelectorAll("input[type='range']")
    );
    this.labels = container.querySelectorAll("label");

    this.led = container.querySelector("input[type=checkbox]");
    this.polylines = Array.from(container.querySelectorAll("polyline"));
    this.container = container;
    this._active = false;
  }
  set name(id) {
    this.nameLabel.value = id;
  }
  set midi(v) {
    this.meters[0].value = v;
  }
  get midi() {
    return this.meters[0].value;
  }
  set CC({ key, value }) {
    switch (key) {
      case 7:
        this.sliders[0].value = value;
        this.labels[0].innerHTML = "volume" + value;

        break;
      case 10:
        this.sliders[1].value = value;
        this.labels[1].innerHTML = "pan" + value;

        break;
      case 11:
        this.sliders[2].value = value;
        this.labels[2].innerHTML = "exp" + value;

        break;
      default:
        console.log(key, value);
    }
  }
  set velocity(v) {
    this.velinput.value = v;
  }
  get velocityInput() {
    return parseInt(this.velinput.value);
  }
  get active() {
    return;
  }
  set active(b) {
    this._active = b;
    b
      ? this.led.setAttribute("checked", "checked")
      : this.led.removeAttribute("checked");
  }
  set env1({ phases: [a, d, s, r], peak }) {
    const points = [
      [0, 0],
      [a, 1],
      [a + d, s / 100],
      [a + d + r, 0],
    ]
      .map(([x, y]) => [x * pixelPerSec, (1 - y) * 0.8 * rowheight].join(","))
      .join(" ");
    this.polylines[0].setAttribute("points", points);
  }

  get canvasContainer() {
    return this.canc;
  }
  set zone(z) {
    document.querySelector("#debug").innerHTML = attributeKeys.reduce(
      (str, key) => (str += `${key}: ${z[key]}\n`),
      ""
    );
  }
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
    style: "display:grid;grid-template-columns:1fr 1fr; grid-row-gap:20px;",
  });
  for (let i = 0; i < 16; i++) {
    const trackrow = new TrackUI(i, cb);
    controllers.push(trackrow);
    tb.append(trackrow.container);
  }

  tb.attachTo(cpanel);
  return controllers;
}
