/* eslint-disable no-undef */
const keys = ["a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j"];
function Keyboard({ callback, channel, keyRange }) {
  React.useEffect(() => {
    window.onkeydown = (e) => {
      console.log(e.key);
      const index = keys.indexOf(e.key);
      if (index < 0) return;
      callback([0x90 | channel, index + 45, 120]);
    };
    window.onkeyup = (e) => {
      const index = keys.indexOf(e.target.key);
      if (index < 0) return;
      callback([0x80 | channel, index + 45, 0]);
    };
  }, []);

  return (
    // eslint-disable-next-line react/react-in-jsx-scope
    <ul className="keylist">
      {keyRange.map((midi, i) => {
        return (
          // eslint-disable-next-line react/react-in-jsx-scope
          <li
            key={midi + Math.random(45)}
            className={
              [1, 3, 6, 8, 11].includes((midi - 45) % 12)
                ? "keyblack"
                : "keywhite"
            }
            onMouseDown={(e) => {
              callback([0x90 | channel, midi, 120]);
            }}
            onMouseUp={(e) => {
              callback([0x80 | channel, midi, 120]);
            }}
          >
            {midi}
          </li>
        );
      })}
    </ul>
  );
}

function Track({ channel, isActive, callback }) {
  return (
    <div>
      <select
        defaultValue={channel.cid}
        onInput={(e) =>
          callback([cmds.change_program | channel.id, e.target.value])
        }
      >
        {Array.from(document.querySelector("datalist[id=programs]").options)
          .map((o) => o.value)
          .map((name, pid) => (
            <option key={pid + channel.cid} value={pid}>
              {name}
            </option>
          ))}
      </select>
    </div>
  );
}

function PresetList({ programNames, keyRange, eventPipe }) {
  const [activeChannel, setActiveChannel] = React.useState(0);
  const [channels, setChannels] = React.useState(
    programNames.map((n, i) => ({
      cid: i,
      name: n,
      isActive: i === activeChannel,
    }))
  );

  React.useEffect(() => {
    function onMsg([a, b, c]) {
      const cmd = a & 0xf0;
      const ch = a & 0x0f;
      const key = b & 0x7f;
      if (cmd === cmd.change_program) {
        setChannels(channels.map((c) => (cid === ch ? c : { ...c, cid: ch })));
      }
    }
    eventPipe.onmessage = onMsg;
  }, []);

  return (
    <React.Fragment>
      {channels.map((channel, pdx) => (
        <div style={{ padding: 10 }} key={pdx}>
          <Track
            key={channel.cid}
            callback={eventPipe.postMessage}
            channel={channel}
            isActive={channel.id === activeChannel}
          />
          <button onClick={() => setActiveChannel(pdx)}>active</button>
          {pdx === activeChannel ? "active channel" : ""}
        </div>
      ))}
      {ReactDOM.createPortal(
        <Keyboard
          callback={eventPipe.postMessage}
          channel={activeChannel}
          keyRange={keyRange}
        />,
        document.querySelector("footer")
      )}
    </React.Fragment>
  );
}
window.mkTracks = function (elem, { programNames, keyRange, eventPipe }) {
  ReactDOM.createRoot(document.querySelector("aside")).render(
    React.createElement(PresetList, {
      programNames,
      keyRange,
      eventPipe,
    })
  );
};
const cmds = {
  change_program: 0xc0,
  continuous_change: 0xb0,
  note_on: 0x90,
  note_off: 0x80,
  keyaftertouch: 0xa0, // 10
  pitchbend: 0xe0, // 14
};

const midi_effects = {
  bankselectcoarse: 0,
  modulationwheelcoarse: 1,
  breathcontrollercoarse: 2,
  footcontrollercoarse: 4,
  portamentotimecoarse: 5,
  dataentrycoarse: 6,
  volumecoarse: 7,
  balancecoarse: 8,
  pancoarse: 10,
  expressioncoarse: 11,
  pitchbendcoarse: 12,
  effectcontrol2coarse: 13,
  generalpurposeslider1: 16,
  generalpurposeslider2: 17,
  generalpurposeslider3: 18,
  generalpurposeslider4: 19,
  bankselectfine: 32,
  modulationwheelfine: 33,
  breathcontrollerfine: 34,
  footcontrollerfine: 36,
  portamentotimefine: 37,
  dataentryfine: 38,
  volumefine: 39,
  balancefine: 40,
  panfine: 42,
  expressionfine: 43,
  pitchbendfine: 44,
  effectcontrol2fine: 45,
  holdpedal: 64,
  portamento: 65,
  sustenutopedal: 66,
  softpedal: 67,
  legatopedal: 68,
  hold2pedal: 69,
  soundvariation: 70,
  resonance: 71,
  soundreleasetime: 72,
  soundattacktime: 73,
  brightness: 74,
  soundcontrol6: 75,
  soundcontrol7: 76,
  soundcontrol8: 77,
  soundcontrol9: 78,
  soundcontrol10: 79,
  generalpurposebutton1: 80,
  generalpurposebutton2: 81,
  generalpurposebutton3: 82,
  generalpurposebutton4: 83,
  reverblevel: 91,
  tremololevel: 92,
  choruslevel: 93,
  celestelevel: 94,
  phaserlevel: 95,
  databuttonincrement: 96,
  databuttondecrement: 97,
  nonregisteredparametercoarse: 98,
  nonregisteredparameterfine: 99,
  registeredparametercoarse: 100,
  registeredparameterfine: 101,
};
