import { mkdiv } from "../mkdiv/mkdiv.js";
import { navhead, eventPipe, ui } from "./index.js";

export async function initNavigatorMidiAccess() {
  let midiAccess = await navigator.requestMIDIAccess();
  if (!midiAccess) {
    // eslint-disable-next-line no-unused-vars
    midiAccess = await new Promise((resolve, reject) => {
      mkdiv(
        "button",
        {
          onclick: async (e) => {
            e.target.parentElement.removeChild(e.target);
            resolve(await navigator.requestMIDIAccess());
          },
        },
        "link midi"
      ).attachTo(navhead);
    });
  }
  if (midiAccess) {
    mkdiv(
      "select",
      {
        oninput: (e) => {
          Array.from(midiAccess.inputs.values()).find(
            (input) => input.name === e.target.value
          ).onmidimessage = ({ data }) => eventPipe.postMessage(data);
        },
      },
      [
        mkdiv("option", { value: null }, "select input"),
        ...Array.from(midiAccess.inputs.values()).map((input) =>
          mkdiv(
            "option",
            {
              value: input.name,
              text: input.name,
            },
            input.name
          )
        ),
      ]
    ).attachTo(navhead);
    Array.from(midiAccess.inputs.values())[0].onmidimessage = ({ data }) => {
      data[0] |= ui.activeChannel;
      eventPipe.postMessage(data);
    };
  }
}
