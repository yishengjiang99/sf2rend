let checkboxes = Array.from(
  document.querySelectorAll("input[type='checkbox']")
);
let meters = Array.from(document.querySelectorAll("meter"));
let labels = Array.from(document.querySelectorAll("label"));

let sliders = Array.from(document.querySelectorAll("input[type='range"));
let dy = new Array(17).fill(0);
function animloop() {
  dy.map((vel, ch) => {
    if (vel != 0)
      meters[ch * 2 + 1].value = Math.min(
        parseInt(meters[ch * 2 + 1].value) + dy,
        127
      );
    // if( meters[ch*2+1].value>=127) {
    //   dy=-dy/4.0;
    // }
  });

  requestAnimationFrame(animloop);
}
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
          // channels[ch].setProgram(key);
          break;
        case 0xc: //change porg
          channels[ch].setProgram(key);
          break;
        case 8:
          channels[ch].keyOn(key, vel);
          break;
        case 9:
          if (vel == 0) {
            channels[ch].keyOff(key, vel);
          } else {
            channels[ch].keyOn(key, vel);
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
    };
  });
  requestAnimationFrame(animloop);

  return [midiInputs, midiOutputs];
}
