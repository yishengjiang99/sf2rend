export function mkdiv(type, attr = {}, children = "") {
    const div = document.createElement(type);
    for (const key in attr) {
        if (key.match(/on(.*)/)) {
            div.addEventListener(key.match(/on(.*)/)[1], attr[key]);
        }
        else {
            div.setAttribute(key, attr[key]);
        }
    }
    const charray = !Array.isArray(children) ? [children] : children;
    charray.forEach((c) => {
        typeof c == "string" ? (div.innerHTML += c) : div.append(c);
    });
    return div;
}
//

export function logdiv({ container, containerID } = {}) {
    const logs = [];
    const errPanel = mkdiv("div");
    const infoPanel = mkdiv("pre", { style: "height:200px;overflow-y:scroll" });
    const stderr = (str) => (errPanel.innerHTML = str);
    const stdout = (log) => {
        logs.push(performance.now() / 1e6 + ":" + log);
        if (logs.length > 100)
            logs.shift();
        infoPanel.innerHTML = logs.join("\n");
    };
    ((containerID && document.getElementById(containerID)) ||
        container ||
        document.body).append(mkdiv("div", {}, [errPanel, infoPanel]));
    return {
        stderr,
        stdout,
    };
}

// export { logdiv, mkdiv };
