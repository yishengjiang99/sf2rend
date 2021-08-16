function AUnitPool() {
  const pool = [];
  function dequeue(pcm, shdr, zone) {
    if (pool.length < 1) return null;
    for (const i in pool) {
      if (pool[i].spinner.zhref == shdr.hdrRef) {
        const r = pool[i];
        r.volEG.zone = zone;
        r.spinner.reset();
        pool.splice(i, 1);
        return r;
      }
    }
    for (const i in pool) {
      if (pool[i].spinner.flsize <= pcm.byteLength) {
        const r = pool[i];
        r.volEG.zone = zone;
        r.spinner.reset();
        pool.splice(i, 1);
        return r;
      }
    }
    return null;
  }
  function enqueue(unit) {
    pool.push(unit);
  }
  return {
    dequeue,
    enqueue,
    get _pool() {
      return pool;
    },
    empty: () => pool.length == 0,
  };
}
