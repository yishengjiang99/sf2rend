import {useState} from "react";
const defaults = {
	msqn: 500000, ts: 4, ppqn: 240
};
const micro_s_per_minute = 60000000;
const bpm2msqn = (bpm, ts) => micro_s_per_minute / bpm * 4 / ts;
const msqn2bpm = (msqn, ts) => micro_s_per_minute / msqn / ts * 4;
export default function useTM(initValues) {
	const [{msqn, ts1, ts2, ppqn}, setTM] = useState(
		{
			...defaults,
			...initValues,
		}
	);
	const ts = ts1 / ts2 * 4;
	const setTempo = (t) => setTM((state) => ({
		...state,
		msqn: bpm2msqn(t, ts)
	}));
	const setTS1 = (ts1) => setTM((state) => ({
		...state,
		ts1: ts1
	}));
	const setTS2 = (ts2) => setTM((state) => ({
		...state,
		ts2: ts2
	}))

	return [{tempo: ~~msqn2bpm(msqn, ts), msqn, ts, ts1, ts2, ppqn}, {setTempo, setTS1, setTS2, setTM}];
}