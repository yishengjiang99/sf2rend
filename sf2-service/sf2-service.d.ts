export interface Range {
	hi: number;
	lo: number;
}

export interface Shdr {
	nsamples: number;
	range: number[];
	loops: number[];
	SampleId: number;
	sampleRate: number;
	originalPitch: number;
	url: string;
	name: string;
	data(): Promise<Float32Array>;
	pcm?: Float32Array;
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
	shdr: Shdr;
	instrument: string;
	calcPitchRatio(key: number, sr: number): number;
}

export interface SF2Program {
	zMap: ZMap[];
	pid: number;
	bkid: number;
	shdrMap: { [key: string]: Shdr };
	url: string;
	zref: number;
	name: string;
	sampleSet: Set<number>;
	preload(): Promise<void>;
	filterKV(key: number, vel: number): ZMap[];
	fetch_drop_ship_to(port: MessagePort): Promise<any>;
}

export interface SF2LoadOptions {
	onHeader?: (pid: number, bid: number, name: string) => void;
	onSample?: (...args: any[]) => void;
	onZone?: (...args: any[]) => void;
}

export interface SF2State {
	pdtaRef: number;
	heapref: WeakRef<ArrayBuffer>;
	instRef: (instid: number) => number;
	presetRefs: Uint32Array;
	heap: ArrayBuffer;
	shdrref: number;
	programNames: string[];
	sdtaStart: number;
	infos: [string, string][];
	zonesFor?: (program: number, bank: number) => number;
}

export default class SF2Service {
	url: string;
	state: SF2State;
	
	constructor(url: string);
	
	load(options?: SF2LoadOptions): Promise<SF2State>;
	
	get meta(): [string, string][];
	
	get programNames(): string[];
	
	get presets(): Uint32Array;
	
	loadProgram(pid: number, bkid: number): SF2Program;
}
