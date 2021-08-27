import { sfbkstream } from "./skip_to_pdta.js";
import { newSFZoneMap } from "./zoneProxy.js";

export function s16ArrayBuffer2f32(ab) {
  const b16 = new Int16Array(ab);

  const f32 = new Float32Array(ab.byteLength / 2);
  for (let i = 0; i < b16.length; i++) {
    //} of b16){
    f32[i] = b16[i] / 0x7fff;
  }
  return f32;
}

export async function load(url, { onHeader, onSample, onZone } = {}) {
  let heap, presetRef, shdrref, presetRefs;

  const Module = await import("./pdta.js");
  const module = await Module.default();
  const { pdtaBuffer, sdtaStart, fullUrl } = await sfbkstream(url);

  function devnull() {}
  const a = module._malloc(pdtaBuffer.byteLength);

  module.onHeader = onHeader || devnull;
  module.onSample = () => onSample || devnull;
  module.onZone = onZone || devnull;

  module.HEAPU8.set(pdtaBuffer, a);
  const memend = module._loadpdta(a);
  shdrref = module._shdrref();
  presetRefs = new Uint32Array(module.HEAPU32.buffer, module._presetRef(), 255);
  heap = module.HEAPU8.buffer.slice(0, memend);
  return {
    url: fullUrl,
    pdtaRef: a,
    presetRefs,
    heap,
    shdrref,
    sdtaStart,
  };
}

export function loadProgram(
  { url, presetRefs, heap, shdrref, sdtaStart },
  pid,
  bkid = 0
) {
  const rootRef = presetRefs[pid | bkid];
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
      shdrMap[mapKey].data = async () =>
        shdrMap[mapKey].pcm ||
        (await fetch(url, {
          headers: {
            Range: `bytes=${shdrMap[mapKey].range.join("-")}`,
          },
        }).then((res) => res.arrayBuffer()));
    }
    zMap.push({
      ...zone,
      get shdr() {
        return shdrMap[zone.SampleId];
      },

      calcPitchRatio(key, sr) {
        const rootkey =
          zone.OverrideRootKey > -1
            ? zone.OverrideRootKey
            : shdrMap[zone.SampleId].originalPitch;
        const samplePitch =
          rootkey * 100 + zone.CoarseTune * 100 + zone.FineTune * 1;
        const pitchDiff = (key * 100 - samplePitch) / 1200;
        const r =
          Math.pow(2, pitchDiff) * (shdrMap[zone.SampleId].sampleRate / sr);
        return r;
      },
    });
  }
  async function preload() {
    await Promise.all(
      Object.keys(shdrMap).map((sampleId) => shdrMap[sampleId].data())
    );
  }
  function zref2Zone(zref) {
    const zone = new Int16Array(heap, zref, 60);
    return newSFZoneMap(zref, zone);
  }
  function getShdr(SampleId) {
    const hdrRef = shdrref + SampleId * 46;
    const dv = heap.slice(hdrRef, hdrRef + 46);
    let [start, end, startloop, endloop, sampleRate] = new Uint32Array(
      dv,
      20,
      5
    );
    const [originalPitch] = new Uint8Array(dv, 20 + 5 * 4, 1);
    const range = [sdtaStart + start * 2, sdtaStart + end * 2 + 1];
    //      "bytes=" + (sdtaStart + start * 2) + "-" + (sdtaStart + end * 2 + 1);
    const loops = [startloop - start, endloop - start];
    return {
      nsamples: end - start + 1,
      range,
      loops,
      SampleId,
      sampleRate,
      originalPitch,
      url,
      hdrRef,
    };
  }
  return {
    zMap,
    preload,
    shdrMap,
    url,
    zref: rootRef,
    filterKV: function (key, vel) {
      return zMap.filter(
        (z) =>
          (vel == -1 || (z.VelRange.lo <= vel && z.VelRange.hi >= vel)) &&
          (key == -1 || (z.KeyRange.lo <= key && z.KeyRange.hi >= key))
      );
    },
  };
}
