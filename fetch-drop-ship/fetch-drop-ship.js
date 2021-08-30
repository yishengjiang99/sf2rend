export async function requestDownload(program, port) {
  await Promise.all(
    Object.values(program.shdrMap).map(async (shdr) => {
      const res = await fetch(program.url, {
        headers: {
          Range: `bytes=${shdr.range.join("-")}`,
        },
      });

      port.postMessage(
        {
          segments: {
            sampleId: shdr.SampleId,
            nSamples: (shdr.range[1] + 1 - shdr.range[0]) / 2,
            loops: shdr.loops,
            sampleRate: shdr.sampleRate,
          },
          stream: res.body,
        },
        [res.body]
      );
      await res.body.closed;
    })
  );
}
export const getWorker = () => {};
