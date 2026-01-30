
export interface SF2Program {
	zMap: ZMap[];
	pid: number;
	bkid: number;
	shdrMap: { [key: string]: Shdr };
	url: URL;
	zref: number;
	name: string;
}

export interface Shdr {
	nsamples: number;
	range: number[];
	loops: number[];
	SampleId: number;
	sampleRate: number;
	originalPitch: number;
	url: URL;
	name: string;
}

export enum URL {
	Sf2ServiceFileSf2 = "sf2-service/file.sf2",
}

export interface ZMap {
	pid: number;
	bkid: number;
	ref: number;
	StartAddrOfs: number;
	EndAddrOfs: number;
	StartLoopAddrOfs: number;
	EndLoopAddrOfs: number;
	StartAddrCoarseOfs: number;
	ModLFO2Pitch: number;
	VibLFO2Pitch: number;
	ModEnv2Pitch: number;
	FilterFc: number;
	FilterQ: number;
	ModLFO2FilterFc: number;
	ModEnv2FilterFc: number;
	EndAddrCoarseOfs: number;
	ModLFO2Vol: number;
	Unused1: number;
	ChorusSend: number;
	ReverbSend: number;
	Pan: number;
	IbagId: number;
	PBagId: number;
	Unused4: number;
	ModLFODelay: number;
	ModLFOFreq: number;
	VibLFODelay: number;
	VibLFOFreq: number;
	ModEnvDelay: number;
	ModEnvAttack: number;
	ModEnvHold: number;
	ModEnvDecay: number;
	ModEnvSustain: number;
	ModEnvRelease: number;
	Key2ModEnvHold: number;
	Key2ModEnvDecay: number;
	VolEnvDelay: number;
	VolEnvAttack: number;
	VolEnvHold: number;
	VolEnvDecay: number;
	VolEnvSustain: number;
	VolEnvRelease: number;
	Key2VolEnvHold: number;
	Key2VolEnvDecay: number;
	Instrument: number;
	Reserved1: number;
	KeyRange: Range;
	VelRange: Range;
	StartLoopAddrCoarseOfs: number;
	Keynum: number;
	Velocity: number;
	Attenuation: number;
	Reserved2: number;
	EndLoopAddrCoarseOfs: number;
	CoarseTune: number;
	FineTune: number;
	SampleId: number;
	SampleModes: number;
	Reserved3: number;
	ScaleTune: number;
	ExclusiveClass: number;
	OverrideRootKey: number;
	Dummy: number;
	arr: { [key: string]: number };
	shdr: Shdr;
	instrument: Instrument;
}

export interface Range {
	hi: number;
	lo: number;
}

export enum Instrument {
	The0PulseWidth75 = "0 Pulse Width 75%",
	The0SawIncline = "0 Saw Incline",
}
