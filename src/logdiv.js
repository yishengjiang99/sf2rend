import {mkdiv} from "../mkdiv/mkdiv.js";

const defaultsConfig = {
	rows: 25,
	width: 70,
	class: ".stdout",
	timestamp: true,
};
export function logdiv(config) {
	const {rows, timestamp, clClass} = (config = {...config, ...defaultsConfig});
	const infoPanel = mkdiv("textarea", {style: "min-width:30em", rows, clClass});
	if (config.container) infoPanel.attachTo(config.container);
	let lp = performance.now();
	const logs = [];
	let n = 0;
	new MutationObserver(() => {
		requestIdleCallback(() => infoPanel.scrollTo({
			top: infoPanel.scrollHeight,
		}));

	}).observe(infoPanel, {
		childList: true
	});


	function stdout(log) {
		const ts = timestamp ? ((performance.now() - lp) / 1e3).toFixed(3) + ": " : "";
		lp = performance.now();
		logs.push("\n" + ts + log.toString());
		infoPanel.textContent += "\n" + ts + log.toString();
	}
	return {
		stdout,
		infoPanel,
	};
}

export function mkcollapse({title, id, defaultOpen}, children) {
	if (!id) id = (Math.random() * 10000).toFixed(0);
	const checked = `${defaultOpen ? "checked" : ""}`


	const wrap = mkdiv("div", {
		class: "wrap-collapsible",
	});
	wrap.innerHTML =
		`<input id=${id} class="toggle" type="checkbox"  ${checked} />` +
		`<label for=${id} class="lbl-toggle">${title} [x]</label>` +
		`<div class="collapsible-content">
		<div class="content-inner">
			<p>
			</p>
		</div>
	</div > `;
	wrap.querySelector(".content-inner").replaceChildren(children)
	return wrap;
}
