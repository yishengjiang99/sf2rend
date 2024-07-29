export const midi_ch_cmds = {
  change_program: 0xc0,
  continuous_change: 0xb0,
  note_on: 0x90,
  note_off: 0x80,
  keyaftertouch: 0xa0, // 10
  pitchbend: 0xe0, // 14
};
var xml_attr = [
  "Name",
  "Url",
  "LastModified",
  "Etag",
  "Size",
  "ContentType",
  "ContentEncoding",
  "ContentLanguage",
];

export function fetchmidilist(
  url = "https://grep32bit.blob.core.windows.net/midi?resttype=container&comp=list"
) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "document";
    xhr.send();
    xhr.onload = function () {
      if (!xhr.responseXML) return [];
      const taglist = xhr.responseXML.querySelectorAll("Blob");
      resolve(Array.from(taglist).map(b =>
        new Proxy(b, {
          get(t, attr) {
            return t.querySelector(attr).textContent;
          }
        })
      ));
    };
    xhr.onerror = reject;
    xhr.ontimeout = reject;
  });
}

export function fetchSF2List(
  url = "https://grep32bit.blob.core.windows.net/sf2?resttype=container&comp=list"
) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "document";
    xhr.send();
    xhr.onload = function () {
      if (xhr.responseXML) {
        const blobs = Array.from(xhr.responseXML.querySelectorAll("Blob"));
        resolve(
          blobs.map((b) => {
            return {
              url: b.querySelector("Url").textContent,
              name: b.querySelector("Name").textContent,
            };
          })
        );
      }
    };
    xhr.onerror = reject;
    xhr.ontimeout = reject;
  });
}