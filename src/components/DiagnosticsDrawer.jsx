import React, { useState } from "react";

const TABS = ["Log", "SF2", "Synth", "Query"];

export default function DiagnosticsDrawer({ engine }) {
  const {
    diagnosticsOpen,
    setDiagnosticsOpen,
    logs,
    sf2Meta,
    summary,
    queryResponse,
  } = engine;
  const [tab, setTab] = useState("Log");

  return (
    <div className={`diagnostics${diagnosticsOpen ? " open" : ""}`}>
      <button
        type="button"
        className="diagnostics-toggle"
        aria-expanded={diagnosticsOpen}
        onClick={() => setDiagnosticsOpen(!diagnosticsOpen)}
      >
        <span>Diagnostics</span>
        <span aria-hidden="true">{diagnosticsOpen ? "▾" : "▴"}</span>
      </button>
      {diagnosticsOpen ? (
        <div className="diagnostics-body">
          <div className="diagnostics-tabs" role="tablist" aria-label="Diagnostics">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                className={`dtab${tab === t ? " active" : ""}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="diagnostics-content" role="tabpanel">
            {tab === "Log" ? (
              <pre className="console-pre">{logs.join("\n") || "No log messages yet."}</pre>
            ) : null}
            {tab === "SF2" ? (
              <div className="meta-list">
                {sf2Meta.length ? (
                  sf2Meta.map(([section, text]) => (
                    <div className="meta-row" key={`${section}-${text.slice(0, 12)}`}>
                      <strong>{section}</strong>
                      <span>{text}</span>
                    </div>
                  ))
                ) : (
                  <span className="muted-copy">No metadata loaded.</span>
                )}
              </div>
            ) : null}
            {tab === "Synth" ? (
              <pre className="console-pre">
                {summary ? JSON.stringify(summary, null, 2) : "No render summary yet."}
              </pre>
            ) : null}
            {tab === "Query" ? (
              <pre className="console-pre">
                {queryResponse
                  ? JSON.stringify(queryResponse, null, 2)
                  : "Run “Inspect” on a channel to capture its current synth state."}
              </pre>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
