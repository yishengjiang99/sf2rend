import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

async function runSequence({midiInfo, eventPipe, rootElement}) {
  const timerWorker = new Worker("dist/timer.js");


  ReactDOM.createRoot(rootElement).render(
    React.createElement(App, {
      timerWorker,
      midiInfo,
      eventPipe,
    })
  );
}
window.runSequence = runSequence;
