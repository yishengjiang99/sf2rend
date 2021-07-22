import { newSFZoneMap } from "./zoneProxy.js";
declare type Shdr = {
  range: string;
  loops;
  sampleRate: number;
  originalPitch: number;
  url: number;
};
declare type Zref = number;
export declare interface Sf2Service {
  setProgram: (pid: number, channelId: number) => Zref;
  noteOn: typeof newSFZoneMap;
  presetZoneRef: any;
  zoneSampleHeaders: (zref: Zref) => { zMap: {}; shdrMap: {} };
  getFont: (
    presetId: number,
    bankId: number,
    midi: number,
    vel: number
  ) => {
    shdr: Shdr;
    zref2: number;
    zone: any;
    shdata: typeof fetch;
  };
}
export declare async function load(url: string): Sf2Service;
