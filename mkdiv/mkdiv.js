export function mkdiv(type, attr = {}, children = "") {
  // if (attr && typeof attr != "object" && !children)
  //   return mkdiv(type, {}, attr);
  const div = document.createElement(type);
  for (const key in attr) {
    if (key.match(/on(.*)/)) {
      div.addEventListener(key.match(/on(.*)/)[1], attr[key]);
    } else {
      div.setAttribute(key, attr[key]);
    }
  }
  const charray = !Array.isArray(children) ? [children] : children;
  charray.forEach((c) => {
    typeof c == "string" ? (div.innerHTML += c) : div.append(c);
  });
  return div;
}
HTMLElement.prototype.attachTo = function (parent) {
  parent.append(this);
  return this;
};
HTMLElement.prototype.wrapWith = function (tag) {
  const parent = mkdiv(tag);
  parent.append(this);
  return parent;
};
export function logdiv() {
  const logs = [];
  const errPanel = mkdiv("div");
  const infoPanel = mkdiv("pre", {
    style:
      "width:30em;min-height:299px;scroll-width:0;max-height:299px;overflow-y:scroll",
  });
  const stderr = (str) => (errPanel.innerHTML = str);
  const stdout = (log) => {
    logs.push((performance.now() / 1e3).toFixed(3) + ": " + log);
    if (logs.length > 100) logs.shift();
    infoPanel.innerHTML = logs.join("\n");
    infoPanel.scrollTop = infoPanel.scrollHeight;
  };
  return {
    stderr,
    stdout,
    infoPanel,
    errPanel,
  };
}
export function wrapDiv(div, tag, attrs = {}) {
  return mkdiv(tag, attrs, [div]);
}
export function wrapList(divs) {
  return mkdiv("div", {}, divs);
}
