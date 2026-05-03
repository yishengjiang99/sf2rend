import { mfilelist } from "../mfilelist.js";
import { sf2list } from "../sflist.js";

export const midi_ch_cmds = {
  change_program: 0xc0,
  continuous_change: 0xb0,
  note_on: 0x90,
  note_off: 0x80,
  keyaftertouch: 0xa0,
  pitchbend: 0xe0,
};

export async function fetchmidilist(
  url = "https://grep32bit.blob.core.windows.net/midi?resttype=container&comp=list"
) {
  const localEntries = mfilelist.map((item) => ({
    Name: decodeURI(item.split("/").pop() ?? item),
    Url: item,
  }));

  if (globalThis.location?.hostname === "127.0.0.1" || globalThis.location?.hostname === "localhost") {
    return localEntries;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return localEntries;
    }
    const xml = await response.text();
    const document = new DOMParser().parseFromString(xml, "application/xml");
    const remoteEntries = Array.from(document.querySelectorAll("Blob"))
      .map((blob) => ({
        Name: blob.querySelector("Name")?.textContent ?? "",
        Url: blob.querySelector("Url")?.textContent ?? "",
      }))
      .filter((item) => item.Name && item.Url);
    return dedupeEntries(localEntries, remoteEntries);
  } catch {
    return localEntries;
  }
}

export async function fetchSF2List(
  url = "https://grep32bit.blob.core.windows.net/sf2?resttype=container&comp=list"
) {
  const localEntries = sf2list.map((item) => ({
    Name: decodeURI(item.split("/").pop() ?? item),
    Url: item,
  }));

  if (globalThis.location?.hostname === "127.0.0.1" || globalThis.location?.hostname === "localhost") {
    return localEntries;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return localEntries;
    }
    const xml = await response.text();
    const document = new DOMParser().parseFromString(xml, "application/xml");
    const remoteEntries = Array.from(document.querySelectorAll("Blob"))
      .map((blob) => ({
        Name: blob.querySelector("Name")?.textContent ?? "",
        Url: blob.querySelector("Url")?.textContent ?? "",
      }))
      .filter((item) => item.Name && item.Url);
    return dedupeEntries(localEntries, remoteEntries);
  } catch {
    return localEntries;
  }
}

function dedupeEntries(...entryLists) {
  const byUrl = new Map();
  entryLists.flat().forEach((entry) => {
    if (entry?.Url && !byUrl.has(entry.Url)) {
      byUrl.set(entry.Url, entry);
    }
  });
  return Array.from(byUrl.values());
}
