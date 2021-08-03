class SpinProc extends AudioWorkletProcessor {
  constructor(options) {
    super(options);
    const { outputs, renderNotify } = options.processorOptions;
    this.outputs = outputs;
    this.renderNotify = renderNotify;
  }
  process(_, outputBufs) {
    outputBufs.forEach((ob, idx) => {
      ob[0].set(this.outputs[idx]);
    });
    Atomics.store(this.renderNotify, 0, 1);
    Atomics.notify(this.renderNotify, 0, 1);
    return true;
  }
}
registerProcessor("spin-proc", SpinProc);
