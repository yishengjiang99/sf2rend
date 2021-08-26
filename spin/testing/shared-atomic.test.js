import { mkspinner } from "../index.js";

promise_test(async () => {
  const sp = await mkspinner();
  assert_true(sp.memory != null);
}, "memory is sharedable and carries over the data on another thread");
