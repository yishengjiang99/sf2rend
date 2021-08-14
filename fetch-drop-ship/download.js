export async function downloadData(stream, disk) {
  const reader = stream.getReader();
  let writeOffset = 0;
  return reader.read().then(async function process({ done, value }) {
    if (done) {
      await stream.closed;
      return writeOffset;
    }
    if (value) {
      for (let i = 0; i < value.length; i++, writeOffset++)
        disk[writeOffset] = value[i];
    }

    process(await reader.read());
  });
}
