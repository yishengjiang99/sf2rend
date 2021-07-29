import { mkdiv } from "https://unpkg.com/mkdiv/mkdiv.js";
const canvas = mkdiv("canvas", { width: 480, height: 320 });
canvas.addEventListener("click", () => canvas.requestPointerLock(), {
  once: true,
});

canvas.requestPointerLock =
  canvas.requestPointerLock || canvas.mozRequestPointerLock;

document.exitPointerLock =
  document.exitPointerLock || document.mozExitPointerLock;
