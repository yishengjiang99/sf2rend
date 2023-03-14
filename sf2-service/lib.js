
//let Module = Module || {};
mergeInto(LibraryManager.library, {
  emitHeader: function (pid, bid, offset) {
    Module.onHeader(pid, bid, Module.AsciiToString(offset));
  },
  emitSample: function (shdr, id, offset) {
    Module.onSample(shdr, id, Module.AsciiToString(offset));
  },
  emitZone: function (pid, ref) {
    Module.onZone(pid, ref, new Int16Array(Module.HEAPU8.buffer, ref, 60));
  },
  emitFilter: function (type, lo, hi) {},
});

