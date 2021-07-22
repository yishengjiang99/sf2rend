mergeInto(LibraryManager.library, {
  emitHeader: function (type, offset) {
    Module.emitString("\n" + type + " " + Module.AsciiToString(offset)); //Module.HEAPU8.subarray(offset, offset + 20)
  },
  emitShdr: function (shdr, start, len) {
    Module.emitLink("[" + Module.AsciiToString(shdr) + "]", start, len);
  },
  emitZref: function (ref) {
    const base = new Int16Array(Module.HEAPU8.buffer, (ref += 120), 60);
    // Module.emitString("\n" + base.join(","));
  },
  emitFilter: function (type, lo, hi) {
    // Module.emitString("\n" + [type, lo, hi].join(","));
  },
});
