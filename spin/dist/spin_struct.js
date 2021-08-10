import { wasmbin } from "./spin.wasm.js";
const channels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
export function mkstruct(exports, buffer, ref) {
    return {
        spref: ref,
        spin: function (n = 128) {
            exports.spin(ref, n);
            return new Float32Array(buffer, this.arr.outputRef, this.loopEnd);
        },
        reset: exports.reset,
        struct: new DataView(buffer, ref, 12 * 4),
        get arr() {
            const [inputRef, outputRef, phase, pad1, loopStart, loopEnd] = new Uint32Array(buffer, ref, 6);
            const [stride, strideDest, filter, filterDest, amp, ampDest] = new Float32Array(buffer, ref + 24, 6);
            return {
                inputRef,
                outputRef,
                phase,
                pad1,
                loopStart,
                loopEnd,
                stride,
                strideDest,
                filter,
                filterDest,
                amp,
                ampDest,
            };
        },
        get input() {
            return new Float32Array(buffer, this.inputRef, this.loopEnd);
        },
        get outputRef() {
            return this.arr.outputRef;
        },
        get output() {
            return new Float32Array(buffer, this.outputRef, 1024);
        },
        get loopStart() {
            return this.arr.loopStart;
        },
        set loopStart(n) {
            this.struct.setUint32(n, 3 * 4, true);
        },
        get loopEnd() {
            return this.arr.loopEnd;
        },
        set loopEnd(n) {
            this.struct.setUint32(n, 4 * 4, true);
        },
        set inputRef(inputRef) {
            this.struct.setUint32(ref, inputRef, true);
        },
        get inputRef() {
            return this.arr.inputRef;
        },
        get stride() {
            return this.arr.stride;
        },
        set stride(nf) {
            this.struct.setFloat32(nf, 6 * 4, true);
        },
        set strideDest(nf) {
            this.struct.setFloat32(nf, 7 * 4, true);
        },
        set filter(nf) {
            this.struct.setFloat32(nf, 8 * 4, true);
        },
        set filterDest(nf) {
            this.struct.setFloat32(nf, 9 * 4, true);
        },
        set amp(nf) {
            this.struct.setFloat32(nf, 10 * 4, true);
        },
        set ampDest(nf) {
            this.struct.setFloat32(nf, 11 * 4, true);
        },
    };
}
export function sfstruct(shBuff, ch) {
    return {
        zone: new Int16Array(shBuff, ch * 1024, 60),
        shdr: new Uint32Array(shBuff, ch * 1024 + 120, 5),
        midiCC: new Uint8Array(shBuff, ch * 1024 + 120 + 20),
    };
}
export function mkmodule(sb) {
    const wasm = new WebAssembly.Instance(new WebAssembly.Module(wasmbin), {
        env: {},
    });
    const mem = wasm.exports.memory;
    let ref = wasm.exports.mk_sps();
    const structLen = wasm.exports.structLen();
    const spinners = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((idx) => ({
        ...mkstruct(wasm.exports, mem.buffer, ref + idx * structLen),
        ...sfstruct(sb, idx),
    }));
    return {
        spinners,
        instance: wasm,
        mallocTable: wasm.exports.mallocTable,
        mem,
    };
}
