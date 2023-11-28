import { sfbkstream } from "./sfbk-stream.js";
import Module from "./pdta.js";
import { newSFZoneMap } from "./zoneProxy.js";
import { s16ArrayBuffer2f32 } from "./s16tof32.js";
export default class SF2Service {
  constructor(url) {
    this.url = url;
  }
  async load({ onHeader, onSample, onZone } = {}) {
    const module = await Module();
    const { pdtaBuffer, sdtaStart, infos } = await sfbkstream(this.url);
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
    const instRef = (instid) => module._instRef(instid);
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
      instRef,
      presetRefs,
      heap,
      shdrref,
      programNames,
      sdtaStart,
      infos,
    };
    return this.state;
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
    const { presetRefs, heap, shdrref, sdtaStart, programNames, instRef } =
      this.state;
    const rootRef = presetRefs[pid | bkid];
    const gRefRoot = presetRefs[0];

    const zMap = [];
    const shdrMap = {};
    let url = this.url;
    for (
      let zref = rootRef, zone = zref2Zone(zref);
      zone && zone.SampleId != -1 && zone.Dummy >= 0;
      zone = zref2Zone((zref += 120))
    ) {
      if (zone.SampleId < 0) continue;
      const mapKey = zone.SampleId;
      if (!shdrMap[mapKey]) {
        shdrMap[mapKey] = getShdr(zone.SampleId);
      }
      zMap.push({
        pid,
        bkid,
        ...zone,
        get shdr() {
          return shdrMap[zone.SampleId];
        },
        // get pcm() {
        //   return shdrMap[zone.SampleId].data();
        // },
        get instrument() {
          const instREf = instRef(zone.Instrument);
          return readASCIIHIlariously(heap, instREf);
        },
        calcPitchRatio(key, sr) {
          const rootkey =
            zone.OverrideRootKey > -1
              ? zone.OverrideRootKey
              : shdrMap[zone.SampleId].originalPitch;
          const samplePitch =
            rootkey * 100 + zone.CoarseTune * 100 + zone.FineTune * 1;
          const pitchDiff = (key * 100 - samplePitch) / 1200;
          const r = Math.pow(2, pitchDiff); // * (shdrMap[zone.SampleId].sampleRate / sr);
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
      return newSFZoneMap(zref - gRefRoot, zone);
    }
    function getShdr(SampleId) {
      const hdrRef = shdrref + SampleId * 46;
      const dv = heap.slice(hdrRef, hdrRef + 48);

      const nameStr = readASCIIHIlariously(heap, hdrRef);
      const dvv = new DataView(dv);

      const [start, end, startloop, endloop, sampleRate] = new Uint32Array(
        dv,
        20,
        5
      );
      const [originalPitch, pitchCorrection] = new Uint8Array(
        dv,
        20 + 5 * 4,
        2
      );
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
      pid,
      bkid,
      preload,
      shdrMap,
      url: this.url,
      zref: rootRef,
      get sampleSet() {
        return new Set(zMap.map((z) => z.SampleId));
      },
      fetch_drop_ship_to(port) {
        return Promise.all(
          Array.from(new Set(zMap.map((z) => z.SampleId)))
            .map((sampleId) => this.shdrMap[sampleId])
            .map((shdr) =>
              fetch(url, {
                headers: {
                  Range: `bytes=${shdr.range.join("-")}`,
                },
              }).then((res) => {
                port.postMessage(
                  {
                    segments: shdrSegment(),
                    stream: res.body,
                  },
                  [res.body]
                );
                return res.body.closed;

                function shdrSegment() {
                  return {
                    sampleId: shdr.SampleId,
                    nSamples: (shdr.range[1] + 1 - shdr.range[0]) / 2,
                    loops: shdr.loops,
                    sampleRate: shdr.sampleRate,
                    originalPitch: shdr.originalPitch,
                  };
                }
              })
            )
        );
      },
      get name() {
        return programNames[pid | bkid];
      },
      filterKV: function (key, vel) {
        const f = zMap.filter(
          (z) =>
            (vel == -1 || (z.VelRange.lo <= vel && z.VelRange.hi >= vel)) &&
            (key == -1 || (z.KeyRange.lo <= key && z.KeyRange.hi >= key))
        );
        return f;
      },
    };
  }
}
function readASCIIHIlariously(heap, instREf) {
  try {
    const dv = heap.slice(instREf, instREf + 20);
    const ascii = new Uint8Array(dv, 0, 20);
    let nameStr = "";
    for (const b of ascii) {
      if (!b) break;
      nameStr += String.fromCharCode(b);
    }
    return nameStr;
  } catch (e) {
    return "xxxxdasfsaf";
  }
}
