import React from "react";
import { useSynthEngine } from "./synth/useSynthEngine.js";
import TopBar from "./components/TopBar.jsx";
import Mixer from "./components/Mixer.jsx";
import Inspector from "./components/Inspector.jsx";
import ZoneDrawer from "./components/ZoneDrawer.jsx";
import Scope from "./components/Scope.jsx";
import Keyboard from "./components/Keyboard.jsx";
import DiagnosticsDrawer from "./components/DiagnosticsDrawer.jsx";

export default function App() {
  const engine = useSynthEngine();

  return (
    <div className="app-shell">
      <TopBar engine={engine} />
      <div className="workstation">
        <div className="ws-main">
          <Mixer engine={engine} />
          <div className="ws-bottom">
            <Inspector engine={engine} />
            <Scope engine={engine} />
          </div>
        </div>
        <ZoneDrawer engine={engine} />
      </div>
      <Keyboard engine={engine} />
      <DiagnosticsDrawer engine={engine} />
    </div>
  );
}
