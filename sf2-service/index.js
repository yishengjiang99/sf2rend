import { sfbkstream } from "./skip_to_pdta.js";
import { newSFZoneMap, newSFZone } from "../zoneProxy.js";

export async function load(url) {
  const Module = await import("./pdta.js");
  const module = await Module.default();
  const { pdtaBuffer, sdtaStart } = await sfbkstream(url);
  // const { pdtaBuffer, sdtaStart } = await pdtaLoaded;
  const a = module._malloc(pdtaBuffer.byteLength);
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
    const range =
      "bytes=" + (sdtaStart + start * 2) + "-" + (sdtaStart + end * 2 + 1);
    const loops = [startloop - start, endloop - start];
    return { range, loops, sampleRate, originalPitch, url };
    //		return [start, end, startloop, endloop, sampleRate, originalPitch, pitchCorrection];
  }
  const chmap = {};
  function* zoneSampleHeaders(zref) {
    let lastSampleId;
    const shdrMap = new WeakMap();
    for (
      let zoneProxy = zref2Zone(zref);
      zoneProxy.SampleId >= 0;
      zoneProxy = zref2Zone((zref += 120))
    ) {
      const mapKey = { sid: zoneProxy.SampleId };
      yield {
        zone: zoneProxy,
        get shdr() {
          if (!shdrMap.has(mapKey)) {
            shdrMap.set(mapKey, getShdr(zoneProxy.SampleId));
            return shdrMap.get(mapKey);
          }
          return null;
        },
      };
    }
    return;
  }

  function setProgram(pid, channelId) {
    const bkid = channelId == 9 ? 128 : 0;
    chmap[channelId] = module.ccall(
      "findByPid",
      "number",
      ["u16", "u16"],
      [pid, bkid],
      null
    );
    return chmap[channelId];
  }
  /**
   * memset(retval, zone_t*)
   */
  function zref2Zone(zref) {
    const zone = new Int16Array(module.HEAPU8.buffer, zref, 60);
    return newSFZoneMap(zone);
  }
  function noteOn(chid, key, vel) {
    const zref = chmap[chid];
    const zz = module.ccall(
      "filterForZone",
      "number",
      ["number", "u8", "u8"],
      [zref, key, vel],
      null
    );
    return newSFZone(new Int16Array(module.HEAPU8.buffer, zz, 60));
  }

  return {
    setProgram,
    zref2Zone,
    noteOn,
    presetZoneRef,
    zoneSampleHeaders,
  };
}
