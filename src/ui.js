import {
  mkdiv,
  mkdiv2,
  wrapDiv,
  mksvg,
  mk_fa_btn,
  wrapVertical,
  wrapList,
} from "../mkdiv/mkdiv.js";
import {
  midi_ch_cmds,
  range,
  midi_effects as effects,
  DRUMSCHANNEL,
} from "./constants.js";
import { fa_switch_btn, grid_tbl } from "./btns.js";
import {
  attributeKeys,
  defZone,
  newSFZoneMap,
  newSFZone,
} from "../sf2-service/zoneProxy.js";

const rowheight = 40;
const pixelPerSec = 12;
let ControllerState;
let activeChannel = 0;

export function mkui(
  eventPipe,
  container,
  { onTrackClick, onTrackDoubleClick, onEditZone }
) {
  class TrackUI {
    constructor(idx, cb) {
      this.idx = idx;
      this.nameLabel = mkdiv2({
        tag: "input",
        type: "text",
        autocomplete: "off",
        onfocus: (e) => (e.target.value = ""),
        list: idx == DRUMSCHANNEL ? "drums" : "programs",
        onchange: (e) => {
          const pid = Array.from(e.target.list.options).findIndex(
            (d) => d.value == e.target.value
          );
          const change_program = midi_ch_cmds.change_program;
          const bkid = idx == DRUMSCHANNEL ? 128 : 0;
          cb([change_program | idx, pid, bkid]);
          e.target.blur();
        },
      });
      this.led = mkdiv("input", {
        class: "onoff_indicate",
        type: "checkbox",
        name: "ch_" + idx,
      });

      const meterDiv = mkdiv(
        "span",
        {
          style: "display:grid; grid-template-columns:1fr 1fr",
          class: "instrPanels",
        },
        [
          this.led,
          mkdiv("meter", {
            min: 1,
            max: 127,
            id: "mkey",
            aria: "key",
          }),
          mkdiv("meter", {
            type: "range",
            id: "velin",
            min: 1,
            max: 128,
            step: 1,
            aria: "vel",
            value: 60,
          }),
        ]
      );
      this.zoneEdit = mkdiv("div", [
        `<label for="modal-control${idx}" class="toggle"> <i class='fas fa-edit'></label>`,
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
        mkdiv("input", {
          min: 1,
          max: 128,
          value: 100,
          step: 1,
          id: "vol",
          type: "range",
          oninput: (e) => cb([0xb0 | idx, 7, e.target.value]),
        }),
      ]);
      const ampshow = mkdiv("div", {
        class: "amp-indicate",
      });
      const inst_header_section = mkdiv(
        "div",
        {
          style:
            "display:grid; grid-template-columns:1fr 2fr 1fr; height:120px",
        },
        [
          mkdiv(
            "span",
            {
              style: "text-align:center; padding:10%",
            },
            [`<i class='fas fa-play'>`]
          ),
          mkdiv(
            "span",
            {
              style: "display:flex;flex-direction:column",
            },
            [this.nameLabel, ctslsDiv, ampshow]
          ),
          mkdiv("span", [mkdiv("button", `<i class='fas fa-gears'>`)]),
        ]
      );

      const sequencer = mkdiv("div", {});
      this.container = mkdiv(
        "div",
        { style: "width:100%; display:grid; grid-template-columns:1fr 5fr" },
        [inst_header_section, sequencer]
      );

      this.meters = container.querySelectorAll("meter");

      this.sliders = Array.from(
        container.querySelectorAll("input[type='range']")
      );

      this._active = false;
      this._midi = null;
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
    set midi(v) {
      this._midi = v;
      //this.meters[0].value = v;
    }
    get midi() {
      return this._midi;
    }
    set CC({ key, value }) {
      switch (key) {
        case effects.volumecoarse:
          this.sliders[0].value = value;
          break;
      }
    }
    set velocity(v) {
      //this.meters[1].value = v;
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
    set zone(z) {
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
          mkdiv("ul", [
            mkdiv("input", {
              role: "button",
              value: "save",
              type: "submit",
            }),
            ...Array.from(this._zone.arr).map((attr, index) =>
              mkdiv("tr", [
                mkdiv(
                  "td",
                  {
                    class: attr === defZone[index] ? "hidden" : "",
                  },
                  attributeKeys[index]
                ),
                mkdiv("td", {}, [
                  mkdiv("input", {
                    value: attr,
                    name: index,
                    class: attr === defZone[index] ? "hidden" : "",
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
    trackrow.container.addEventListener("click", (e) => {
      onTrackClick(i, e);
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
            eventPipe.postMessage([0x90 | _activeChannel, midi, 120]);
            e.target.addEventListener(
              "mouseup",
              () =>
                refcnt >= 0 &&
                eventPipe.postMessage([0x80 | _activeChannel, midi, 88]),
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
