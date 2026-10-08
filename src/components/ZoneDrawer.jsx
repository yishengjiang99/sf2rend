import React, { useMemo, useState } from "react";
import { attributeKeys } from "../../sf2-service/zoneProxy.js";
import { GEN, ZONE_GROUPS, formatGenValue } from "../genMapping.js";

function ZoneField({ index, name, value, onChange }) {
  const genName = attributeKeys[index] ?? name;
  return (
    <label className="zone-field">
      <span className="zone-field-head">
        <span>{genName}</span>
        <em>{formatGenValue(genName, Number(value) || 0)}</em>
      </span>
      <input
        type="number"
        value={value ?? 0}
        aria-label={genName}
        onChange={(e) => onChange(index, e.target.value)}
      />
    </label>
  );
}

export default function ZoneDrawer({ engine }) {
  const {
    zoneEditor,
    closeZoneEditor,
    pickZoneEditorZone,
    setZoneField,
    revertZone,
  } = engine;
  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState(() => new Set(["Filter"]));

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ZONE_GROUPS;
    return ZONE_GROUPS.map((g) => ({
      ...g,
      gens: g.gens.filter(([name]) => name.toLowerCase().includes(q)),
    })).filter((g) => g.gens.length);
  }, [query]);

  if (!zoneEditor) return null;
  const { zones, selectedRef, values, error } = zoneEditor;

  const toggleGroup = (name) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <aside className="zone-drawer" role="dialog" aria-label="Zone editor">
      <div className="zone-drawer-head">
        <h2>Zone editor · CH {zoneEditor.channelId + 1}</h2>
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          aria-label="Close zone editor"
          onClick={closeZoneEditor}
        >
          ✕
        </button>
      </div>

      <label className="zone-pick">
        <span>Zone</span>
        <select
          value={selectedRef ?? ""}
          aria-label="Zone to edit"
          onChange={(e) => pickZoneEditorZone(Number(e.target.value))}
        >
          {zones.map((z) => (
            <option key={z.ref} value={z.ref}>
              {z.ref} · keys {z.keyLo}–{z.keyHi} · vel {z.velLo}–{z.velHi}
              {z.sampleName ? ` · ${z.sampleName}` : ""}
            </option>
          ))}
        </select>
      </label>

      <input
        className="ctl zone-search"
        type="search"
        placeholder="Search generators…"
        aria-label="Search generators"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {error ? (
        <div className="zone-error" role="alert">
          {error}
        </div>
      ) : null}

      <div className="zone-groups">
        {groups.map((group) => {
          const open = openGroups.has(group.name);
          return (
            <details
              key={group.name}
              className="zone-group"
              open={open}
              onToggle={(e) => {
                // keep React state in sync for the search filter
                if (e.target.open !== open) toggleGroup(group.name);
              }}
            >
              <summary>{group.name}</summary>
              <div className="zone-grid">
                {group.gens.map(([genName, unit]) => {
                  const index = GEN[genName];
                  if (index == null) return null;
                  return (
                    <ZoneField
                      key={genName}
                      index={index}
                      name={`${genName} (${unit})`}
                      value={values[index]}
                      onChange={setZoneField}
                    />
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>

      <div className="zone-actions">
        <span className="zone-hint">Edits apply live to sounding voices.</span>
        <button type="button" className="btn btn-ghost" onClick={revertZone}>
          Revert
        </button>
      </div>
    </aside>
  );
}
