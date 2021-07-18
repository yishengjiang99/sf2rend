export class Osc {
  constructor(heap, ref) {
    this.struct = new DataView(heap.buffer, ref, 80);
    this.ref = ref;
    this.output_arr = new Float32Array(
      heap.buffer,
      this.struct.getUint32(0, true),
      128
    );
  }

  get output() {
    return this.output_arr;
  }
  get phase() {
    return this.struct.getUint32(8, true);
  }
  set phase(fl) {
    this.struct.setUint32(8, fl, true);
  }
  get phaseIncrement() {
    return this.struct.getInt32(12, true);
  }
  set phaseIncrement(fl) {
    this.struct.setInt32(12, fl, true);
  }
  set midi(m) {
    this.phaseIncrement =
      (0xfffffffe / 48000) * 440 * Math.pow(2, (m - 69) / 12);
  }
  get phaseVelocity() {
    return this.struct.getInt32(16, true);
  }
  set phaseVelocity(fl) {
    this.struct.setInt32(16, fl, true);
  }
  get fadeDim1() {
    return this.struct.getFloat32(32, true);
  }
  set fadeDim1(fl) {
    this.struct.setFloat32(32, fl, true);
  }
  get fadeDim1Increment() {
    return this.struct.getFloat32(36, true);
  }
  set fadeDim1Increment(fl) {
    this.struct.setFloat32(36, fl, true);
  }
  get fadeDim2() {
    return this.struct.getFloat32(40, true);
  }
  set fadeDim2(fl) {
    this.struct.setFloat32(40, fl, true);
  }
  set fadeDim2Increment(fl) {
    this.struct.setFloat32(40, fl, true);
  }
  get fadeDim3() {
    return this.struct.getFloat32(44, true);
  }
  set fadeDim3Increment(fl) {
    this.struct.setFloat32(44, fl, true);
  }

  //these are pointers to float array. hence the uint32's
  get wave000() {
    return this.struct.getUint32(48, true);
  }
  get wave001() {
    return this.struct.getUint32(52, true);
  }
  get wave010() {
    return this.struct.getUint32(56, true);
  }
  get wave011() {
    return this.struct.getUint32(60, true);
  }
  get wave100() {
    return this.struct.getUint32(64, true);
  }
  get wave101() {
    return this.struct.getUint32(68, true);
  }
  get wave110() {
    return this.struct.getUint32(72, true);
  }
  get wave111() {
    return this.struct.getUint32(76, true);
  }
  set wave000(ref) {
    this.struct.setUint32(48, ref, true);
  }
  set wave001(ref) {
    this.struct.setUint32(52, ref, true);
  }
  set wave010(ref) {
    this.struct.setUint32(56, ref, true);
  }
  set wave011(ref) {
    this.struct.setUint32(60, ref, true);
  }
  set wave100(ref) {
    this.struct.setUint32(64, ref, true);
  }
  set wave101(ref) {
    this.struct.setUint32(68, ref, true);
  }
  set wave110(ref) {
    this.struct.setUint32(72, ref, true);
  }
  set wave111(ref) {
    this.struct.setUint32(76, ref, true);
  }
}
