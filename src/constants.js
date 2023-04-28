export const range = (x, y) =>
  Array.from(
    (function* _(x, y) {
      while (x < y) yield x++;
    })(x, y)
  );

export const midi_ch_cmds = {
  change_program: 0xc0,
  continuous_change: 0xb0,
  note_on: 0x90,
  note_off: 0x80,
  keyaftertouch: 0xa0, // 10
  pitchbend: 0xe0, // 14
};
export const midi_effects = {
  bankselectcoarse: 0,
  modulationwheelcoarse: 1,
  breathcontrollercoarse: 2,
  footcontrollercoarse: 4,
  portamentotimecoarse: 5,
  dataentrycoarse: 6,
  volumecoarse: 7,
  balancecoarse: 8,
  pancoarse: 10,
  expressioncoarse: 11,
  pitchbendcoarse: 12,
  effectcontrol2coarse: 13,
  generalpurposeslider1: 16,
  generalpurposeslider2: 17,
  generalpurposeslider3: 18,
  generalpurposeslider4: 19,
  bankselectfine: 32,
  modulationwheelfine: 33,
  breathcontrollerfine: 34,
  footcontrollerfine: 36,
  portamentotimefine: 37,
  dataentryfine: 38,
  volumefine: 39,
  balancefine: 40,
  panfine: 42,
  expressionfine: 43,
  pitchbendfine: 44,
  effectcontrol2fine: 45,
  holdpedal: 64,
  portamento: 65,
  sustenutopedal: 66,
  softpedal: 67,
  legatopedal: 68,
  hold2pedal: 69,
  soundvariation: 70,
  VCF_RESONANCE: 71,
  VCA_RELEASE_TIME: 72,
  VCA_ATTACK_TIME: 73,
  VCF_CUTOFF_FREQUENCY: 74,
  VCA_SUSTAIN_LEVEL: 75,
  soundcontrol7: 76,
  soundcontrol8: 77,
  soundcontrol9: 78,
  soundcontrol10: 79,
  VCA_DECAY: 80,
  generalpurposebutton2: 81,
  generalpurposebutton3: 82,
  generalpurposebutton4: 83,
  reverblevel: 91,
  tremololevel: 92,
  choruslevel: 93,
  celestelevel: 94,
  phaserlevel: 95,
  databuttonincrement: 96,
  databuttondecrement: 97,
  nonregisteredparametercoarse: 98,
  nonregisteredparameterfine: 99,
  registeredparametercoarse: 100,
  registeredparameterfine: 101,
};


export const nvpc = 4;
export const DRUMSCHANNEL = 10;