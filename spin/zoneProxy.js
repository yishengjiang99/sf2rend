/* eslint-disable no-unused-vars */
export const attributeKeys = [
  "StartAddrOfs",
  "EndAddrOfs",
  "StartLoopAddrOfs",
  "EndLoopAddrOfs",
  "StartAddrCoarseOfs",
  "ModLFO2Pitch",
  "VibLFO2Pitch",
  "ModEnv2Pitch",
  "FilterFc",
  "FilterQ",
  "ModLFO2FilterFc",
  "ModEnv2FilterFc",
  "EndAddrCoarseOfs",
  "ModLFO2Vol",
  "Unused1",
  "ChorusSend",
  "ReverbSend",
  "Pan",
  "Unused2",
  "Unused3",
  "Unused4",
  "ModLFODelay",
  "ModLFOFreq",
  "VibLFODelay",
  "VibLFOFreq",
  "ModEnvDelay",
  "ModEnvAttack",
  "ModEnvHold",
  "ModEnvDecay",
  "ModEnvSustain",
  "ModEnvRelease",
  "Key2ModEnvHold",
  "Key2ModEnvDecay",
  "VolEnvDelay",
  "VolEnvAttack",
  "VolEnvHold",
  "VolEnvDecay",
  "VolEnvSustain",
  "VolEnvRelease",
  "Key2VolEnvHold",
  "Key2VolEnvDecay",
  "Instrument",
  "Reserved1",
  "KeyRange",
  "VelRange",
  "StartLoopAddrCoarseOfs",
  "Keynum",
  "Velocity",
  "Attenuation",
  "Reserved2",
  "EndLoopAddrCoarseOfs",
  "CoarseTune",
  "FineTune",
  "SampleId",
  "SampleModes",
  "Reserved3",
  "ScaleTune",
  "ExclusiveClass",
  "OverrideRootKey",
  "Dummy",
];

export function newSFZoneMap(ref, attrs) {
  var obj = { ref };
  for (let i = 0; i < 60; i++) {
    if (attributeKeys[i] == "VelRange" || attributeKeys[i] == "KeyRange") {
      obj[attributeKeys[i]] = {
        hi: (attrs[i] & 0x7f00) >> 8,
        lo: attrs[i] & 0x007f,
      };
    } else {
      obj[attributeKeys[i]] = attrs[i];
    }
  }
  obj.arr = attrs;
  return obj;
}

/**
 * proxys comma-separated str of attributes into
 * dot-accessing objects to make beter autocompletes in vscode
 * @param attrs csv strings
 * @returns Proxy<string,number>
 */
export function newSFZone(zone) {
  let lastUpdate = new Date();
  let lastSync = new Date();
  return new Proxy(zone, {
    get: (target, key) => {
      if (key == "arr") return target.arr;
      if (key == "ref") return target.ref;
      if (key == "sample" || key == "shdr") return target.shdr;
      if (key == "isDirty") return lastUpdate > lastSync;
      const idx = attributeKeys.indexOf(key);
      if (idx > -1) return target.arr[idx];
      if (key == "calcPitchRatio") return target.calcPitchRatio;
      if (key == "export_string") return URL.createObjectURL(target.arr);
    },
    set: (target, key, val) => {
      const idx = attributeKeys.indexOf(key);
      if (idx > -1) {
        lastUpdate = new Date();
        target.arr[idx] = parseInt(val);
        return true;
      }
      if (key === "lastSync") lastSync = val;
      return false;
    },
  });
}

export const defZone = [
  /*StartAddrOfs:*/ 0,
  /*EndAddrOfs:*/ 0,
  /*StartLoopAddrOfs:*/ 0,
  /*EndLoopAddrOfs:*/ 0,
  /*StartAddrCoarseOfs:*/ 0,
  /*ModLFO2Pitch:*/ 0,
  /*VibLFO2Pitch:*/ 0,
  /*ModEnv2Pitch:*/ 0,
  /*FilterFc:*/ 13500,
  /*FilterQ:*/ 0,
  /*ModLFO2FilterFc:*/ 0,
  /*ModEnv2FilterFc:*/ 0,
  /*EndAddrCoarseOfs:*/ 0,
  /*ModLFO2Vol:*/ 0,
  /*Unused1:*/ 0,
  /*ChorusSend:*/ 0,
  /*ReverbSend:*/ 0,
  /*Pan:*/ 0,
  /*Unused2:*/ 0,
  /*Unused3:*/ 0,
  /*Unused4:*/ 0,
  /*ModLFODelay:*/ 0,
  /*ModLFOFreq:*/ 0,
  /*VibLFODelay:*/ 0,
  /*VibLFOFreq:*/ -1133,
  /*ModEnvDelay:*/ -12000,
  /*ModEnvAttack:*/ -12000,
  /*ModEnvHold:*/ -12000,
  /*ModEnvDecay:*/ -12000,
  /*ModEnvSustain:*/ 0,
  /*ModEnvRelease:*/ -12000,
  /*Key2ModEnvHold:*/ 0,
  /*Key2ModEnvDecay:*/ 0,
  /*VolEnvDelay:*/ -12000,
  /*VolEnvAttack:*/ -12000,
  /*VolEnvHold:*/ -12000,
  /*VolEnvDecay:*/ -9000,
  /*VolEnvSustain:*/ 266,
  /*VolEnvRelease:*/ -9000,
  /*Key2VolEnvHold:*/ 0,
  /*Key2VolEnvDecay:*/ 0,
  /*Instrument:*/ -1,
  /*Reserved1:*/ 0,
  /*KeyRange:*/ 127 << 8,
  /*VelRange:*/ 127 << 8,
  /*StartLoopAddrCoarseOfs:*/ 0,
  /*Keynum:*/ -1,
  /*Velocity:*/ -1,
  /*Attenuation:*/ 0,
  /*Reserved2:*/ 0,
  /*EndLoopAddrCoarseOfs:*/ 0,
  /*CoarseTune:*/ 0,
  /*FineTune:*/ 0,
  /*SampleId:*/ -1,
  /*SampleModes:*/ 1,
  /*Reserved3:*/ 0,
  /*ScaleTune:*/ 100,
  /*ExclusiveClass:*/ 0,
  /*OverrideRootKey:*/ -1,
  /*Dummy:*/ 0,
];