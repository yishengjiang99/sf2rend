import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

window.SequencerApp = function (timerChannel, rootElement) {
  ReactDOM.createRoot(rootElement).render(
    React.createElement(App, {
      timerChannel,
    })
  );
};
