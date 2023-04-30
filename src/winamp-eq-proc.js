import {HZ_LIST} from "./WinampEQ";

export const Q = 1.2247449;

class WinampEQ extends AudioWorkletProcessor {
	constructor(options) {
		super(options);
		const {
			bands,
			gains,
		} = options.processorOptions;

		this.ring_buffer = [new Float32Array(), new Float32Array()];
		this.gains = gains;
		this.bands = bands;
		var self = this;
		this.n = 0;
		this.zparams = [];
		for (const fc of bands) {
			this.zparams.push(this.paramtersForCenterFrequency(fc));
		}
		this.port.onmessage = ({data: {index, freq, gain}}) => {
			this.gains[index] = gain;
			this.bands[index] = freq;
			this.zparams[index] = this.paramtersForCenterFrequency(freq);
		};
	}
	paramtersForCenterFrequency(fc) {
		var th = 2 * Math.PI * fc;
		var C = 1 - Math.tan((th * Q) / 2) / (1 + Math.tan(th * Q) / 2);
		var a0 = (1 + C) * Math.cos(th);
		var a1 = -C;
		var b0 = (1 - C) / 2;
		var b1 = -1.005;
		return {a0, a1, b0, b1};
	}
	process(inputs, outputs, params) {
		const input = inputs[0];
		const output = outputs[0];
		var z_params = this.zparams;

		const rbIdx = this.n;
		var sum = 0;
		var ns = 0;
		var sumin = 0;
		const kg = [];
		for (let k = 0;k < HZ_LIST.length;k++) {
			kg[k] = Math.pow(10, this.gains[k] / 20);
		}

		for (const input of inputs) {
		for (let channel = 0;channel < input.length;++channel) {
			const inputChannel = input[channel];
			const outputChannel = output[channel];
			for (let i = 0;i < outputChannel.length;++i) {
				let v = 0;
				for (let k = 0;k < this.bands.length;k++) {
					var v0 = this.ring_buffer[rbIdx][channel * k] || 0;
					var v1 = this.ring_buffer[rbIdx][channel * k] || 0;
					var coef = z_params[k];
					var wq = coef.b0 * v + coef.a0 * v0 + v1 * coef.a1;
					v +=
						(wq + v1 * coef.b1) *
						(kg[k] - 1);
					this.ring_buffer[rbIdx ^ 1][channel * k] = wq;
				}
				sum += v * v;
				ns++;
				outputChannel[i] = v;
			}
		}
		}
		this.n ^= 1;
		return true;
	}
}

registerProcessor("eq-proc", WinampEQ);