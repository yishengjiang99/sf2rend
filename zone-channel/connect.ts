initNavigatorMidiAccess();
async function initNavigatorMidiAccess() {
  let midiAccess = await navigator.requestMIDIAccess();
  if (midiAccess) {
    mkdiv(
      "select",
      {
        oninput: (e) => {
          Array.from(midiAccess.inputs.values()).find(
            (i) => i.name === e.target.value
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
  }
}
