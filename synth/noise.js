import { mkdiv } from "../mkdiv/mkdiv.js";
export function manySpinners(freq, harmonicity) {
  const fl32s = new Float32Array(48050);
  for (let i = 0; i < 48050; i++) {
    let g = 0.8;
    fl32s[i] = g * Math.sin((((2 * 3.1415 * (i - 50)) / 48000) * freq) / 2);
    g *= harmonicity;
    fl32s[i] += g * Math.sin(((2 * 3.1415 * (i - 50)) / 48000) * freq * 3);
    g *= harmonicity;
    fl32s[i] += g * Math.sin(((2 * 3.1415 * (i - 50)) / 48000) * freq * 5);
    g *= harmonicity;
    fl32s[i] += g * Math.sin(((2 * 3.1415 * (i - 50)) / 48000) * freq * 7);
    g *= harmonicity;
  }
  return [fl32s.slice(0, 50), fl32s.slice(50)];
}

export function upupdowndown(spiners) {
  window.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "a":
        spiners.map((sp) => (sp.stride *= 14 / 12));
        break;
      case "s":
        spiners.map((sp) => (sp.stride *= 13 / 12));
        break;
      case "d":
        spiners.map((sp) => (sp.stride *= 10 / 12));
        break;
      case "f":
        spiners.map((sp) => (sp.stride *= 11 / 12));
        break;
      default:
        break;
    }
  });
}
export const mkkeyboard = (e) => {
  for (let i = 0x2a; i < 0x6c; i++)
    e.target.parentElement.appendChild(
      mkdiv(
        "button",
        {
          midi: i,
          onmousedown: (e) => {
            //keyon(e.target.getAttribute("midi"), 111);
            e.target.addEventListener("mouseup", keyoff, {
              once: true,
            });
          },
        },
        i.toString(16)
      )
    );
};
