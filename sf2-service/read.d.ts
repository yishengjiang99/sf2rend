import { newSFZoneMap } from "./zoneProxy.js";
declare type Shdr = {
  range: string;
  loops;
  sampleRate: number;
  originalPitch: number;
  url: number;
};
declare type Zref = number;
export interface LoadZoneResp {
  zMap: { [key: string]: { [key: string]: number } };
  shdrMap: { [key: string]: ShdrMap };
}

export interface ShdrMap {
  byteLength: number;
  range: string;
  loops: number[];
  sampleRate: number;
  originalPitch: number;
  url: URL;
  hdrRef: number;
  charClone: { [key: string]: number };
  ab?: ArrayBuffer;
}

export interface Ab {}
export declare interface Sf2Service {
  setProgram: (pid: number, channelId: number) => Zref;
  noteOn: typeof newSFZoneMap;
  presetZoneRef: any;
  loadZone: LoadZoneResp;
  getFont: (
    presetId: number,
    bankId: number,
    midi: number,
    vel: number
  ) => {
    shdr: Shdr;
    zref2: number;
    zone: any;
    shdata: Promise<Float32Array>;
  };
}
export declare async function load(url: string): Sf2Service;
