export function mkeventsPipe() {
  const queue = [];
  let listener = null;
  let draining = false;

  async function drain() {
    if (draining || !listener) {
      return;
    }
    draining = true;
    try {
      while (queue.length) {
        const next = queue.shift();
        try {
          await listener(next);
        } catch (error) {
          // A throwing listener must never wedge the pipe: log and continue.
          console.error("[eventsPipe] listener threw:", error);
        }
      }
    } finally {
      draining = false;
    }
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
