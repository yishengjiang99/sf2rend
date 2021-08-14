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
  const worker = new Worker(
    URL.createObjectURL(
      new Blob([workercode()], { type: "application/javascript" })
    )
  );
  worker.postMessage({ destination: destinationPort }, [destinationPort]);
  return worker;
}

function workercode() {
  return /* javascript */ /* javascript */ `
  self.addEventListener("message",({data:{url, smpls, destination,...data}})=>{
    if(destination) {
      self.destport=destination;;
      self.destport.onmessage=({data})=>postMessage(data);
    }
    if(url&&smpls){
      loadsdta(url,smpls,self.destport);
    }
    if(data && self.destport) self.destport.postMessage(data);
  });

  async function loadsdta(url,smpls,destination) {
    let min, max;
    const segments = {};
    for (const { range } of smpls) {
      min = min ? (range[0] < min ? range[0] : min) : range[0];
      max = max ? (range[1] > max ? range[1] : max) : range[1];
    }
    for (const { range, sampleId } of smpls) {
      segments[sampleId] = {
        startByte:range[0] - min,
        endByte: range[1] - min
      }
    }
    return fetch(url, {
      headers: {
        range: "bytes="+[min, max].join("-")
      },
    }).then((res) => {
      if (res.ok === false) throw "fetch" + url + "failed ";
  
      destination.postMessage(
        { stream: res.body, segments, nsamples: (max-min+1)/2 },
        [res.body]
      );
      return res.bodyUsed;
    });
  }
  `;
}
