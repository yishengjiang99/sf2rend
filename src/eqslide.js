import "../lib/input-knobs.js";

import {mkdiv} from "../mkdiv/mkdiv.js";
import {midi_ch_cmds, midi_effects} from "./constants.js";
const knob_set_style =
	"background-color:#323233; color:white;margin-top:2em;padding:20px; display:flex;max-width:fit-content";

const {
	VCA_ATTACK_TIME,
	VCA_DECAY_TIME,
	VCA_SUSTAIN_LEVEL,
	VCA_RELEASE_TIME,
	VCF_ATTACK_TIME,
	VCF_DECAY_TIME,
	VCF_SUSTAIN_LEVEL,
	VCF_RELEASE_TIME,
	VCF_MOD_PITCH,
	VCF_MOD_FC,
	volumecoarse,
	pitchbendcoarse,
	expressioncoarse,
	pancoarse,
} = midi_effects;

function mk_flex_col(children) {
	return mkdiv(
		"div",
		{
			style:
				"display:flex;flex-direction:column;text-align:center; max-width:fit-content;color:white;",
		},
		children
	);
}
const DEFPARAMS = {
	min: 0,
	max: 127,
	defval: 64,
	step: 1,
};
export function mk_v_slide(params) {
	return mkknob({
		...params,
		class: "input-slider",
		"data-bgcolor": "gold",
		"data-width": "15",
		"data-height": "150",
	});
}
export function mk_h_slide(params) {
	return mkknob({
		...params,
		class: "input-slider",
		"data-width": "150",
		"data-height": "15",
	});
}
export function mkknob(params) {
	const {title, defval, oninput, min, max, step, ...etc} = Object.assign(
		DEFPARAMS,
		params
	);
	return mk_flex_col([
		mkdiv("label", title),
		mkdiv("input", {
			min,
			max,
			step,
			value: defval,
			type: "range",
			class: "input-knob",
			oninput: (e) => {
				oninput && oninput(e);
				e.target.parentElement.querySelector("text").textContent =
					e.target.value;
			},
			...etc,
		}),
		mkdiv("text", {text: defval}, defval),
	]);
}
export function mk_eq_bar(ch, onInput) {
	const post_val = (cc_num, val) =>
		port.postMessage(
			new Uint8Array([midi_ch_cmds.continuous_change, ch, cc_num, val])
		);
	return mkdiv("fieldset", {class: "knob-set"}, [
		mkdiv("legend", "EQ"),
		...[31.25, 62.5, 125, 250, 500, 1000, 2000, 4000, 8000, 16000].map((f) =>
			mk_v_slide({
				title: f + "hz",
				min: -4,
				max: 12,
				default: 5,
				oninput: (v) => onInput(ch, f, v, false),
			})
		),
	]);
}

export function mk_vca_ctrl(ch, port) {
	const divbox = [mkdiv("legend", "VCA")];
	const inputnames = ["a", "d", "s", "r"];
	const zdx = ["VolEnvAttack", "VolEnvDecay", "VolEnvSustain", "VolEnvRelease"];
	const defaults = [9, 33, 66, 88];
	const post_val = (cc_num, val) =>
		port.postMessage(
			new Uint8Array([midi_ch_cmds.continuous_change, ch, cc_num, val])
		);
	for (let i = VCA_ATTACK_TIME;i <= VCA_RELEASE_TIME;i++) {
		divbox.push(
			mkknob({
				title: inputnames.shift(),
				"data-path_zdx": zdx.shift(),
				"data-path_p1": ch,
				defval: defaults.shift(),
				"data-mcc": i,
				oninput: (e) => post_val(e.target.dataset["mcc"], e.target.value),
			})
		);
	}
	const g = mkdiv("fieldset", {style: knob_set_style}, divbox);
	return g;
}
export function mk_vcf_ctrl(ch, port) {
	const from = VCF_ATTACK_TIME,
		to = VCF_MOD_FC;
	const legendtitle = "VCF modulate";
	const inputnames = ["a", "d", "s", "r", "filter", "pitch"];
	const defaults = [9, 33, 66, 88, 0, 0];

	const post_val = (cc_num, val) =>
		port.postMessage(
			new Uint8Array([midi_ch_cmds.continuous_change, ch, cc_num, val])
		);
	const divbox = [mkdiv("legend", legendtitle)];
	for (let i = from;i <= to;i++) {
		divbox.push(
			mkknob({
				title: inputnames.shift(),
				defval: defaults.shift(),
				"data-mcc": i,
				oninput: (e) => post_val(e.target.dataset["mcc"], e.target.value),
			})
		);
	}
	const g = mkdiv("fieldset", {style: knob_set_style}, divbox);
	return g;
}

function mk_midi_cc_knob(divbox, titles, i, defaults, post_val) {
	divbox.push(
		mkknob({
			title: titles[i],
			defval: defaults[i],
			"data-midi-cc": i,
			oninput: (e) => post_val(e.target.dataset["midi-cc"], e.target.value),
		})
	);
}

export function mk_filter_ctrls(ch) {
	return mkdiv("fieldset", {style: knob_set_style}, [
		mkdiv("legend", "lpf"),
		mkknob({
			title: "initialFC",
			id: "filterFC",
			min: 0,
			max: 12000,
			step: 10,
			class: "input-knob",
			value: 6000,
			type: "range",
			"data-path_cmd": "lpf_fc",
			"data-path_zdx": "FilterFc",
			"data-p1": ch,
		}),
		mkknob({
			title: "filterQ",
			min: 0,
			max: 480,
			step: 1,
			class: "input-knob",
			value: 0,
			type: "range",
			"data-path_cmd": "lpf_q",
			"data-path_zdx": "FilterQ",
			"data-p1": ch,
		}),
		mkknob({
			title: "expr",
			min: 1,
			max: 128,
			step: 1,
			type: "range",
			defval: 127,
			oninput: (val) => post_val(expressioncoarse, val),
		}),
	]);
}
