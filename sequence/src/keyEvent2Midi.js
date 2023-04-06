export function keyEvent2Midi(e, baseOctave) {
	if (e.modifier)
		return false;
	const keys = ["a", "w", "s", "e", "d", "f", "t", "g", "y", "h", e, "u", "j"];
	const index = keys.indexOf(e.key);
	if (index < 0)
		return false;
	const key = index + baseOctave;
	return key;
}
