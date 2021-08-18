import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
async function init() {
  const worker = new Worker("midiworker.js#song.mid", {
    type: "module",
  });

  const { totalTicks, presets } = await new Promise((resolve, reject) => {
    worker.onmessage = ({ data: { totalTicks, presets } }) => {
      if (totalTicks && presets) {
        resolve({ totalTicks, presets });
      }
    };
    worker.onerror = reject;
    worker.onmessageerror = reject;
    setTimeout(reject, 1000);
  });
  ReactDOM.render(
    <React.StrictMode>
      <App worker={worker} presets={presets} totalTicks={totalTicks} />
    </React.StrictMode>,
    document.getElementById("root")
  );
}
init();
