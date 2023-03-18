export const notesOfOctave = (octave) =>
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(
    (idx) => notesOfIndex[idx][octave]
  );

export const keyboardToFreq = (key, octave) => {
  const idx = keys.indexOf(key);
  const baseFreq = notesOfIndex[idx][octave];
  return baseFreq;
};
export const idxToFreq = (idx, octave) => {
  return notesOfIndex[idx][octave];
};
export const noteToMajorTriad = (baseFreq) => {
  return [baseFreq, baseFreq * 2, baseFreq * 4];
};
export const midiToFreq = (midi) => {
  return Math.pow(2, (midi - 69) / 12) * 440;
};
export const noteToMinorTriad = (baseFreq) => {
  const midi = ~~(12 * Math.log2(baseFreq / 440) + 69);
  return [baseFreq, midiToFreq(midi + 3), midiToFreq(midi + 7)];
};

export const blackKeys = ["w", "e", "t", "y", "u"];
export const keys = [
  "a",
  "w",
  "s",
  "e",
  "d",
  "f",
  "t",
  "g",
  "y",
  "h",
  "u",
  "j",
];
export const keynotes = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];
