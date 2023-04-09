import React from "react"
import {NumberInput} from "./NumberInput"

export default function SetTempo(config) {
	const {setTempo, setTS1, ts1, tempo} = config;
	return <div title="setting">
		<input type="number"
			step="1"
			width={6}
			label="bpm"
			key="adfda"
			onInput={(e, v) => {
				setTempo(parseInt(e.target.value))
			}}
			defaultValue={tempo}
			min={30}
			max={600} />
		<NumberInput
			label="timesig"
			onInput={(e) => setTS1(parseInt(e.target.value))}
			value={ts1}
			key="adsf"
			min={2}
			max={8} />
	</div>
}