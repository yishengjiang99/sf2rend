/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import {
  mkdiv,
  mkdiv2,
  wrapDiv,
  mksvg,
} from "https://unpkg.com/mkdiv@3.1.2/mkdiv.js";
import { midi_ch_cmds, midi_effects as effects } from "./constants.js";

const rowheight = 40;
const pixelPerSec = 12;
let ControllerState;
let activeChannel = 0;

export function mkui(
  eventPipe,
  container,
  { onTrackClick, onTrackDoubleClick }
) {
  const controllers = [];
  let refcnt = 0;
  let _activeChannel = 0;
  const tb = mkdiv("div", {
    border: 1,
    style: `display:flex;flex-direction:row; grid-gap:20px;flex-wrap:wrap`,
  });

  for (let i = 0; i < 16; i++) {
    const trackrow = new TrackUI(i, eventPipe.postMessage);
    controllers.push(trackrow);
    tb.append(trackrow.container);
    trackrow.container.classList.add("channelCard");
    trackrow.container.addEventListener(
      "mouseenter",
      (e) => {
        _activeChannel = i;
        e.target.parentElement
          .querySelectorAll(".active")
          .forEach((e) => e.classList.remove("active"));
        trackrow.container.classList.add("active");
      },
      false
    );
    trackrow.container.addEventListener("dblclick", (e) => {
      onTrackDoubleClick(i, e);
    });
  }
  const mkKeyboard = mkdiv(
    "div",
    { class: "keyboards" },
    range(48, 72).map((midi, i) =>
      mkdiv(
        "a",
        {
          midi,
          onmousedown: (e) => {
            refcnt++;
            eventPipe.postMessage([0x90 | this.activeChannel, midi, 120]);
            e.target.addEventListener(
              "mouseup",
              () =>
                refcnt >= 0 &&
                eventPipe.postMessage([0x80 | this.activeChannel, midi, 88]),
              { once: true }
            );
          },
        },
        [i % 12 ? " " : mkdiv("br"), midi]
      )
    )
  );
  const cpanel = mkdiv("div", [tb, mkKeyboard]);

  cpanel.attachTo(container);
  return {
    controllers,
    get activeChannel() {
      return _activeChannel;
    },
    set activeChannel(c) {
      _activeChannel = c;
    },
  };
}
export class TrackUI {
  constructor(idx, cb) {
    this.idx = idx;
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
    this.led = mkdiv("input", { type: "checkbox" });

    const newLocal = "amp-indicate";
    const container = mkdiv(
      "span",
      {
        style: "display:grid; grid-template-columns:1fr 1fr",
        class: "instrPanels",
      },
      [
        this.led,
        this.nameLabel,
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

        mkdiv("label", { for: "othbalaner" }, "other"),
        mkdiv("input", {
          min: 0,
          id: "other",
          max: 127,
          step: 1,
          value: 127,
          type: "range",
          oninput: (e) => cb([0xb0 | idx, 8, e.target.value]),
        }),
        mkdiv(
          "span",
          {
            class: newLocal,
          },
          ""
        ),
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
    );

    this.meters = container.querySelectorAll("meter");

    this.sliders = Array.from(
      container.querySelectorAll("input[type='range']")
    );
    const [keyLabel, velLabel, ...ccLabels] =
      container.querySelectorAll("label");
    this.ccLabels = ccLabels;

    this.polylines = Array.from(container.querySelectorAll("polyline"));
    this.container = container;
    this._active = false;
    this._midi = null;
  }
  set hidden(h) {
    this.container.style.display = h ? "none" : "grid";
  }
  set presetId(presetId) {}
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
      case effects.volumecoarse:
        this.sliders[0].value = value;
        this.ccLabels[0].innerHTML = "volume" + value;
        break;
      case effects.pancoarse:
        this.sliders[1].value = value;
        this.ccLabels[1].innerHTML = "pan" + value;
        break;
      case effects.expressioncoarse:
        this.sliders[2].value = value;
        this.ccLabels[2].innerHTML = "exp" + value;
        break;
      case effects.pitchbendcoarse:
        this.sliders[3].value = "midi " + key;
        this.ccLabels[3].innerHTML = "value" + value;
        break;
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
    if (b) {
      this.led.setAttribute("checked", "checked");
    } else {
      this.led.removeAttribute("checked");
    }
  }
  set env1([a, h, d, s, r]) {
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
