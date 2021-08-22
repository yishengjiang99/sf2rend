// self.addEventListener("message", rulel());

// function rulel() {
//   return ({ data: { url, smpls, destination, ...data } }) => {
//     if (destination) {
//       self.destport = destination;
//       self.destport.onmessage = ({ data }) => postMessage(data);
//     } else if (url && smpls) {
//       loadsdta(url, smpls, self.destport);
//     } else if (data && self.destport) self.destport.postMessage(data);
//   };
// }
// function loadprog(sf2,port){
//   const samples = Object.values(sf2_program.shdrMap).sort(
//     (a, b) => a.sampleId < b.sampleId
//   );
//   let lastSid = null;
//   let payload = [];
//   for (const sample of samples) {
//     if (
//       lastSid != null &&
//       lastSid + 1 != sample.SampleId &&
//       payload.length > 0
//     ) {
//       loadsdta({url,payload});
//       lastSid = null;
//       payload = [];
//     }
//     lastSid = sample.SampleId;
//     payload.push({
//       sampleId: lastSid,
//       range: sample.range,
//     });
//   }
//   if (payload.length > 0) {
//     loadsdta({url,payload});

//   }
// }
// }
// async function loadsdta(url, smpls, destination) {
//   let min, max;
//   const segments = {};
//   smpls.sort((a, b) => a.sampleId < b.sampleId);
//   for (const { range } of smpls) {
//     min = min ? (range[0] < min ? range[0] : min) : range[0];
//     max = max ? (range[1] > max ? range[1] : max) : range[1];
//   }
//   for (const { range, sampleId } of smpls) {
//     segments[sampleId] = {
//       startByte: range[0] - min,
//       endByte: range[1] - min,
//     };
//   }
//   const res = await fetch(url, {
//     headers: {
//       range: "bytes=" + [min, max].join("-"),
//     },
//   });
//   destination.postMessage(
//     { stream: res.body, segments, nsamples: (max - min + 1) / 2 },
//     [res.body]
//   );
//   await res.body.close;
// }
