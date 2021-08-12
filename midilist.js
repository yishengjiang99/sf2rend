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
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url);
  xhr.responseType = "document";
  xhr.send();
  xhr.onload = function () {
    xhr.responseXML.documentElement
      .querySelectorAll("Blob")
      .map(function (b) {
        var ff = new Map();
        xml_attr.forEach(function (attr) {
          ff.set(attr, b.querySelector(attr).textContent);
        });
        return ff;
      })
      .sort((a, b) =>
        new Date(a.LastModified) < new Date(b.lastModified) ? -1 : 1
      );
  };
}
