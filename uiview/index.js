
let checkboxes = Array.from(document.querySelectorAll("input[type='checkbox']"));
let meters = Array.from(document.querySelectorAll("meter"));
let labels = Array.from(document.querySelectorAll("label"));

let sliders = Array.from(document.querySelectorAll("input[type='range']"));
let dy = new Array(17).fill(0);
let animationFrameTimer;
function animloop() {
  dy.map((vel, ch) => {
    if (vel != 0) {
      meters[ch * 2 + 1].value = meters[ch * 2 + 1].value * 0.9;
    }
  });

  return requestAnimationFrame(animloop);
}
