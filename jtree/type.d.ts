import ""
interface GenSet {
	attrs: [Number, Number][];
	next: GenSet | null;
}
type Shdr = {
	name: string;
	start: number;
	end: number;
	startLoop: number;
	endLoop: number;
	sampleRate: number;
	originalPitch: number;
	pitchCorrection: number;
	sampleLink: number;
	sampleType: number;
};

interface INSTZone {
	name: string;
	rootInstSet: GenSet;
	rootPreset: GenSet;
	sample: Shdr;
}

interface Preset {

}