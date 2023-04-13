import {mkdiv} from "../mkdiv/mkdiv.js";
const defaultsConfig = {
    rows: 30,
    size: 70,
    className: ".stdout",
    timestamp: true,
    container: document.body
};
export function logdiv(config = {}) {
    const {rows, size, className, container, timestamp} = Object.assign(config, defaultsConfig);
    const infoPanel = mkdiv("textarea", {
        id: "stdout", style: "width:57em;", rows, className
    });
    if (container)
        infoPanel.attachTo(container);
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
        const ts = timestamp ? ((performance.now()) / 1e3).toFixed(3) + ": " : "";
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
    if (!id)
        id = (Math.random() * 10000).toFixed(0);
    const checked = `${defaultOpen ? "checked" : ""}`;
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
    const cd = wrap.querySelector(".collapsible-content");
    const innerContent = wrap.querySelector(".content-inner");
    if (!innerContent)
        throw "typescript ";
    innerContent.replaceChildren(children);
    new MutationObserver((mutationList) => {
        mutationList.forEach((mutation) => {
            switch (mutation.type) {
                case "attributes":
                    switch (mutation.attributeName) {
                        case "style":
                            console.log(mutation);
                            break;
                    }
                    break;
            }
        });
    }).observe(cd, {
        attributeFilter: ["style"]
    });
    return wrap;
}
