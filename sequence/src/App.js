import "./App.css";
import {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import {useChannel} from "./useChannel";
import {
  NumberInput,
  CheckboxInput,
  TMInput,
  InputWithLabel,
} from "./NumberInput";
import {TIMER_STATE, available_btns, cmd2stateChange} from "./TIMER_STATE";
import {ErrorBoundary} from "./ErrorBoundary";
import {keyEvent2Midi} from "./keyEvent2Midi";
const ppqn = 240;
let baseOctave = 48;
const nbars = 23 * 4;
const pageNotes = [[]];

function App({timerChannel}) {
  const [{lastMessage}, postMessage] = useChannel(timerChannel);
  const [tempo, setTempo] = useState(60);
  const [division, setDivision] = useState(4);
  const [compact, setCompact] = useState(false);
  const [tick, setTick] = useState(0);
  const [nRend, setNRend] = useState(0);
  const [page, setPage] = useState(0);
  const [timerState, setTimerState] = useState(TIMER_STATE.INIT);
  const sequencerRef = useRef();
  useEffect(() => {
    setTick(lastMessage);
  }, [lastMessage]);

  const qn = tick / ppqn;
  useEffect(() => {
    if (page !== ~~(qn / nbars)) {
      setPage(~~(qn / nbars));
      if (!pageNotes[page]) {
        pageNotes[page] = [];
      }
    }
    return () => { };
  }, [qn, page, sequencerRef.current]);

  useEffect(() => {
    postMessage({tick: tick});
    if (!pageNotes[page]) return;
    for (const noteInfo of pageNotes[page]) {
      sequencerRef.current.drawBar(...noteInfo);
    }
  }, [page]);

  const kup = useCallback(
    (e) => keyEvent2Midi(e, baseOctave) && setTick((t) => t + ppqn),
    [setTick]
  );
  const kdown = useCallback(
    (e) => {
      const noteInfo = [tick / ppqn, keyEvent2Midi(e, baseOctave)];
      if (!noteInfo[1]) return;
      sequencerRef.current.drawBar(...noteInfo);
      if (!pageNotes[page]) pageNotes[page] = [];
      pageNotes[page].push(noteInfo);
    },
    [tick, page, pageNotes]
  );
  useEffect(() => {
    window.onkeydown = kdown;
    window.onkeyup = kup;
    return function cleanUp() {
      window.removeEventListener("keydown", kdown);
      window.removeEventListener("keyup", kup);
    };
  }, [kdown, kup]);

  const mkbtn = (cmd) => (
    <input
      type="button"
      key={cmd}
      onClick={() => {
        postMessage({cmd});
        if (Object.keys(cmd2stateChange).indexOf(cmd) > -1) {
          setTimerState(cmd2stateChange[cmd]);
        }
      }}
      value={cmd}
    />
  );
  return (
    <div className="App">
      <div className="App-header">
        <div>
          {
            <NumberInput
              label="bpm"
              setValue={setTempo}
              value={tempo}
              min={30}
              max={200}
            />
          }
          <span> {tick} </span>
        </div>
        <div>          <ErrorBoundary>{available_btns[timerState].map(mkbtn)}</ErrorBoundary>{" "}
        </div>
        <Sequence
          ref={sequencerRef}
          width={600}
          height={200}
          division={division}
          nbars={nbars}
          nsemi={compact ? 12 : 12 * 2}
          qnStart={page * nbars}
          mStart={baseOctave}
        ></Sequence>
      </div>

      <CheckboxInput
        {...{
          setChecked: setCompact,
          checked: compact,
          label: "compact",
          className: "col-sm-6",
        }}
      />
      <TMInput
        {...{
          division,
          setDivision,
          label: "Division",
        }}
      />
    </div>
  );
}
const Sequence = forwardRef((props, ref) => {
  const {nsemi, width, height, division, nbars, qnStart, mStart} = props;
  const canvasRef = useRef();
  const barInc = width / nbars;
  const semiHeight = height / nsemi;
  console.log("rerend");
  useEffect(() => {
    if (!canvasRef.current) return;

    const semiHeight = height / nsemi;
    const ctx = canvasRef.current.getContext("2d");
    ctx.transform(1, 0, 0, -1, 0, height);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(0, 0, 0, 0)";

    ctx.fillRect(0, 0, width, height);
    for (let i = 1;i < nbars;i++) {
      ctx.beginPath();
      if (i % division === 0) {
        ctx.strokeStyle = "gray";
      } else {
        ctx.strokeStyle = "black";
      }
      ctx.moveTo(i * barInc, 0);
      ctx.lineTo(i * barInc, height);
      ctx.stroke();
    }
    for (let i = nsemi;i >= 0;i--) {
      if ([1, 3, 5, 8, 10].indexOf(i % 12) > -1) {
        ctx.fillStyle = "rgba(22, 22, 22, 0.5)";
      } else {
        ctx.fillStyle = "rgba(33, 33, 33, 0.5)";
      }
      ctx.fillRect(0, i * semiHeight, width, semiHeight);
      ctx.beginPath();
      ctx.strokeStyle = "rgba(1, 1, 1, 0.5)";
      ctx.moveTo(0, i * semiHeight);
      ctx.lineTo(width, i * semiHeight);
      ctx.stroke();
    }
  }, [width, height, division, nbars, nsemi, barInc, qnStart]);

  useImperativeHandle(
    ref,
    () => {
      return {
        drawBar(qn, midi) {
          const ctx = canvasRef.current.getContext("2d");
          ctx.save();

          ctx.fillStyle = "white";
          ctx.fillRect(
            (qn - qnStart + 1) * barInc + 1,
            (midi - mStart) * semiHeight + 1,
            barInc - 1,
            semiHeight - 1
          );
          ctx.restore();
        },
      };
    },
    [qnStart, barInc, mStart, semiHeight]
  );
  return <canvas ref={canvasRef} width={width} height={height}></canvas>;
});

export default App;
