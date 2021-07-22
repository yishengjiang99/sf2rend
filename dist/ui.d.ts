export declare class TrackUI {
    preset: HTMLSelectElement;
    meters: HTMLMeterElement[];
    led: any;
    polylines: SVGPolylineElement[];
    constructor(container: any);
    set pid(id: any);
    onload(): void;
    set midi(v: number);
    set velocity(v: number);
    set active(b: any);
    set env1({ phases: [a, d, s, r], peak }: {
        phases: [any, any, any, any];
        peak: any;
    });
    set env2({ phases: [a, d, s, r], peak }: {
        phases: [any, any, any, any];
        peak: any;
    });
    set zone(z: any);
}
export declare function mkui(parentdiv: HTMLElement): TrackUI[];
export declare const insts: string[];
export declare function datalist(): HTMLDataListElement;
