//let Module = Module || {};
mergeInto(LibraryManager.library, {
  emitHeader: function (pid, offset) {
    Module.onHeader(pid, Module.AsciiToString(offset));
  },
  emitSample: function (shdr, start, len) {
    Module.onSample(shdr, start, len);
  },
  emitZone: function (pid, ref) {
    Module.onZone(pid, ref, new Int16Array(Module.HEAPU8.buffer, ref, 60));
  },
  emitFilter: function (type, lo, hi) {},
});
