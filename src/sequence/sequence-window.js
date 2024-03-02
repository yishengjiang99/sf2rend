import React from "react";
import { Sequence } from "./sequence";
export default function SequenceWindow({
  sequencerRef,
  channels,
  presetMap,
  chRef,
}) {
  return (
    <div key={1} className="canvas_window">
      <div className="canvas_container" ref={sequencerRef}>
        {channels.map((ch) => (
          <div key={ch} style={{ paddingTop: 10 }}>
            <Sequence
              preset={presetMap[ch]}
              ref={(element) => chRef.current.push(element)}
              width={nbars * 40}
              key={ch}
              chId={ch}
              ppqn={ppqn}
              height={M_HEIGHT / 16 - marginTop}
              division={midiInfo.time_base.numerator}
              nbars={nbars}
              nsemi={12 * 3}
              mStart={baseOctave}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
