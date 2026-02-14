import { mkdiv, mkdiv2 } from "../mkdiv/mkdiv.js";
import {
  midi_ch_cmds,
  range,
  midi_effects as effects,
  DRUMSCHANNEL,
} from "./constants.js";
import { fa_switch_btn, grid_tbl } from "./btns.js";
import { attributeKeys, defZone, newSFZone } from "../sf2-service/zoneProxy.js";
import { baseOctave } from "./sequence/constants.js";
import { mkcanvas } from "../chart/chart.js";

const rowheight = 40;
const pixelPerSec = 12;
const [W, H] = [(visualViewport.width / 3) * 2, 120];

export function mkui(
  eventPipe,
  container,
  { onTrackClick, onTrackDoubleClick, onEditZone, onAddChannel }
) {
  class TrackUI {
    constructor(idx, cb) {
      this.config = {
        nsemi: 24,
        pxpqn: 50,
        qnPerBar: 4,
        mspqn: 500000,
        sPerqn: 0.5,
        qnOffset: 0,
        pxPerSemi: 5,
      };
      this.setConfig = (configPartials) => {
        this.config = {
          ...this.config,
          ...configPartials,
        };
      };
      this.idx = idx;
      this.nameLabel = mkdiv2({
        tag: "input",
        type: "text",
        autocomplete: "off",
        onfocus: (e) => (e.target.value = ""),
        list: idx == DRUMSCHANNEL ? "drums" : "programs",
        onchange: (e) => {
          const pid = e.target.value & 0x7f;
          const bkid = e.target.value >> 7;
          const change_program = midi_ch_cmds.change_program;
          cb([change_program | idx, pid, bkid]);
          e.target.blur();
        },
      });
      this.led = mkdiv("input", {
        class: "onoff_indicate",
        type: "checkbox",
        name: "ch_" + idx,
      });

      this.zoneEdit = mkdiv("div", [
        ` <label for="modal-control${idx}" class="toggle"> <i class='fas fa-edit'></label>`,
        `<input type="checkbox" id="modal-control${idx}" class="modal">`,
        `<div> <label for="modal-control${idx}" class="modal-close" >Close Modal</label>
        <p class='editTable'></p>`,
      ]);
      const ctslsDiv = mkdiv("div", { class: "ctrls" }, [
        fa_switch_btn({
          id: "mute" + idx,
          icons: ["fa-volume-mute", "fa-volume-up"],
          data: {
            path_cmd: "mute",
            p1: idx,
          },
        }),
        fa_switch_btn({
          id: "solo" + idx,
          icons: ["fa-headphones active", "fa-music"],
          data: {
            path_cmd: "solo",
            p1: idx,
          },
        }),
        this.zoneEdit,
        "<br>",
      ]);
      const ampshow = mkdiv("div", {
        class: "amp-indicate",
      });
      const inst_header_section = mkdiv(
        "div",
        {
          style:
            "display:grid; grid-template-columns:1fr 2fr 1fr; height:140px",
        },
        [
          mkdiv(
            "span",
            {
              style: "text-align:center; padding:10%",
            },
            [`<i class='fas fa-play'>`, idx]
          ),
          mkdiv(
            "span",
            {
              style: "display:flex;flex-direction:column",
            },
            [this.nameLabel, ctslsDiv, ampshow]
          ),
          mkdiv("span", [
            mkdiv(
              "button",
              {
                data: {
                  path_cmd: "gear",
                  p1: idx,
                },
              },
              `<i class='fas fa-gears'>`
            ),
          ]),
        ]
      );
      this.timeline = [];
      this.open_notes = {};

      const sequencer = mkdiv("div", { style: "flex-grow:1;" });
      this.cctx = mkcanvas({ width: W, height: H, container: sequencer });
      this.cctx.fillStyle = "red";
      this.container = mkdiv(
        "div",
        { style: "width:100%; display:grid; grid-template-columns:1fr 5fr" },
        [inst_header_section, sequencer]
      );
      this.container.append(
        mkdiv("div", [
          "vol",
          mkdiv(
            "input",
            {
              min: 1,
              max: 128,
              value: 100,
              step: 1,
              id: "vol",
              type: "range",
              oninput: (e) => cb([0xb0 | idx, 7, e.target.value]),
            },
            "vol"
          ),
          "expression",
          mkdiv("input", {
            min: 1,
            max: 128,
            value: 100,
            step: 1,
            id: "vol",
            type: "range",
            oninput: (e) =>
              cb([0xb0 | idx, effects.expressioncoarse, e.target.value]),
          }),
          "pan",
          mkdiv("input", {
            min: 1,
            max: 128,
            value: 100,
            step: 1,
            id: "vol",
            type: "range",
            oninput: (e) => cb([0xb0 | idx, effects.pancoarse, e.target.value]),
          }),
        ])
      );

      this.meters = container.querySelectorAll("meter");

      this.sliders = Array.from(
        container.querySelectorAll("input[type='range']")
      );

      this._active = false;
      this._midi = null;
      this.tt = 0;
      this.toffset = 0;
      this.timePerFrame = (W / this.config.pxpqn) * this.config.sPerqn;
    }
    rendFrame() {
      const ppt = this.config.pxpqn * 2;
      if (this.timePerFrame < this.tt - this.toffset) {
        this.cctx.clearRect(0, 0, W, H);
        this.toffset += this.timePerFrame;
      }
      this.cctx.clearRect(0, 0, 100, 20);
      this.cctx.fillText(this.tt.toFixed(1), 0, 10, 100);
      //this.tt + "|" + this.toffset, 0, 10, 100);
      this.cctx.save();
      for (const [t0, k0, dt] of this.timeline) {
        const x0 = (t0 - this.toffset) * ppt;
        if (this.tt > t0 + 10) continue;
        const h1 = this.config.pxPerSemi * (k0 - baseOctave);
        this.cctx.fillRect(x0, h1, dt * ppt, this.config.pxPerSemi);
      }
      this.cctx.save();
    }
    set hidden(h) {
      this.container.style.display = h ? "none" : "grid";
    }
    set presetId(presetId) {
      this._pid = presetId;
    }
    set name(id) {
      this.nameLabel.value = id;
    }
    get name() {
      return this.nameLabel.value;
    }
    get velocityInput() {
      return this.meters[1].value;
    }

    keyOn(k, v, t) {
      this.tt = t;
      this.open_notes[k] = [t, k, v];
    }
    keyOff(k, v, t) {
      if (!this.open_notes[k]) return;
      const [startT, midi] = this.open_notes[k];
      delete this.open_notes[k];
      this.timeline.push([startT, midi, t - startT]);
      this.tt = t;
    }
    set active(b) {
      this._active = b;
      if (b) {
        this.led.setAttribute("checked", "checked");
      } else {
        this.led.removeAttribute("checked");
      }
    }
    set zone(z) {
      if (!z) return;
      const { arr, ref } = z;
      const zmap = newSFZone(z);
      this._zone = {
        arr,
        ref,
      };
      this.zoneEdit.style.display = "grid";
      this.zoneEdit.querySelector(".editTable").replaceChildren(
        mkdiv(
          "form",
          {
            onsubmit: (e) => {
              e.preventDefault();
              const atts = new Int16Array(
                Array.from(new FormData(e.target).values())
              );
              z.arr.set(atts);
              onEditZone({
                arr: atts,
                update: [this._pid, ref],
              }).then((confirmation1) => {
                console.log(confirmation1);
              });
            },
          },
          mkdiv("table", [
            mkdiv("tr", [mkdiv("th", "name"), mkdiv("th", "value")]),
            ...Array.from(this._zone.arr).map((attr, index) =>
              mkdiv("tr", [
                mkdiv("td", attributeKeys[index]),
                mkdiv("td", {}, [
                  mkdiv("input", {
                    value: attr,
                    name: index,
                    placeholder: "a",
                    oninput: (a) => {
                      zmap[attributeKeys[index]] = a.target.value;
                    },
                  }),
                  ...(index == 43 || index == 44
                    ? [
                      zmap[attributeKeys[index]].lo,
                      "-",
                      zmap[attributeKeys[index]].hi,
                    ]
                    : []),
                ]),
              ])
            ),
          ])
        )
      );
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
  const controllers = [];
  let refcnt = 0;
  let _activeChannel = 0;
  const tb = mkdiv("div");

  for (let i = 0; i < 16; i++) {
    const trackrow = new TrackUI(i, eventPipe.postMessage);
    controllers.push(trackrow);
    trackrow.hidden = true;
    tb.append(trackrow.container);
    trackrow.container.classList.add("channelCard");
    trackrow.container.addEventListener(
      "click",
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
    trackrow.container.addEventListener("click", (e) => {
      onTrackClick(i, e);
    });
  }
  tb.append(
    mkdiv(
      "button",
      {
        onclick: onAddChannel,
      },
      "+"
    )
  );
  const css = `:host{box-sizing:border-box;} 
  ul{height:18.875em;margin:1em auto;padding:.5em 0 0 .1em;position:relative;border:1px solid #160801;border-radius:1em;background:black} 
  li{margin:0;padding:0;list-style:none;position:relative;float:left} ul .white{height:16em;width:3.8em;z-index:1;border-left:1px solid #bbb;border-bottom:1px solid #bbb;border-radius:0 0 5px 5px;box-shadow:-1px 0 0 rgba(255,255,255,.8) inset,0 0 5px #ccc inset,0 0 3px rgba(0,0,0,.2);background:linear-gradient(to bottom,#eee 0,#fff 100%);margin:0 0 0 -1em}
  ul .white:active{border-top:1px solid #777;border-left:1px solid #999;border-bottom:1px solid #999;box-shadow:2px 0 3px rgba(0,0,0,.1) inset,-5px 5px 20px rgba(0,0,0,.2) inset,0 0 3px rgba(0,0,0,.2);background:linear-gradient(to bottom,#fff 0,#e9e9e9 100%)}
  ul .white.pressed{border-top:1px solid #777;border-left:1px solid #999;border-bottom:1px solid #999;box-shadow:2px 0 3px rgba(0,0,0,.1) inset,-5px 5px 20px rgba(0,0,0,.2) inset,0 0 3px rgba(0,0,0,.2);background:linear-gradient(to bottom,#fff 0,#e9e9e9 100%)}
  .black{height:8em;width:2em;margin:0 0 0 -1em;z-index:2;border:1px solid #000;border-radius:0 0 3px 3px;box-shadow:-1px -1px 2px rgba(255,255,255,.2) inset,0 -5px 2px 3px rgba(0,0,0,.6) inset,0 2px 4px rgba(0,0,0,.5);background:linear-gradient(45deg,#222 0,#555 100%)}
  .black:active{box-shadow:-1px -1px 2px rgba(255,255,255,.2) inset,0 -2px 2px 3px rgba(0,0,0,.6) inset,0 1px 2px rgba(0,0,0,.5);background:linear-gradient(to right,#444 0,#222 100%)}.a,.c,.d,.f,.g{margin:0 0 0 -1em}ul li:first-child{border-radius:5px 0 5px 5px}ul li:last-child{border-radius:0 5px 5px 5px}
  .black.pressed{box-shadow:-1px -1px 2px rgba(255,255,255,.2) inset,0 -2px 2px 3px rgba(0,0,0,.6) inset,0 1px 2px rgba(0,0,0,.5);background:linear-gradient(to right,#444 0,#222 100%)}.a,.c,.d,.f,.g{margin:0 0 0 -1em}ul li:first-child{border-radius:5px 0 5px 5px}ul li:last-child{border-radius:0 5px 5px 5px}`;

  class PianoKeyboard extends HTMLElement {
    static get observedAttributes() {
      return ["octaves", "params", "samplelist"];
    }

    constructor(a) {
      super();
      const keyclass = (key) =>
        [1, 3, 6, 8, 10].indexOf(key % 12) >= 0 ? "black" : "white";
      const keys = range(0, 24);
      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(mkdiv("style", {}, css));
      const key2midi = (key, octave = 3) => octave * 12 + key;
      const keyLi = (key) =>
        mkdiv("li", {
          id: key,
          "data-note": key2midi(key),
          class: keyclass(key),
          onmousedown: (e) => {
            const midi = key2midi(key);
            eventPipe.postMessage([0x90 | _activeChannel, key2midi(key), 120]);
            e.target.addEventListener(
              "mouseup",
              () => eventPipe.postMessage([0x80 | _activeChannel, midi, 88]),
              { once: true }
            );
          },
        });
      this.shadowRoot.appendChild(
        mkdiv(
          "ul",
          keys.map((key) => keyLi(key))
        )
      );
    }
  }
  window.customElements.define("piano-keyboard", PianoKeyboard);

  const mkKeyboard = mkdiv("div", {
    props: {
      eventPipe,
      get_active_channel_fn: () => _activeChannel,
    },
  });

  tb.attachTo(container);

  return {
    mkKeyboard,
    controllers,
    get activeChannel() {
      return _activeChannel;
    },
    set activeChannel(c) {
      _activeChannel = c;
    },
  };
}
