export declare type Decibel = number;
export declare class SpinNode extends AudioWorkletNode {
    sb: SharedArrayBuffer;
    sdv: DataView;
    static init(ctx: BaseAudioContext): Promise<void>;
    constructor(ctx: BaseAudioContext);
    keyOn(ch: number, key: number, vel: number, zone: any, midiVolume: Decibel, midiExpression: Decibel): void;
    keyOff(ch: number, zone: any): void;
}
