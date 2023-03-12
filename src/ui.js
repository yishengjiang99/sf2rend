import { mkdiv, mkdiv2, mksvg } from "../mkdiv/mkdiv.js";
import { midi_ch_cmds } from "./constants.js";
import { attributeKeys } from "../sf2-service/zoneProxy.js";
const rowheight = 40,
  colwidth = 80;
const pixelPerDecibel = rowheight;
const pixelPerSec = 12;

export class TrackUI {
  constructor(idx, cb) {
    const i = idx;
    this.nameLabel = mkdiv2({
      tag: "input",
      type: "text",
      autocomplete: "off",
      onfocus: (e) => (e.target.value = ""),
      list: idx == 9 ? "drums" : "programs",
      onchange: (e) => {
        const pid = Array.from(e.target.list.options).findIndex(
          (d) => d.value == e.target.value
        );
        cb([midi_ch_cmds.change_program | idx, pid, idx == 9 ? 128 : 0]);
        e.target.blur();
      },
    });

    const container = mkdiv(
      "div",
      {
        class: "attrs",style:"width:500px"
      },
      [
        this.nameLabel,
        mkdiv("input", { type: "checkbox" }),
        mkdiv(
          "div",
          {
            style: "display:grid; grid-template-columns:1fr 1fr; ",
          },
          [
            mkdiv("label", { for: "mkey" }, "key"),
            mkdiv("meter", {
              min: 0,
              max: 127,
              id: "mkey",
              aria: "key",
            }),
            mkdiv("label", { for: "velin" }, "velocity"),

            mkdiv("meter", {
              type: "range",
              id: "velin",
              min: 1,
              max: 127,
              step: 1,
              aria: "vel",
              value: 60,
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
          ]
        ),
      ]
    );

    this.meters = container.querySelectorAll("meter");

    this.sliders = Array.from(
      container.querySelectorAll("input[type='range']")
    );
    this.labels = container.querySelectorAll("label");

    this.led = container.querySelector("input[type=checkbox]");
    this.polylines = Array.from(container.querySelectorAll("polyline"));
    this.container = container;
    this._active = false;
    this._midi = null;
  }
  set name(id) {
    this.nameLabel.value = id;
  }
  get name() {
    return this.nameLabel.value;
  }
  set midi(v) {
    this._midi = v;
    this.meters[0].value = v;
  }
  get midi() {
    return this._midi;
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
    this.meters[1].value = v;
  }
  get velocityInput() {
    return this.meters[1].value;
  }
  get active() {
    return this._active;
  }
  set active(b) {
    this._active = b;
    b
      ? this.led.setAttribute("checked", "checked")
      : this.led.removeAttribute("checked");
  }
  set zone(z) {
    const [delay, attack, hold, decay, release] = [
      z.VolEnvDelay,
      z.VolEnvAttack,
      z.VolEnvHold,
      z.VolEnvDecay,
      z.VolEnvRelease,
    ].map((v) => (v == -1 || v <= -12000 ? 0.0001 : Math.pow(2, v / 1200)));
    const sustain = Math.pow(10, z.VolEnvSustain / -200);
    this.env1 = { phases: [attack, decay, sustain, release], peak: 100 };
    document.querySelector("#debug").innerHTML = attributeKeys
      .filter((key) => z[key])
      .reduce((str, key) => (str += `${key}: ${z[key]}\n`), "");
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
}

const range = (x, y) =>
  Array.from(
    (function* _(x, y) {
      while (x < y) yield x++;
    })(x, y)
  );

export function mkui(cpanel, eventPipe) {
  const controllers = [];

  const tb = mkdiv("div", {
    border: 1,
  });

  for (let i = 0; i < 16; i++) {
    const trackrow = new TrackUI(i, eventPipe.postMessage);
    controllers.push(trackrow);
    tb.append(trackrow.container);
  }
  let refcnt = 0;

  const keyboard = mkdiv(
    "div",
    { class: "keyboards" },
    range(48, 72).map((midi, i) =>
      mkdiv(
        "a",
        {
          midi,
          onmousedown: (e) => {
            refcnt++;
            eventPipe.postMessage([0x90 | 0, midi, 120]);
            e.target.addEventListener(
              "mouseup",
              () => refcnt >= 0 && eventPipe.postMessage([0x80 | 0, midi, 88]),
              { once: true }
            );
          },
        },
        [i % 12 ? " " : mkdiv("br"), midi]
      )
    )
  );
  keyboard.attachTo(cpanel);  tb.attachTo(cpanel);

  return controllers;
}
