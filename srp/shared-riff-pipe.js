const sendingFlag = 0x8000,
  headerBytesLength = 8;
export class SharedRiffPipe {
  array;
  byteLenth;
  constructor(byteLenthOrArray) {
    if (byteLenthOrArray.byteLength) {
      this.byteLenth = byteLenthOrArray.byteLength;
      this.array = new Uint32Array(byteLenthOrArray);
    } else {
      this.byteLenth = byteLenthOrArray;
      const sharedBuffer = new SharedArrayBuffer(byteLenthOrArray);
      this.array = new Uint32Array(sharedBuffer);
    }
  }
  msgLen(offset) {
    return this.array[offset / 4 + 1];
  }
  get hasMsg() {
    return this.array[0] & sendingFlag;
  }
  free_slot(byteLength) {
    let offset;
    for (
      offset = 0;
      offset < this.byteLenth - byteLength - headerBytesLength &&
      this.array[offset << 2] & 0x8000;
      offset += this.msgLen(offset) + headerBytesLength
    ) {}
    if (offset > this.byteLenth - headerBytesLength - byteLength)
      throw "stack overflow";
    return offset >> 2;
  }
  send(fourcc, msgArr) {
    const offset = this.free_slot(msgArr.byteLength);
    this.array[offset] = fourcc | sendingFlag;
    this.array[offset + 1] = msgArr.byteLength;
    this.array.set(new Uint32Array(msgArr), offset + 2);
  }
  read(offset = 0) {
    const msgs = [];
    while (offset < this.byteLenth / 4 && this.array[offset] & sendingFlag) {
      const msgByteLen = this.array[offset + 1];
      this.array[offset] ^= sendingFlag;
      msgs.push({
        fourcc: this.array[offset],
        size: msgByteLen,
        chunk: this.array.subarray(offset + 2, offset + 2 + msgByteLen / 4),
      });
      offset = offset + 2 + msgByteLen / 4;
    }
    return msgs;
  }
  shareWith(msgPort) {
    msgPort.postMessage({ sharedRiff: msgPort });
  }
}
