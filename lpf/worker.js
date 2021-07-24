import { mkLPF } from "./biquad.js";
const SHARED_STATE = {
  need_processing: 1,
  done_processing: 2,
  output_received: 0,
  initial_state: 0,
};
let BiQuad;

onmessage = async ({ data: { options, srb } }) => {
  if (options) {
    console.assert(options.FilterFC != null);
    BiQuad = await mkLPF(options);
    postMessage(BiQuad.biquad);
  }
  if (srb) {
    const input = new Float32Array(srb, 0, 128);
    const beep = new Int32Array(srb, 128 * 4, 1);
    Atomics.store(beep, 0, SHARED_STATE.initial_state);

    while (
      Atomics.wait(beep, 0, SHARED_STATE.need_processing) === "not-equal"
    ) {
      for (let i = 0; i < 128; i++) {
        input[i] = BiQuad.lpf(input[i]);
      }
      Atomics.store(beep, 0, SHARED_STATE.done_processing);
      Atomics.notify(beep, 0, 1);
    }
  }
};
