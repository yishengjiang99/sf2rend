import {useEffect, useRef, useState} from "react";
import React from "react";
import {Sequence} from "./sequence";
import {
  TIMER_STATE,
  available_btns,
  cmd2stateChange,
  channels,
  nbars,
  marginTop,
  baseOctave,
} from "./constants";
import useTM from "./useTM";
import SendMidi from "./midi-send";
import "./App.css";
function Space({children}) {
  return (
    <div style={{display: "flex", justifyContent: "space-between"}}>
      {children}
    </div>
  );
}
const M_HEIGHT = 3 * window.visualViewport?.height - 120;
const ranEvents = [];
function App({timerWorker, midiInfo, eventPipe}) {
  const presetMap = midiInfo.presets.reduce(
    (map, {pid, channel}) => ({
      ...map,
      [channel]: pid,
    }),
    {0: 0}
  );
  const chRef = useRef([]);
  const [tm, {setTempo, setTM, setTS1, setTS2}] = useTM(
    get_time_base(midiInfo)
  );
  const {msqn, tempo, ts1, ts2, ppqn} = tm;
  const [{ticks, clock}, setNow] = useState({ticks: 0, clock: 0});
  const slibRef = useRef();
  const [timerState, setTimerState] = useState(TIMER_STATE.INIT);
  const sequencerRef = useRef();
  const tempos = midiInfo.tempos;
  const midioutput = useRef();
  useEffect(() => {
    if (midioutput.current) {
      midiInfo.tracks.forEach((track) => {
        track
          .filter((e) => e.t === 0 && e.channel)
          .forEach((e) => {
            midioutput.send(e.channel);
          });
      });
    }
  }, [midioutput, midiInfo.tracks]);

  useEffect(
    function () {
      switch (timerState) {
        case TIMER_STATE.RUNNING:
          break;
        case TIMER_STATE.REWIND:
          while (
            ranEvents.length &&
            ranEvents[ranEvents.length - 1].event.t > ticks
          ) {
            const {event, ch} = ranEvents.pop();
            midiInfo.tracks[ch].push(event);
          }
          queueMicrotask(() => setTimerState(TIMER_STATE.RUNNING));
          break;
        case TIMER_STATE.FWD:
          queueMicrotask(() => setTimerState(TIMER_STATE.PAUSED));

          break;
        default:
          break;
      }
    },
    [
      timerState,
      eventPipe,
      midiInfo.tracks,
      setTM,
      tempos,
      timerWorker,
      tm,
      ticks,
    ]
  );
  useEffect(() => {
    timerWorker.postMessage(tm);
  }, [timerWorker, tm]);
  useEffect(() => {
    if (sequencerRef.current)
      sequencerRef.current.style.setProperty("--ppqn", tm.ppqn);
  }, [tm.ppqn, sequencerRef.current]);
  useEffect(() => {
    timerWorker.addEventListener("message", ({data}) => {
      if (!data.ticks) return;
      for (let i in midiInfo.tracks) {
        const track = midiInfo.tracks[i];
        while (track.length && track[0].t <= data.ticks) {
          const e = track.shift();
          if (e.channel) {
            eventPipe.postMessage(e.channel);
            ranEvents.push({event: e, ch: i});
          }
        }
      }

      if (tempos[1] && data.ticks > tempos[1].t) {
        setTM({
          ...tm,
          msqn: tempos[1].tempo,
        });
        tempos.shift();
      }
      setNow(data);
    });
  }, [
    timerWorker,
    eventPipe,
    midiInfo.tracks,
    tempos,
    setTM,
    tm,
    ppqn,
    midioutput,
    msqn,
  ]);
  useEffect(() => {
    if (!sequencerRef.current) return;
    let id1, id2;
    let ref = sequencerRef.current;
    id1 = requestAnimationFrame(() => {
      id2 = requestIdleCallback(() =>
        ref.style.setProperty("--timer-ticks", ticks)
      )
    });

    return () => {
      cancelAnimationFrame(id1);
      cancelIdleCallback(id2);
    }
  }, [sequencerRef.current, ticks]);

  useEffect(() => {
    // return;
    for (const events of midiInfo.tracks) {
      const notesDown = new Map();
      drawEventList(events, notesDown);
    }
  }, [midiInfo.tracks]);

  const mkbtn = (cmd) => (
    <input
      type="button"
      key={cmd}
      onClick={() => {
        timerWorker.postMessage({cmd});
        if (Object.keys(cmd2stateChange).indexOf(cmd) > -1) {
          setTimerState(cmd2stateChange[cmd]);
        }
      }}
      value={cmd}
    />
  );

  return (
    <main className="container">
      <Space key="adf">
        <span>
          clock: {(clock / 1000).toFixed(2).toString().split(".").join(":")}
        </span>
        <span>
          {available_btns[timerState].map((cmd) => (
            <input
              type="button"
              key={cmd}
              onClick={() => {
                timerWorker.postMessage({cmd});
                if (Object.keys(cmd2stateChange).indexOf(cmd) > -1) {
                  setTimerState(cmd2stateChange[cmd]);
                }
              }}
              value={cmd}
            />
          ))}
        </span>

        <span>Bar: {~~(ticks / tm.ppqn)}</span>
        <input
          type="number"
          step="1"
          width={6}
          label="bpm"
          key="adfda"
          onInput={(e, v) => {
            setTempo(parseInt(e.target.value));
          }}
          defaultValue={tempo}
          min={30}
          max={600}
        />
        <input
          type="number"
          label="timesig"
          onInput={(e) => setTS1(parseInt(e.target.value))}
          value={ts1}
          key="adsf"
          min={2}
          max={8}
        />
      </Space>
      <SendMidi style={{position: "fixed", top: 0, right: 0}}
          onMidiConnected={(outputChannel) => {
            midioutput.current = outputChannel;
          }}
      />
      <div key={1} className="canvas_window">
        <div className="canvas_container" ref={sequencerRef}>
          {channels.map((ch) => (
            <div key={ch} style={{paddingTop: 10}}>
              <Sequence
                preset={presetMap[ch]}
                ref={(element) => chRef.current.push(element)}
                width={nbars * 40} //bw
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
    </main>
  );
  function drawEventList(events, notesDown) {
    for (const event of events) {
      if (!event.channel) continue;
      const [status, key, vel] = event.channel;
      const cmd = status >> 4,
        ch = status & 0x0f;
      const onNoteUp = (event) => {
        if (notesDown.has(key)) {
          const t2 = event.t;
          const on_env = notesDown.get(key);
          chRef.current[ch].drawBarN(on_env.t1, t2, key, vel);
          notesDown.delete(key);
        }
      };
      switch (cmd) {
        case 0x09:
          if (vel > 0) notesDown.set(key, {t1: event.t, key, vel});
          else onNoteUp(event);
          break;
        case 0x08:
          onNoteUp(event);
          break;
        default:
          break;
      }
    }
  }
}

export default App;
function get_time_base(midiInfo) {
  return {
    ppqn: midiInfo.division,
    msqn: midiInfo.tempos?.[0].tempo || 50000,
    ts: midiInfo.time_base.relative_ts,
    ts1: midiInfo.time_base.numerator,
    ts2: midiInfo.time_base.denum,
  };
}
