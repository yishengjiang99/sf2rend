export function s16ArrayBuffer2f32(ab) {
  const b16 = new Int16Array(ab);

  const f32 = new Float32Array(ab.byteLength / 2);
  for (let i = 0; i < b16.length; i++) {
    //} of b16){
    f32[i] = b16[i] / 0xffff;
  }
  return f32;
}
