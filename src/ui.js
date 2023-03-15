/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import {
  mkdiv,
  mkdiv2,
  wrapDiv,
  mksvg,
} from "https://unpkg.com/mkdiv@3.1.2/mkdiv.js";
import { mkcanvas, chart } from "https://unpkg.com/mk-60fps@1.1.0/chart.js";
import { midi_ch_cmds, midi_effects as effects } from "./constants.js";

const rowheight = 40;
const pixelPerSec = 12;
let ControllerState;

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

    const container = mkdiv(
      "details",
      {
        style: "display:grid; grid-template-columns:1fr 1fr;",
        class: "instrPanels",
      },
      [
        mkdiv(
          "summary",
          {
            class: "attrs",
            style: "width:320px;padding:20px",
          },
          [
            mkdiv("input", { type: "checkbox" }),
            this.nameLabel,
            mkdiv(
              "a",
              {
                onclick: () => (ControllerState.activeChannelUserInput = idx),
              },
              "play"
            ),
          ]
        ),
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

        mkdiv("label", { for: "other" }, "other"),
        mkdiv("input", {
          min: 0,
          id: "other",
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
    );

    this.meters = container.querySelectorAll("meter");

    this.sliders = Array.from(
      container.querySelectorAll("input[type='range']")
    );
    const [keyLabel, velLabel, ...ccLabels] =
      container.querySelectorAll("label");
    this.ccLabels = ccLabels;
    this.led = container.querySelector("input[type=checkbox]");
    this.polylines = Array.from(container.querySelectorAll("polyline"));
    this.container = container;
    this._active = false;
    this._midi = null;
  }
  set presetId(presetId) {
    ControllerState = {
      ...ControllerState,
      channels: {
        ...ControllerState.channels,
        [this.idx]: presetId,
      },
    };
  }
  set name(id) {
    this.nameLabel.value = id;
  }
  8;
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
    console.log(value, key);
    switch (key) {
      case effects.volumecoarse:
        this.sliders[0].value = value;
        this.ccLabels[0].innerHTML = "volume" + value;
        break;
      case effects.pancoars:
        this.sliders[1].value = value;
        this.ccLabels[1].innerHTML = "pan" + value;
        break;
      case effects.expressioncoarse:
        this.sliders[2].value = value;
        this.ccLabels[2].innerHTML = "exp" + value;
        break;
      default:
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
  set env1({ phases: [a, d, s, r], peak }) {
    const points = [
      [0, 0],
      [a, 1],
      [a + d, s / 100],
      [a + d + r, 0],
    ];
    points
      .map(([x, y]) => [x * pixelPerSec, (1 - y) * 0.8 * rowheight].join(","))
      .join(" ");
    this.polylines[0].setAttribute("points", points);
  }
}

export function mkui(eventPipe, container) {
  const controllers = [];
  let refcnt = 0,
    activeChannel = 0;
  const tb = mkdiv("div", {
    border: 1,
    style: `height:500px;overflow-y:scroll`,
  });

  for (let i = 0; i < 16; i++) {
    const trackrow = new TrackUI(i, eventPipe.postMessage);
    controllers.push(trackrow);
    tb.append(trackrow.container);
    trackrow.container.onclick = (e) => {
      e.target.style.background_color = "pink";
      ControllerState.activeChannelUserInput = i;
    };
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
            eventPipe.postMessage([0x90 | activeChannel, midi, 120]);
            e.target.addEventListener(
              "mouseup",
              () =>
                refcnt >= 0 &&
                eventPipe.postMessage([0x80 | activeChannel, midi, 88]),
              { once: true }
            );
          },
        },
        [i % 12 ? " " : mkdiv("br"), midi]
      )
    )
  );
  const keyboard = mkKeyboard;
  const zoneCardContainer = mkdiv("div");
  ControllerState = new Proxy(
    {
      channels: {},
      activeChannelUserInput: 1,
      activeZoneDebug: 1,
    },
    {
      async set(obj, prop, value) {
        console.log(prop, value);

        switch (prop) {
          case "channels":
            console.log(prop, value);
            break;
          case "activeChannelUserInput":
            break;
        }
      },
    }
  );
  const cpanel = mkdiv2({
    tag: "div",
    border: 1,
    style: `height:500px;8display:grid;grid-area:a a a, b c c`,
    children: [tb, keyboard, mkdiv()],
  });

  cpanel.attachTo(container);
  return controllers;
}

async function mkZoneInfoCard(zone) {
  if (!zone) {
    return Promise.resolve();
  }
  const zattrs = Object.entries(zone).filter(
    ([_, val], idx) => val && idx < 60
  );
  const canvas = mkcanvas();
  const cardStyle =
    "display:flex flex-direction:row; max-height:50vh; overflow-y:scroll; gap:0 20px 20px";

  const articleMain = mkdiv(
    "div",
    { class: "note-preview", style: cardStyle },
    [
      mkdiv(
        "div",
        {
          style: cardStyle,
        },
        [
          mkdiv("div", [
            "smpl: ",
            zone.shdr.SampleId,
            " ",
            zone.shdr.name,
            "<br>nsample: ",
            zone.shdr.nsamples,
            "<br>srate: " + zone.shdr.originalPitch,
            "<br>Range: ",
            zone.shdr.range.join("-"),
            "<br>",
            "loop: ",
            zone.shdr.loops.join("-"),

            JSON.stringify(zone.KeyRange),
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
    ]
  );
  const pcm = await zone.shdr.data();
  chart(canvas, pcm);
  return articleMain;
}

const range = (x, y) =>
  Array.from(
    (function* _(x, y) {
      while (x < y) yield x++;
    })(x, y)
  );
