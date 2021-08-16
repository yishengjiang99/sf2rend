export async function requestDownload(worker, sf2_program) {
  const samples = Object.values(sf2_program.shdrMap).sort(
    (a, b) => a.sampleId < b.sampleId
  );
  let lastSid = null;
  let payload = [];
  for (const sample of samples) {
    if (
      lastSid != null &&
      lastSid + 1 != sample.sampleId &&
      payload.length > 0
    ) {
      worker.postMessage({
        url: sf2_program.url,
        smpls: payload,
      });
      lastSid = null;
      payload = [];
    }
    lastSid = sample.SampleId;
    payload.push({
      sampleId: lastSid,
      range: sample.range,
    });
  }
  if (payload.length > 0) {
    worker.postMessage({
      url: sf2_program.url,
      smpls: payload,
    });
  }
}

export function getWorker(destinationPort) {
  const worker = new Worker("./dist/fetchworker.js");
  worker.postMessage({ destination: destinationPort }, [destinationPort]);
  return worker;
}

// function workercode() {
//   return /* javascript */ /* javascript */ `

//   `;
// }
