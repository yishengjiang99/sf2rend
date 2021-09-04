export declare function scheduler(midi_u8: any, cb: any): Promise<{
    ctrls: {
        pause: () => void;
        rwd: (amt: any) => void;
        run: () => Promise<void>;
        resume: () => void;
    };
    tracks: any[];
    ntracks: number;
    presets: any[];
    totalTicks: any;
}>;
