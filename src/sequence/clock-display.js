import React from "react";
import {Space} from "antd";
export default function ClockDisplay({clock, ticks, tm}) {
	return (
		<Space>
			<span>
				clock: {(clock / 1000).toFixed(2).toString().split(".").join(":")}
			</span>
			<span>Bar: {~~(ticks / tm.ppqn)}</span>
		</Space>
	);
}