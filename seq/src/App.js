import logo from "./logo.svg";
import "./App.css";
import { useEffect, useRef, useState, createRef } from "react";
const playbackStates = {
  init: 0,
  playing: 1,
  paused: 2,
};
const defaults = {
  cols: 120,
  rows: 32,
};
function App(props) {
  const { worker, presets, totalTicks, rows, cols } = {
    ...props,
    ...defaults,
  };
  const [lastMessage, setMessage] = useState("");
  const [channelMsg, setChannelMsg] = useState(null);
  const [time, setTime] = useState({ clockTime: 0, qn: 0 });
  const [playbackState, setPlaybackState] = useState(playbackStates.init);
  const formRef = useRef();

  function mapBtnToPBState(btn) {
    return ["pause", "start", "pause", "resume"].indexOf(btn) % 2;
  }
  function btngo() {
    switch (playbackState) {
      case playbackStates.init:
        return ["start"];
      case playbackStates.playing:
        return ["pause"];
      case playbackStates.paused:
        return ["resume"];
    }
  }
  useEffect(() => {
    worker.onmessage = ({
      data: { clockTime, qn, tick, channel, ...data },
    }) => {
      if (clockTime && qn) {
        setTime({ clockTime, qn });
      }
      if (channel) {
        setChannelMsg(channel);
      } else {
        //  setMessage(data);
      }
    };
  }, [worker]);
  useEffect(() => {
    if (channelMsg) {
      const cbox = parseInt(channelMsg[1]) - 40 + (time.qn % cols) * rows;
      if (document.querySelector("form")[cbox]) {
        document.querySelector("form")[cbox].setAttribute("checked", "checked");
      }
    }
  }, [channelMsg, formRef]);

  useEffect(() => {
    if (time.qn && time.qn % cols == 0) {
      for (const input of Array.from(
        document.querySelectorAll("input[type='checkbox']")
      ))
        input.removeAttribute("checked");
    }
  }, [time]);
  return (
    <div className="App">
      <div>
        {btngo(playbackState).map((btn) => (
          <input
            key={btn}
            type="button"
            value={btn}
            onClick={() => {
              worker.postMessage({ cmd: btn });
              setPlaybackState(mapBtnToPBState(btn));
              setMessage({ cmd: btn });
            }}
          />
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 3fr" }}>
        <span>
          {time.clockTime}|{time.qn}
        </span>
        <progress
          type="range"
          max={totalTicks}
          step={255}
          value={time.qn * 255}
        />
      </div>
      <pre>{JSON.stringify(lastMessage)}</pre>
      <div key="g">
        <form ref={formRef}>
          <div
            key={"a"}
            style={{
              display: "grid",
              gridAutoFlow: "column",
              gridTemplateRows: "1fr ".repeat(rows),
            }}
          >
            {Array.from(
              (function* range(x, y) {
                while (x < y) yield x++;
              })(0, rows * cols)
            ).map((v) => (
              <div
                key={v}
                style={{
                  backgroundColor:
                    ~~(v / rows) == time.qn % cols ? "yellow" : "",
                }}
              >
                <input name={v} type="checkbox" key={v} />
              </div>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
}
export default App;
