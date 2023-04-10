export const TIMER_STATE = {
	INIT: 0,
	RUNNING: 1,
	PAUSED: 2,
	FINISHED: 3,
	RECORDING: 4,
	REWIND: 5,
	FWD: 6

};
const {INIT, RUNNING, PAUSED, REWIND, FWD, RECORDING} = TIMER_STATE;
export const available_btns = [
	["rwd", "start", "fwd"],
	["rwd", "stop", "fwd"],
	["rwd", "resume", "fwd"],
	["reset"],
	["stop"],
	["wait"],
	["wait"]
];
export const cmd2stateChange = {
	start: RUNNING,
	stop: PAUSED,
	resume: RUNNING,
	reset: INIT,
	record: RECORDING,
	rwd: REWIND,
	fwd: FWD,
};
export let baseOctave = 42;
export const nbars = 12;

export const marginTop = 10;
// const pageNotes = [[]];
export const channels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
