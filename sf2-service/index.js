import { sfbkstream } from "./skip_to_pdta.js";
import { newSFZoneMap } from "./zoneProxy.js";
import { s16ArrayBuffer2f32 } from "./s16tof32.js";
export default class SF2Service {
  constructor(url) {
    this.url = url;
  }
  async load({ onHeader, onSample, onZone } = {}) {
    const Module = await import("./pdta.js");
    const module = await Module.default();
    const { pdtaBuffer, sdtaStart, fullUrl, infos } = await sfbkstream(
      this.url
    );
    const programNames = [];

    function devnull() {}
    const pdtaRef = module._malloc(pdtaBuffer.byteLength);

    module.onHeader = (pid, bid, name) => {
      programNames[pid | bid] = name;
      if (onHeader) onHeader(pid, bid, name);
    };
    module.onSample = (...args) => {
      if (onSample) onSample(args);
    };
    module.onZone = onZone || devnull;

    module.HEAPU8.set(pdtaBuffer, pdtaRef);
    const memend = module._loadpdta(pdtaRef);
    const shdrref = module._shdrref(pdtaRef);
    const presetRefs = new Uint32Array(
      module.HEAPU32.buffer,
      module._presetRef(),
      255
    );
    const heap = module.HEAPU8.buffer.slice(0, memend);
    const heapref = new WeakRef(heap);
    this.state = {
      pdtaRef,
      heapref,
      presetRefs,
      heap,
      shdrref,
      programNames,
      sdtaStart,
      infos,
    };
  }
  get meta() {
    return this.state.infos;
  }
  get programNames() {
    return this.state.programNames;
  }
  get presets() {
    return this.state.presetRefs;
  }
  loadProgram(pid, bkid) {
    const { presetRefs, heap, shdrref, sdtaStart, programNames } = this.state;
    const rootRef = presetRefs[pid | bkid];

    const zMap = [];
    const shdrMap = {};
    let url = this.url;
    for (
      let zref = rootRef, zone = zref2Zone(zref);
      zone && zone.SampleId != -1;
      zone = zref2Zone((zref += 120))
    ) {
      const mapKey = zone.SampleId;
      if (!shdrMap[mapKey]) {
        shdrMap[mapKey] = getShdr(zone.SampleId);
      }
      zMap.push({
        ...zone,
        get shdr() {
          return shdrMap[zone.SampleId];
        },
        get pcm() {
          return shdrMap[zone.SampleId].data();
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
      const ascii = new Uint8Array(dv, 0, 20);

      let nameStr = "";
      for (const b of ascii) {
        if (!b) break;
        nameStr += String.fromCharCode(b);
      }
      const [start, end, startloop, endloop, sampleRate] = new Uint32Array(
        dv,
        20,
        5
      );
      const [originalPitch] = new Uint8Array(dv, 20 + 5 * 4, 1);
      const range = [sdtaStart + start * 2, sdtaStart + end * 2 + 1];
      const loops = [startloop - start, endloop - start];
      return {
        nsamples: end - start + 1,
        range,
        loops,
        SampleId,
        sampleRate,
        originalPitch,
        url,
        name: nameStr,
        data: async () => {
          if (shdrMap[SampleId].pcm) return shdrMap[SampleId].pcm;
          const res = await fetch(url, {
            headers: {
              Range: `bytes=${shdrMap[SampleId].range.join("-")}`,
            },
          });
          const ab = await res.arrayBuffer();
          shdrMap[SampleId].pcm = s16ArrayBuffer2f32(ab);
          return shdrMap[SampleId].pcm;
        },
      };
    }
    return {
      zMap,
      preload,
      shdrMap,
      url: this.url,
      zref: rootRef,
      get name() {
        return programNames[pid | bkid];
      },
      filterKV: function (key, vel) {
        return zMap.filter(
          (z) =>
            (vel == -1 || (z.VelRange.lo <= vel && z.VelRange.hi >= vel)) &&
            (key == -1 || (z.KeyRange.lo <= key && z.KeyRange.hi >= key))
        );
      },
    };
  }
}
