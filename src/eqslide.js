import "../lib/input-knobs.js";

import {mkdiv} from "../mkdiv/mkdiv.js";
import {midi_ch_cmds, midi_effects} from "./constants.js";
const knob_set_style = "background-color:#323233; color:white;margin-top:2em;padding:20px; display:flex;max-width:fit-content"

const {soundattacktime, soundreleasetime, sounddecaytime, VCA_SUSTAIN_LEVEL, volumecoarse, pitchbendcoarse, expressioncoarse, pancoarse} = midi_effects;

function mk_flex_col(children) {
	return mkdiv("div", {style: "display:flex;flex-direction:column;text-align:center; max-width:fit-content;color:white;"}, children);
}
const DEFPARAMS = {
	min: 0, max: 127, defval: 64, step: 1,
}
export function mk_v_slide(params) {
	return mkknob({
		...params,
		class: "input-slider",
		"data-bgcolor": "gold",
		"data-width": "15",
		"data-height": "150"
	})
} export function mk_h_slide(params) {
	return mkknob({
		...params,
		class: "input-slider",
		"data-width": "150",
		"data-height": "15"
	})
}
export function mkknob(params) {
	const {title, defval, oninput, min, max, step, ...etc} = Object.assign(DEFPARAMS, params);
	let value = defval;

	return mk_flex_col([
		mkdiv("label", title),
		mkdiv("input", {
			min, max, step,
			value: defval,
			type: "range",
			class: "input-knob",
			oninput: (e) => {
				oninput(e.target.value);
				e.target.parentElement.querySelector("text").textContent = e.target.value;
				value = e.target.value;
			},
			...etc
		}),
		mkdiv("text", [value]),
	]);
}
export function mk_eq_bar(activeChannelFn, port) {
	const ch = activeChannelFn();
	const post_val = (cc_num, val) => port.postMessage(new Uint8Array([midi_ch_cmds.continuous_change | ch, cc_num, val]));
	return mkdiv("fieldset", {style: knob_set_style}, [
		mkdiv("legend", "EQ"),
		...[31.25, 62.5, 125, 250, 500, 1000, 2000, 4000, 8000, 16000].map(f => mk_v_slide({
			title: f + "hz",
			min: -4,
			max: 12,
			default: 5
		}))
	]);
}

export function mk_vca_ctrl(activeChannelFn, port) {
	const ch = activeChannelFn();
	const post_val = (cc_num, val) => port.postMessage(new Uint8Array([midi_ch_cmds.continuous_change | ch, cc_num, val]));
	return mkdiv("fieldset", {style: knob_set_style}, [
		mkdiv("legend", "VCA"),
		mkknob({title: "attk", defval: 64, oninput: (val) => post_val(soundattacktime, val)}),
		mkknob({title: "decay", defval: 64, oninput: (val) => post_val(sounddecaytime, val)}),
		mkknob({title: "sustain", defval: 64, oninput: (val) => post_val(VCA_SUSTAIN_LEVEL, val)}),
		mkknob({title: "release", defval: 64, oninput: (val) => post_val(soundreleasetime, val)}),
	]);
}
export function mk_vcf_ctrl(activeChannelFn, port) {
	const ch = activeChannelFn();
	const post_val = (cc_num, val) => port.postMessage(new Uint8Array([midi_ch_cmds.continuous_change | ch, cc_num, val]));
	return mkdiv("fieldset", {style: knob_set_style}, [
		mkdiv("legend", "mod_eg"),
		mkknob({title: "attk", defval: 21, oninput: (val) => post_val(vcf, val)}),
		mkknob({title: "decay", defval: 64, oninput: (val) => post_val(VCA_DECAY, val)}),
		mkknob({title: "sustain", defval: 64, oninput: (val) => post_val(VCA_SUSTAIN_LEVEL, val)}),
		mkknob({title: "release", defval: 64, oninput: (val) => post_val(soundreleasetime, val)}),
		mkknob({title: "mod_filter", defval: 64, oninput: (val) => post_val(soundreleasetime, val)}),
		mkknob({title: "mod_volume", defval: 64, oninput: (val) => post_val(soundreleasetime, val)}),
	]);
}
export function mk_attenuate(activeChannelFn, cb) {
	const ch = activeChannelFn();
	const post_val = (cc_num, val) => cb(new Uint8Array([midi_ch_cmds.continuous_change | ch, cc_num, val]));
	return mkdiv("fieldset", {style: knob_set_style}, [
		mkdiv("legend", "modulate"),
		mkknob({
			title: "res fc(&omega;)", min: 1000,
			id: "filterFC",
			max: 30000,
			step: 10,
			class: "input-knob",
			value: 13700,
			type: "range",
			"data-path_cmd": "lpf",
			"data-p1": activeChannelFn()
		}),
		mkknob({
			title: "pan",
			min: 1,
			max: 128,
			step: 1,
			type: "range",
			defval: 64,
			oninput: (val) => post_val(pancoarse, val)
		}),
		mkdiv("div", [
			mk_h_slide({title: "vol", defval: 64, oninput: (val) => post_val(volumecoarse, val)}),
			mk_h_slide({title: "expr", defval: 64, oninput: (val) => post_val(expressioncoarse, val)})
		])
	]);
}