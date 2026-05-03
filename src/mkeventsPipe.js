export function mkeventsPipe() {
  const queue = [];
  let listener = null;
  let draining = false;

  async function drain() {
    if (draining || !listener) {
      return;
    }
    draining = true;
    while (queue.length) {
      const next = queue.shift();
      await listener(next);
    }
    draining = false;
  }

  return {
    onmessage(fn) {
      if (listener) {
        throw new Error("Event pipe only supports a single listener.");
      }
      listener = fn;
      void drain();
    },
    postMessage(item) {
      queue.push(item);
      void drain();
    },
  };
}
