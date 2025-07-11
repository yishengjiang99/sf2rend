
let tmParams = {
	ppqn: 240,
	ts: 4,
	msqn: 600000,
	get waittime() {
		return tmParams.msqn / 1000 / tmParams.ppqn * 60;
	},
	get ticksElapsed() {
		return 60;
	}
}
const scheduledEvents = [];



let timer = null;
let clocktime, ticks, lastTick;
clocktime = ticks = lastTick = 0;

onmessage = handleMsg;

function handleMsg({data: {cmd, tick, tm, processorPort}}) {
	if (tm) {
		tmParams = {...tmParams, ...tm};
	}
	if (tick) {
		ticks = tick;
	}
	if (cmd) switch (cmd) {
		case "start":
			lastTick = performance.now();
			ticks = 0;	
			clearTimeout(timer);
			lastTick = performance.now();
			timer = setTimeout(ontick, tmParams.waittime);
			break;
		case "resume":
			clearTimeout(timer);
			lastTick = performance.now();
			timer = setTimeout(ontick, tmParams.waittime);
			break;
		case "reset":
			clearInterval(timer);
			postMessage({ticks});
			ticks = 0;
			break;
		case "stop":
		case "pause":
			clearInterval(timer);
			break;
		case "fwd":
			ticks += tmParams.ppqn * 8;
			postMessage({ticks, clocktime});
			break;
		case "rwd":
			ticks -= tmParams.ppqn * 8;
			postMessage({ticks});
			break;
		default: break;
	}
};

function ontick() {
	ticks += tmParams.ticksElapsed;
	let now = performance.now();
	clocktime += (now - lastTick);
	postMessage({
		ticks,
		clock: clocktime
	});
	const wt = tmParams.waittime;
	const drift = (now - lastTick) - wt;
	lastTick = now;
	timer = setTimeout(ontick, wt - drift);

}
