import Module from './build/pdta.js';
import {newSFZoneMap} from "./zoneProxy.js";

// s16ArrayBuffer2f32 function (from s16tof32.js)
function s16ArrayBuffer2f32(ab) {
  const b16 = new Int16Array(ab);

  const f32 = new Float32Array(ab.byteLength / 2);
  for (let i = 0; i < b16.length; i++) {
    f32[i] = b16[i] / 0xffff;
  }
  return f32;
}

// sfbkstream function (from sfbk-stream.js)
async function sfbkstream(url) {
  const res = await fetch(url, {headers: {Range: "bytes=0-6400"}}).catch(e => console.trace(e));
  if (!res.ok) return false;

  const ab = await res.arrayBuffer();

  const [infos, readOffset, meta, filesize] = readInfoSection(ab);
  const sdtaSize = readOffset.get32();
  if (bytesToString(readOffset.readNString(4)) !== "sdta")
    throw new Error("read failed " + url);
  console.assert(bytesToString(readOffset.readNString(4)) === "smpl");

  const sdtaStart = readOffset.offset;
  const pdtastart = sdtaStart + sdtaSize + 4;
  // RIFF's size field is fileLength-8, so `filesize-1` stops 8 bytes early and
  // the parser rejects the truncated shdr. Read through EOF.
  const pdtaHeader = {
    headers: {Range: "bytes=" + pdtastart + "-"},
  };

  return {
    nsamples: (pdtastart - sdtaStart) / 2,
    sdtaStart,
    infos,
    meta,
    pdtaBuffer: new Uint8Array(
      await (await fetch(url, pdtaHeader)).arrayBuffer()
    ),
    fullUrl: res.url,
  };
}

function readInfoSection(ab) {
  const infosection = new Uint8Array(ab);
  const r = readAB(infosection);
  const [riff, filesize, sig, list] = [
    r.readNString(4),
    r.get32(),
    r.readNString(4),
    r.readNString(4),
  ];
  let infosize = r.get32();
  console.assert(bytesToString(r.readNString(4)) === "INFO");

  const infos = [];
  console.assert(infosize < 10000);
  while (infosize >= 8) {
    const [sb, size] = [r.readNString(4), r.get32()];
    const section = bytesToString(sb);
    const val = bytesToString(r.readNString(size));

    infos.push([section, val]);
    infosize = infosize - 8 - size;
  }
  const meta = {
    riff: bytesToString(riff),
    sig,
  };

  console.assert(bytesToString(r.readNString(4)) === "LIST");
  return [infos, r, meta, filesize];
}

function bytesToString(ab) {
  let str = "";
  for (const b of Object.values(ab)) {
    if (!b) break;
    if (b < 10) str += b.toString();
    else str += String.fromCharCode(b);
  }
  return str;
}

function readAB(arb) {
  const u8b = new Uint8Array(arb);
  let _offset = 0;
  function get8() {
    return u8b[_offset++];
  }
  function getStr(n) {
    const str = u8b.subarray(_offset, _offset + n);
    _offset += n;
    return str;
  }
  function get32() {
    return get8() | (get8() << 8) | (get8() << 16) | (get8() << 24);
  }
  const get16 = () => get8() | (get8() << 8);
  const getS16 = () => {
    const u16 = get16();
    if (u16 & 0x8000) return -0x10000 + u16;
    else return u16;
  };
  const readN = (n) => {
    const ret = u8b.slice(_offset, _offset + n);
    _offset += n;
    return ret;
  };
  function varLenInt() {
    let n = get8();
    while (n & 0x80) {
      n = get8();
    }
    return n;
  }
  const skip = (n) => {
    _offset = _offset + n;
  };
  const read32String = () => getStr(4);
  const readNString = (n) => getStr(n);
  return {
    skip,
    get8,
    get16,
    getS16,
    readN,
    read32String,
    varLenInt,
    get32,
    readNString,
    get offset() {
      return _offset;
    },
    set offset(n) {
      _offset = n;
    },
  };
}

// SF2Service class (from sf2.js)
export default class SF2Service {
  constructor(url) {
    this.url = url;
  }
  async load({onHeader, onSample, onZone} = {}) {
    const module = await Module();
    const {pdtaBuffer, sdtaStart, infos} = await sfbkstream(this.url);
    const programNames = [];

    function devnull() { }
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
    const memend = module._loadpdta(pdtaRef, pdtaBuffer.byteLength);
    if (!memend) {
      module._free(pdtaRef);
      throw new Error("pdta parse failed");
    }
    const instRef = (instid) => module._instRef(instid);
    const shdrref = module._shdrref(pdtaRef);
    const presetRefs = new Uint32Array(
      module.HEAPU32.buffer,
      module._presetRef(),
      256
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
      zonesFor: (pid, bank) => module._sf2_zones_for(pid, bank),
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
    const {presetRefs, heap, shdrref, sdtaStart, programNames, instRef, zonesFor} =
      this.state;
    const rootRef =
      bkid === 0 || bkid === 128
        ? presetRefs[pid | bkid]
        : zonesFor(pid, bkid);
    if (!rootRef) return null;
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
          const r =
            Math.pow(2, pitchDiff);
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
      if (!zref || zref & 1 || zref + 120 > heap.byteLength) return null;
      const zone = new Int16Array(heap, zref, 60);
      return newSFZoneMap(zref - gRefRoot, zone);
    }
    function getShdr(SampleId) {
      const hdrRef = shdrref + SampleId * 46;
      const dv = heap.slice(hdrRef, hdrRef + 48);

      const nameStr = readASCIIHIlariously(heap, hdrRef);

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
                    originalPitch: shdr.originalPitch
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
    return "";
  }
}
