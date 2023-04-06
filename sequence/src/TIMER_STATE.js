export const TIMER_STATE = {
	INIT: 0,
	RUNNING: 1,
	PAUSED: 2,
	FINISHED: 3,
	RECORDING: 4
};
const {INIT, RUNNING, PAUSED, FINISHED, RECORDING} = TIMER_STATE;
export const available_btns = [
	["record", "start", "fwd"],
	["rwd", "stop", "fwd"],
	["reset", "resume", "fwd"],
	["reset"],
	["stop"]
];
export const cmd2stateChange = {
	start: RUNNING,
	stop: PAUSED,
	resume: RUNNING,
	reset: INIT,
	record: RECORDING
};
