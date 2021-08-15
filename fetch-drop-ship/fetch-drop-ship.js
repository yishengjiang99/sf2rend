export async function requestDownload(worker, sf2_program) {
  return worker.postMessage({
    url: sf2_program.url,
    smpls: Object.values(sf2_program.shdrMap).map((sh) => ({
      sampleId: sh.SampleId,
      range: sh.range,
      loops: sh.loops,
    })),
  });
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
