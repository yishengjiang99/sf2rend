export declare function mkdiv(type: string | keyof HTMLElementTagNameMap, attr?: Record<string, string | EventListenerObject>, children?: string | string[] | HTMLElement | (string | HTMLElement)[] | HTMLElement[]): HTMLElement;
export declare function mksvg(tag: any, attrs?: {}, children?: any[]): any;
export declare function logdiv(infoPanel?: HTMLElement): {
    stderr: (str: any) => void;
    stdout: (log: any) => void;
    infoPanel: HTMLElement;
    errPanel: HTMLElement;
};
export declare function wrapDiv(div: any, tag: any, attrs?: {}): HTMLElement;
export declare function wrapList(divs: any, tag?: string): HTMLElement;
