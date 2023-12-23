import { mkdiv } from "../mkdiv/mkdiv.js";

export async function initNavigatorMidiAccess({
  container,
  eventPipe,
  inputChannel,
}) {
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
      ).attachTo(container);
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
    ).attachTo(container);
    Array.from(midiAccess.inputs.values())[0].onmidimessage = ({ data }) => {
      data[0] |= inputChannel;
      eventPipe.postMessage(data);
    };
  }
}
