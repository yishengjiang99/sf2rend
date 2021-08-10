import { mkmodule } from "./spin_struct";
const channels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
// @ts-ignore
class SpinProcessor extends AudioWorkletProcessor {
    sb;
    spinners;
    shdrMap;
    instance;
    mem;
    port;
    static get parameterDescriptors() {
        return channels.reduce(function (params, ch) {
            params.push({
                name: "stride_" + ch,
                automationRate: "a-rate",
                minValue: 0,
                maxValue: 401,
                defaultValue: 0,
            });
            params.push({
                name: "sample_id_" + ch,
                automationRate: "k-rate",
                minValue: -1,
                maxValue: 1024,
                defaultValue: -1,
            });
            params.push({
                name: "amp_" + ch,
                automationRate: "a-rate",
                minValue: 0,
                maxValue: 1,
                defaultValue: 0,
            });
            params.push({
                name: "filter_" + ch,
                automationRate: "a-rate",
                minValue: 0,
                maxValue: 12000,
                defaultValue: 0,
            });
            return params;
        }, []);
    }
    constructor(options) {
        super(options);
        this.sb = options.processorOptions.sb;
        const { spinners, mem, instance } = mkmodule(this.sb);
        this.spinners = spinners;
        this.mem = mem;
        this.instance = instance;
        this.shdrMap = new Array(1024);
        this.port.onmessage = this.onmessage.bind(this);
    }
    onmessage(e) {
        if (e.data.pcmBuffer && e.data.sampleId) {
            const pcmRef = this.instance.exports.mallocTable(e.data.pcmBuffer.length);
            const slab = new Uint8Array(this.mem.buffer, pcmRef, e.data.pcmBuffer.length);
            slab.set(new Uint8Array(e.data.pcmBuffer));
            this.shdrMap[e.data.sampleId] = pcmRef;
        }
    }
    process(_, outputs, parameters) {
        for (const ch in this.spinners) {
            if (this.spinners[ch].inputRef == null)
                continue;
            const strideLen = parameters.get("stride_" + ch).length;
            this.spinners[ch].strideDest = parameters.get("stride_" + ch)[strideLen - 1];
            const ampLen = parameters.get("amp_" + ch).length;
            this.spinners[ch].ampDest = parameters.get("ampLen" + ch)[ampLen - 1];
            this.spinners[ch].spin();
            outputs[ch][0].set(this.spinners[ch].output);
        }
        return true;
    }
}
// @ts-ignore
registerProcessor("spin-proc", SpinProcessor);
