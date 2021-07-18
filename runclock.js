let timeoutwork;
const cc = document.createElement("div");
const timespan = document.createElement("div");
timespan.innerHTML = "0:00:0000";
timespan.id = "time";
cc.append(timespan);
const buttons = ["play", "pause", "resume", "reset"].map((btnstr) => {
	const btnele = document.createElement("button");
	btnele.innerHTML = btnstr;
	cc.append(btnele);
	return btnele;
});

const footer = document.querySelector("footer");
footer.append(cc);

function inittimeoutwork() {
	timeoutwork = new Worker(
	URL.createObjectURL(
		new Blob(
			[
				/* javascript */ `
  const timer = {
    timeout: 125,
    t: 0,
    paused: false,
  };
  function run(timer) {
    function loop() {
      if (timer.paused == false) {
        timer.t += timer.timeout;
        postMessage(timer.t);
      }
      setTimeout(loop, timer.timeout);
    }
    setTimeout(loop, timer.timeout);
  }
  run(timer);
  
  onmessage = function(e){
    switch (e.data) {
      case 'pause':
        timer.paused = true;
        break;
      case 'resume':
        timer.paused = false;
        break;
      default:
        timer.timeout = parseInt(e.data);
        break;
    }
  }
  `,
			],
			{ type: "application/javascript" }
		)
	));
}
function parsetime(ms) {
	ms = new Int32Array(ms)[0];
	let sigfig = 31,
		intmask = 0x80000000;
	while (ms & intmask) {
		//} 0x8000000) {
		ms = ms << 1;
		intmask >>= 1;
		sigfig--;
	}
	const sec = (ms * intmask) >> (32 - sigfig);
	while (sigfig--) {
		ms = ms >> 1;
	}

	const minutes = ~~(sec / 60);
	const seconds = Math.floor(sec - minutes * 60);

	return `${minutes < 10 ? "0" + minutes : minutes} : ${
		seconds < 10 ? "0" + seconds : seconds
	}:${ms}`;
}
export function playPauseTimer(onTick) {
	let enablebuttons = (enabledArray) => {
		for (let i = 0; i < 4; i++) {
			if (enabledArray.indexOf(i) >= 0) {
				buttons[i].classList.remove("hidden");
			} else {
				buttons[i].classList.add("hidden");
			}
		}
	};
	buttons.map((btn, idx) => {
		switch (idx) {
			case 0:
				btn.onclick = () => {
					enablebuttons([1, 3]);
					inittimeoutwork();
					timeoutwork.onmessage = ({ data }) => {
						if (onTick) onTick();
						requestAnimationFrame(() => (timespan.innerHTML = data / 1000));
					};
				};
				break;
			case 1:
				btn.onclick = () => {
					timeoutwork.postMessage("pause");
					enablebuttons([2, 3]);
				};
				break;
			case 2:
				btn.onclick = () => {
					timeoutwork.postMessage("resume");
					enablebuttons([1, 3]);
				};
				break;
			case 3:
				btn.onclick = () => {
					timeoutwork.terminate();
					enablebuttons([0]);
					timespan.innerHTML = "0";
				};
				break;
			default:
				break;
		}
	});
	enablebuttons([0]);
	return timeoutwork;
}
