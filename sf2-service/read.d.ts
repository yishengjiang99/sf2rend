import { newSFZoneMap } from "./zoneProxy.js";
declare type Shdr = {
  range: string;
  loops;
  sampleRate: number;
  originalPitch: number;
  url: number;
};
declare type Zref = number;
export type ZMap = { [key: string]: { [key: string]: number } };
export interface LoadZoneResp {
  zMap: ZMap;
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
  loadProgram: (
    presetId: number,
    bankId: number
  ) => {
    shdrMap: any;
    zMap: ZMap[];
    preload: () => void;
    filterKV: (key: number, val: number) => ZMap[];
  };
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
export declare function load(url: string): Sf2Service;
export enum sf_gen_id {
  startAddrsOffset,
  endAddrsOffset,
  startloopAddrsOffset,
  endloopAddrsOffset,
  startAddrsCoarseOffset,
  modLfoToPitch,
  vibLfoToPitch,
  modEnvToPitch,
  initialFilterFc,
  initialFilterQ,
  modLfoToFilterFc,
  modEnvToFilterFc,
  endAddrsCoarseOffset,
  modLfoToVolume,
  unused1,
  chorusEffectsSend,
  reverbEffectsSend,
  pan,
  unused2,
  unused3,
  unused4,
  delayModLFO,
  freqModLFO,
  delayVibLFO,
  freqVibLFO,
  delayModEnv,
  attackModEnv,
  holdModEnv,
  decayModEnv,
  sustainModEnv,
  releaseModEnv,
  keynumToModEnvHold,
  keynumToModEnvDecay,
  delayVolEnv,
  attackVolEnv,
  holdVolEnv,
  decayVolEnv,
  sustainVolEnv,
  releaseVolEnv,
  keynumToVolEnvHold,
  keynumToVolEnvDecay,
  instrument,
  reserved1,
  keyRange,
  velRange,
  startloopAddrsCoarse,
  keynum,
  velocity,
  initialAttenuation,
  reserved2,
  endloopAddrsCoarse,
  coarseTune,
  fineTune,
  sampleID,
  sampleModes,
  reserved3,
  scaleTuning,
  exclusiveClass,
  overridingRootKey,
  unused5,
  endOper,
}