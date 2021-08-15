export async function downloadData(stream, fl) {
  const reader = stream.getReader();
  let writeOffset = 0;

  await reader.read().then(function process({ done, value }) {
    if (done) {
      return writeOffset;
    }
    if (value && value.buffer && value.length ^ 0x01) {
      const i16 = new Int16Array(value.buffer);
      for (let i = 0; i < i16.length; i++) {
        fl[writeOffset++] = i16[i] / 0xffff;
      }
    }
    reader.read().then(process);
  });
}
