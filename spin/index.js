export class SpinNode extends AudioWorkletNode {
  static async init(ctx) {
    await ctx.audioWorklet.addModule(
      document.location.pathname + "spin-proc.js"
    );
    const { spArrs, renderNotify, worker } = await SpinNode.initWorker();
    console.log(renderNotify, "rendernotify");
    const inst = new SpinNode(ctx, {
      outputs: spArrs.map((sp) => sp.output),
      renderNotify,
      worker,
    });
    return inst;
  }

  static async initWorker() {
    const worker = new Worker("spin-worker.js", { type: "module" });
    return await new Promise((r) => {
      worker.onmessage = ({ data: { spinners, renderNotify } }) => {
        const spArrs = spinners.map((sp) => {
          const structArr = new Uint32Array(sp.struct);
          return {
            set pcmRef(ref) {
              structArr[0] = ref;
            },
            set loop(loop) {
              structArr[1] = loop[0];
              structArr[2] = loop[1];
            },
            output: sp.output,
            uiInput: sp.uiInput,
          };
        });

        r({
          renderNotify,
          spArrs,
          worker,
        });
      };
    });
  }
  constructor(ctx, { worker, outputs, renderNotify }) {
    super(ctx, "spin-proc", {
      numberOfInputs: 0,
      numberOfOutputs: 16,
      processorOptions: {
        outputs,
        renderNotify,
      },
    });
    this.worker = worker;
  }
  loadPCM(pcm, id) {
    this.worker.postMessage({ pcm, id });
  }
}
