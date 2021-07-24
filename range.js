export const range = (x, y) =>
  Array.from(
    (function* _(x, y) {
      while (x++ < y) yield x;
    })(x, y)
  );
