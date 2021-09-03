export function mkdiv(type, attr = {}, children = "") {
    // if (attr && typeof attr != "object" && !children)
    //   return mkdiv(type, {}, attr);
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
    Object.defineProperty(div, "attachTo", function (parent) {
        if (parent)
            parent.append(this);
        return this;
    });
    Object.defineProperty(div, "wrapWith", function (tag) {
        const parent = mkdiv(tag);
        parent.append(this);
        return parent;
    });
    return div;
}
export function mksvg(tag, attrs = {}, children = []) {
    var el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (var k in attrs) {
        if (k == "xlink:href") {
            el.setAttributeNS("http://www.w3.org/1999/xlink", "href", attrs[k]);
        }
        else {
            el.setAttribute(k, attrs[k]);
        }
    }
    const charray = !Array.isArray(children) ? [children] : children;
    charray.forEach((c) => el.append(c));
    return el;
}
export function logdiv(infoPanel = mkdiv("pre", {
    style: "width:30em;min-height:299px;scroll-width:0;max-height:299px;overflow-y:scroll",
})) {
    const logs = [];
    let rx1 = "", rx2 = "";
    const stderr = (str) => {
        rx1 = str;
        rx2 = str;
    };
    const stdout = (log) => {
        logs.push((performance.now() / 1e3).toFixed(3) + ": " + log);
        if (logs.length > 100)
            logs.shift();
        infoPanel.innerHTML = rx1 + "\n" + logs.join("\n");
        infoPanel.scrollTop = infoPanel.scrollHeight;
    };
    return {
        stderr,
        stdout,
        infoPanel,
        errPanel: mkdiv("span"),
    };
}
export function wrapDiv(div, tag, attrs = {}) {
    return mkdiv(tag, attrs, [div]);
}
export function wrapList(divs, tag = "div") {
    return mkdiv(tag, {}, divs);
}
