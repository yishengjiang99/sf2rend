import React from "https://esm.sh/react@19.0.0-beta-04b058868c-20240508/?dev";
import ReactDOMClient from "https://esm.sh/react-dom@19.0.0-beta-04b058868c-20240508/client/?dev";

window.onload = () => {
  const rootElement = ReactDOMClient.createRoot(
    document.getElementById("root")
  );
  const ints = [1, 2, 3];
  const elements = ints.map((i) => React.createElement("li", {}, i));
  rootElement.render(React.createElement("ul", {}, elements));
};
