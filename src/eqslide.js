import "../lib/input-knobs.js";

import {mkdiv} from "../mkdiv/mkdiv.js";
import {midi_ch_cmds, midi_effects} from "./constants.js";
const knob_set_style = "background-color:#323233; color:white;margin-top:2em;padding:20px; display:flex;max-width:fit-content"

const {soundattacktime, soundreleasetime, sounddecaytime, VCA_SUSTAIN_LEVEL} = midi_effects;

function mk_flex_col(children) {
	return mkdiv("div", {style: "display:flex;flex-direction:column;text-align:center; max-width:fit-content;color:white;"}, children);
}
const DEFPARAMS = {
	min: 0, max: 127, defval: 64, step: 1,
}
export function mkknob(params) {
	const {title, defval, oninput, min, max, step} = Object.assign(DEFPARAMS, params);
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
			}
		}),
		mkdiv("text", [value]),
	]);
}


export function mk_vca_ctrl(ch, port) {
	const post_val = (cc_num, val) => port.postMessage(new Uint8Array([midi_ch_cmds.continuous_change | ch, cc_num, val]));
	return mkdiv("fieldset", {style: knob_set_style}, [
		mkdiv("legend", "VCA"),
		mkknob({title: "att", defval: 21, oninput: (val) => post_val(soundattacktime, val)}),
		mkknob({title: "decay", defval: 33, oninput: (val) => post_val(sounddecaytime, val)}),
		mkknob({title: "sustain", defval: 64, oninput: (val) => post_val(VCA_SUSTAIN_LEVEL, val)}),
		mkknob({title: "release", defval: 33, oninput: (val) => post_val(soundreleasetime, val)}),
	]);
}