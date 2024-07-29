import * as module from "./yofi.wasm.js";
import {readFileSync, read, openSync} from 'fs';
import {readSync} from "fs";
const m = new WebAssembly.Module(module.wasmbin);
const ll = new WebAssembly.Instance(m, {
	env: {
		memory: new WebAssembly.Memory({initial: 41})
	}
});
const qq = ll.exports.instance;
const ffd = openSync('song.mid', "r");
const writec = (c) => ll.exports.queue_write(qq, c & 0xff);
const aa = new Uint8Array(readFileSync("song.mid"));
let i = 0;

for (i = 0;i < aa.byteLength;i++) {
	ll.exports.queue_write(ll, aa[i]);
}
let offset = 0;
const fccc = () => aa[offset++]
const {btoa, fgetc, read32, read24, readString, readVarLength, read16} =
	bufferReader2(fccc);

const chunkType = [btoa(), btoa(), btoa(), btoa()].join("");

const chunkLength = read32();
const [
	format, ntracks, division
] = [read16(), read16(), read16()];

let ticksPerSecond;
if (division & 0x8000) {
	const ffm = 0x100 - (division >> 8)
	const ticksPerFrame = division & 0xff;
	console.log(ffm, ticksPerFrame)
	ticksPerSecond = ticksPerFrame * ffm;
} else {
	ticksPerSecond = division;
}

const headerInfo = {chunkType, ntracks, format, ticksPerSecond};
const tracks = [];

const DEFAULT_TIMEBASE = {
	relative_ts: 4, numerator: 4, denum: 4, ticksPerBeat: ticksPerSecond, eigthNotePerBeat: 8
};

for (let i = 0;i < ntracks;i++) {
	const chunkType = [btoa(), btoa(), btoa(), btoa()].join("");
	const chunkLength = read32(); const end = offset + chunkLength;
	let t = 0;
	while (offset < end) {
		let event;
		const delay = readVarLength();
		t += delay;
		let type = fgetc(), lasttype;
		if ((type & 0xf0) === 0xf0) {
			console.log(sysexEvent(type, event, delay), t);
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
					console.log("prog changes", t, type & 0x0f, param);
					break;
				case 0x0d:
					console.log('cp', type >> 4, t, (type & 0xf0) >> 4, param);
					break;
				case 0x0a: console.log('0x0a', type >> 4, t, type & 0x0f, fgetc()); break;
				case 0x0b: console.log('midi cc', type >> 4, type & 0x0f, fgetc()); break;
				case 0x0e: console.log('0x0e', type >> 4, type & 0x0f, fgetc()); break;
				default:
					fgetc();
					break;
			}
		}


	}
}
function sysexEvent(type, event) {
	switch (type) {
		case 0xff: {
			const meta = fgetc();
			const len = readVarLength();
			switch (meta) {
				case 0x21:
					return {port: fgetc()};
				case 0x51:
					return {tempo: read24()};
				case 0x58: //0xFF 0x58 0x04 [
					// 0x04 0x02 0x18 0x08
					const [numerator, denomP2, ticksPerBeat, eigthNotePerBeat] = [fgetc(), fgetc(), fgetc(), fgetc()];
					const denum = Math.pow(2, denomP2);
					const relative_ts = numerator / denum * 4;
					return {relative_ts, numerator, denum, ticksPerBeat, eigthNotePerBeat};
				case 0x59:
					return {meta, payload: [fgetc(), fgetc()]};
				default:
					return {meta, payload: readString(len), len};
			}
		}
		case 0xf0:
		case 0xf7:
			return {sysex: readString(readVarLength())};
		default:
			return {type, system: readString(readVarLength())};
	}
}

function bufferReader2(fgetc) {
	let _offset = 0;
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
			: code;
	}
	const readString = (n) => {
		let str = "";
		while (n--) str += btoa();
		return str;
	};
	return {
		get offset() {
			event = _offset;
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
