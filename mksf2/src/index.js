const encoder = new TextEncoder("ascii");
let samples = [];
const phdr = [new Uint8Array(20), new Uint16Array([pid, bankid, bagId])];
function newSample() {}
let sampleLen = 1024;
let npresets, nsampls;
let fileLen = 50;

new Blob([encoder.encode("riff"), fileLen]);
