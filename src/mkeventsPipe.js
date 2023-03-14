export function mkeventsPipe() {
  const _arr = [];
  let _fn;
  return {
    onmessage(fn) {
      _fn = fn;
    },
    postMessage(item) {
      _arr.push(item);
      if (_fn) _fn(_arr.shift());
    },
  };
}
