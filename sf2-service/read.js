import { sfbkstream } from "./skip_to_pdta.js";
import { newSFZoneMap } from "./zoneProxy.js";
import { s16ArrayBuffer2f32 } from "./s16tof32.js";

export async function load(url, { onHeader, onSample, onZone } = {}) {
  const Module = await import("./pdta.js");
  const module = await Module.default();
  const { pdtaBuffer, sdtaStart } = await sfbkstream(url);
  function devnull() {}
  const a = module._malloc(pdtaBuffer.byteLength);
  module.onHeader = onHeader || devnull;
  module.onSample = onSample || devnull;
  module.onZone = onZone || devnull;

  module.HEAPU8.set(pdtaBuffer, a);
  module.ccall("loadpdta", null, ["number"], [a], null);
  const shdrref = module.ccall("shdrref", "number", [], [], null);
  const presetRef = module.ccall("presetRef", "number,", [], [], null);
  function presetZoneRef(pid, bankId) {
    const refIndex = presetRef + (pid | bankId);
    const zoneRef = module.HEAPU32[refIndex >> 2];
    return zoneRef;
  }
  function getShdr(samleId) {
    const hdrRef = shdrref + samleId * 46;
    const dv = module.HEAPU8.buffer.slice(hdrRef, hdrRef + 46);
    const [start, end, startloop, endloop, sampleRate] = new Uint32Array(
      dv,
      20,
      5
    );

    const [originalPitch] = new Uint8Array(dv, 20 + 5 * 4, 1);
    const range = [sdtaStart + start * 2, sdtaStart + end * 2 + 1];
    //      "bytes=" + (sdtaStart + start * 2) + "-" + (sdtaStart + end * 2 + 1);
    const loops = [startloop - start, endloop - start];
    return {
      byteLength: 4 * (end - start + 1),
      range,
      loops,
      sampleRate,
      originalPitch,
      url,
      hdrRef,
    };
  }
  const chmap = {};
  let aggShdrMap = {};

  function loadProgram(pid, bkid = 0) {
    const rootRef = presetZoneRef(pid, bkid);
    const zMap = [];
    const f32buffers = {};
    const shdrMap = {};
    const shdrDataMap = {};
    for (
      let zref = rootRef, zone = zref2Zone(zref);
      zone && zone.SampleId != -1;
      zone = zref2Zone((zref += 120))
    ) {
      const mapKey = zone.SampleId;
      if (!shdrMap[mapKey]) {
        shdrMap[mapKey] = getShdr(zone.SampleId);
        shdrMap[mapKey].data = () =>
          shdrMap[mapKey].pcm ||
          fetch(shdrMap[mapKey].url, {
            headers: {
              Range: `bytes=${shdrMap[mapKey].range.join("-")}`,
            },
          })
            .then((res) => res.arrayBuffer())
            .then((ab) => {
              shdrMap[mapKey].pcm = s16ArrayBuffer2f32(ab);
              return shdrMap[mapKey].pcm;
            });
      }
      zMap.push({
        ...zone,
        get shdr() {
          return shdrMap[this.SampleId];
        },
        get pcm() {
          return shdrMap[this.SampleId].data();
        },
      });
    }
    async function preload() {
      await Promise.all(
        Object.keys(shdrMap).map((sampleId) => shdrMap[sampleId].data())
      );
    }

    var wkref = zMap;
    return {
      zMap,
      preload,
      shdrMap,
      zref: rootRef,
      filterKV: (key, vel) =>
        wkref.filter(
          (z) =>
            (vel == -1 || (z.VelRange.lo <= vel && z.VelRange.hi >= vel)) &&
            (key == -1 || (z.KeyRange.lo <= key && z.KeyRange.hi >= key))
        ),
    };
  }

  /**
   * memset(retval, zone_t*)
   */
  function zref2Zone(zref) {
    const zone = new Int16Array(module.HEAPU8.buffer, zref, 60);
    return newSFZoneMap(zref, zone);
  }

  function getFont(pid, bkid, key, vel) {
    const zref = module.ccall(
      "findByPid",
      "number",
      ["u16", "u16"],
      [pid, bkid],
      null
    );
    const zref2 = module.ccall(
      "filterForZone",
      "number",
      ["number", "u8", "u8"],
      [zref, key, vel],
      null
    );
    const zone = zref2Zone(zref2);
    const shdr = getShdr(zone.SampleId);
    if (!aggShdrMap[zone.SampleId]) {
      aggShdrMap[zone.SampleId] = fetch(shdr.url, {
        headers: { Range: shdr.range },
      })
        .then((res) => res.arrayBuffer())
        .then((ab) => s16ArrayBuffer2f32(ab));
    }
    return {
      shdr,
      zref2,
      zone,
      shdata: aggShdrMap[zone.SampleId],
    };
  }
  return {
    getShdr,
    getFont,
    loadProgram,
    presetZoneRef,
  };
}
