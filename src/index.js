import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "../style.css";
import "./sequence/App.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Missing #root mount point");
}

ReactDOM.createRoot(root).render(<App />);
