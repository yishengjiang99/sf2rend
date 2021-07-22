import { sfbkstream } from "./skip_to_pdta.js";
import { newSFZoneMap, newSFZone } from "./zoneProxy.js";
import { s16ArrayBuffer2f32 } from "./s16tof32.js";

document.body.innerHTML += "<pre></pre>";
const pre = document.querySelector("pre");

function decodeasci(uint8arr) {
  return uint8arr.map((v) => (v >= 65 && v <= 122 ? asci[v - 65] : ""));
}
export async function load(url, { onString, onLink } = {}) {
  const Module = await import("./pdta.js");
  const module = await Module.default();
  const { pdtaBuffer, sdtaStart } = await sfbkstream(url);
  function devnull() {}
  // const { pdtaBuffer, sdtaStart } = await pdtaLoaded;
  const a = module._malloc(pdtaBuffer.byteLength);
  module.emitString = onString || devnull;
  module.emitLink = onLink || devnull;

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
    const cl = new Uint8Array(46);
    cl.set(new Uint8Array(dv));
    const [originalPitch] = new Uint8Array(dv, 20 + 5 * 4, 1);
    const range =
      "bytes=" + (sdtaStart + start * 2) + "-" + (sdtaStart + end * 2 + 1);
    const loops = [startloop - start, endloop - start];
    return {
      len: 4 * (end - start),
      range,
      loops,
      sampleRate,
      originalPitch,
      url,
      hdrRef,
      charClone: cl,
    };
  }
  const chmap = {};

  function zoneSampleHeaders(zref) {
    const shdrMap = {};
    const zMap = {};
    let zoneProxy;
    do {
      const zone = zref2Zone(zref);
      if (!zref || zone.SampleId == -1) break;
      zMap[zref] = zone;

      const mapKey = zMap[zref].SampleId;
      if (!shdrMap[mapKey]) {
        shdrMap[mapKey] = getShdr(zMap[zref].SampleId);
      }
      zref += 120;
    } while (true);
    return {
      zMap,
      shdrMap,
    };
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
    return newSFZoneMap(zref, zone);
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
    return { zref, zone: new Int16Array(module.HEAPU8.buffer, zz, 60) };
  }
  let aggShdrMap = {};
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
      });
    }
    return {
      shdr,
      zref2,
      zone,
      shdata: aggShdrMap[zone.SampleId],
    };

    //.console.log(zref2Zone(zref2), zref2Zone(zref3));
  }
  return {
    setProgram,
    noteOn,
    getShdr,
    getFont,
    zoneSampleHeaders,
    presetZoneRef,
    readModule: module,
  };
}
