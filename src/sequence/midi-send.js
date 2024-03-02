import {useEffect, useState} from "react";
import React from 'react';

let midiAccess;

export default function SendMidi({onMidiConnected}) {
	const [outputs, setOutputs] = useState([]);
	useEffect(() => {
		navigator.permissions
			.query({name: "midi"})
			.then(initNavigatorMidiAccess)
			.then(setOutputs)
			.catch(() => alert("midi access not got"));
	}, []);
	return (
		<span style={{minWidth: 250}}>
			<select onSelect={(e) => onMidiConnected(midiAccess.outputs.get(e.target.id))} key='sel'>
				{outputs.map((o) => (
					<option key={o.id} value={o.id}>{o.name}</option>
				))}
			</select>
			<button key='send' className="primary">Send</button>
		</span>
	);
}

async function initNavigatorMidiAccess() {
	midiAccess = await navigator.requestMIDIAccess();
	if (!midiAccess) {
		throw new Error("midi access not granted");
	}
	return Array.from(midiAccess.outputs.values());
}
