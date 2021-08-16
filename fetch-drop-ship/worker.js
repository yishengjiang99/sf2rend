self.addEventListener(
  "message",
  ({ data: { url, smpls, destination, ...data } }) => {
    if (destination) {
      self.destport = destination;
      self.destport.onmessage = ({ data }) => postMessage(data);
    }
    if (url && smpls) {
      loadsdta("/sf2rend/file.sf2", smpls, self.destport);
    }
    if (data && self.destport) self.destport.postMessage(data);
  }
);

async function loadsdta(url, smpls, destination) {
  let min, max;
  const segments = {};
  for (const { range } of smpls) {
    min = min ? (range[0] < min ? range[0] : min) : range[0];
    max = max ? (range[1] > max ? range[1] : max) : range[1];
  }
  for (const { range, sampleId } of smpls) {
    segments[sampleId] = {
      startByte: range[0] - min,
      endByte: range[1] - min,
    };
  }
  const res = await fetch(url, {
    headers: {
      range: "bytes=" + [min, max].join("-"),
    },
  });
  destination.postMessage(
    { stream: res.body, segments, nsamples: (max - min + 1) / 2 },
    [res.body]
  );
  await res.body.close;
  return;
  //if (res.ok === false) throw "fetch" + url + "failed ";
}
