import { midiread } from "./midiread.js";
export function readMidi(buffer) {
  const reader = bufferReader2(buffer);
  const { fgetc, btoa, read24, readString, read32, readVarLength, read16 } =
    reader;
  const chunkType = [btoa(), btoa(), btoa(), btoa()].join("");
  const headerLength = read32();
  const format = read16();
  const ntracks = read16();
  const division = read16();
  const tracks = [];
  const limit = buffer.byteLength;
  let lasttype;
  function readNextEvent() {
    const { fgetc, read24, readString, read32, readVarLength, read16 } = reader;
    let type = fgetc();
    if (type == null) return [];
    if ((type & 0xf0) == 0xf0) {
      switch (type) {
        case 0xff: {
          const meta = fgetc();
          const len = readVarLength();
          switch (meta) {
            case 0x51:
              return { tempo: read24() };
            default:
              return { meta, payload: readString(len) };
          }
        }
        case 0xf0:
        case 0xf7:
          return { sysex: readString(readVarLength()) };
        default:
          return { type, system: readString(readVarLength()) };
      }
    } else {
      let param;
      if (0 === (type & 0x80)) {
        param = type;
        type = lasttype;
      } else {
        param = fgetc();
        lasttype = type;
      }
      switch (type >> 4) {
        case 0x0c:
        case 0x0d:
          return {
            ch: type & 0x0f,
            cmd: (type >> 4).toString(16),
            channel: [type, param, 0],
          };
        default:
          return {
            ch: type & 0x0f,
            cmd: (type >> 4).toString(16),
            channel: [type, param, fgetc()],
          };
      }
    }
  }
  const presets = [];
  const tempos = [];
  while (reader.offset < limit) {
    fgetc(), fgetc(), fgetc(), fgetc();
    let t = 0;
    const mhrkLength = read32();
    const endofTrack = reader.offset + mhrkLength;
    const track = [];
    while (reader.offset < limit && reader.offset < endofTrack) {
      const delay = readVarLength();
      const nextEvent = readNextEvent();
      if (!nextEvent) break;
      if (nextEvent.eot) break;
      t += delay;
      if (nextEvent.tempo) {
        tempos.push({
          t,
          delay,
          track: track.length,
          ...nextEvent,
        });
      } else if (nextEvent.channel && nextEvent.channel[0] >> 4 == 0x0c) {
        presets.push({
          t,
          channel: nextEvent.channel[0] & 0x0f,
          pid: nextEvent.channel[1] & 0x7f,
        });
      } else {
        const evtObj = { offset: reader.offset, t, delay, ...nextEvent };
        track.push(evtObj);
      }
    }
    if (track.length) tracks.push(track);
    reader.offset = endofTrack;
  }
  return { division, tracks, ntracks, presets, tempos };
}
function bufferReader2(bytes) {
  let _offset = 0;
  const fgetc = () => bytes[_offset++];
  const read32 = () =>
    (fgetc() << 24) | (fgetc() << 16) | (fgetc() << 8) | fgetc();
  const read16 = () => (fgetc() << 8) | fgetc();
  const read24 = () => (fgetc() << 16) | (fgetc() << 8) | fgetc();
  function readVarLength() {
    let v = 0;
    let n = fgetc();
    v = n & 0x7f;
    while (n & 0x80) {
      n = fgetc();
      v = (v << 7) | (n & 0x7f);
    }
    return v;
  }
  function btoa() {
    const code = fgetc();
    return code >= 32 && code <= 122
      ? ` !"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[~]^_@abcdefghijklmnopqrstuvwxyz`.split(
          ""
        )[code - 32]
      : "";
  }
  const readString = (n) => {
    let str = "";
    while (n--) str += btoa();
    return str;
  };
  return {
    get offset() {
      return _offset;
    },
    set offset(o) {
      _offset = o;
    },
    fgetc,
    read32,
    read24,
    read16,
    readVarLength,
    readString,
    btoa,
  };
}

const echo = (str) => document.body.append(new Text(str));
