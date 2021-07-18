window.addEventListener(
  "keydown",
  () => {
    const { port1, port2 } = new MessageChannel();
    bindMidiAccess(port1);
    port2.onmessage = ({ data }) => {
      const [a, b, c] = data;
      const stat = a >> 4;
      const ch = a & 0x0f;
      const key = b & 0x7f,
        vel = c & 0x7f;
      switch (stat) {
        case 0xa: //chan set
          sliders[ch * 2 + 1].value = key;
          break;
        case 0xc: //change porg
          labels[ch * 2 + 1].value = key;
          break;
        case 8:
          checkboxes[ch].removeAttribute("checked");
          meters[ch * 2].value = "0";
          dy[ch] = -1 * vel;
          break;
        case 9:
          if (vel == 0) {
            checkboxes[ch].removeAttribute("checked");
            meters[ch * 2].value = 0;
            dy[ch] = -1 * vel;
          } else {
            checkboxes[ch].setAttribute("checked", true);
            meters[ch * 2].value = key;
            dy[ch] = vel;
          }
          break;
        default:
          break;
      }
    };
  },
  { once: true }
);
async function bindMidiAccess(port, tee) {
  const midiAccess = await navigator.requestMIDIAccess();
  const midiInputs = Array.from(midiAccess.inputs.values());
  const midiOutputs = Array.from(midiAccess.outputs.values());
  midiInputs.forEach((input) => {
    input.onmidimessage = ({ data, timestamp }) => {
      if (port && data[0] & 0x80) port.postMessage(data);
      if(tee) tee(data)
    };
  });
  return [midiInputs, midiOutputs];
}
