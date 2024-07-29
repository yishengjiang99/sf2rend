import {SpinNode} from "../spin/spin.js";
import {midi_ch_cmds, midi_effects} from "./constants.js";
import FFTNode from "../fft-64bit/fft-node.js";
import {mkdiv} from "../mkdiv/mkdiv.js";
import {drawLoops} from "../volume-meter/main.js";
import createAudioMeter from "../volume-meter/volume-meter.js";
import {anti_denom_dither, delay} from "./misc.js";
import SF2Service from "../sf2-service/sf2.js";
import {attributeKeys, newSFZoneMap} from "../sf2-service/zoneProxy.js";
import {mkeventsPipe} from "./mkeventsPipe.js";
let init = false;
let sf2Service, listenerMaps, zoneListArr = [];
const msgcc = midi_ch_cmds.continuous_change;
const {change_program, continuous_change, note_on, note_off} = midi_ch_cmds;
export default async function mkpath(ctx, props) {
  if (!init) {
    await SpinNode.init(ctx).catch(console.trace);
    await FFTNode.init(ctx).catch(console.trace);
    init = true;
  }
  if (props.sf2Service) {
    sf2Service = props.sf2Service;
    await sf2Service.load({
      onZone: (pid, zoneRef, zoneArr) => {
        zoneListArr[pid] ||= [];
        zoneListArr[pid].push(newSFZoneMap(zoneRef, zoneArr));
      }
    })
  }

  const channelIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
  const drumsChannmel = [9];
  const spinner = new SpinNode(ctx);
  const lpfs = [];
  const mastGain = new GainNode(ctx, {gain: 12});
  //this.EQ = mk_eq_bar(0);
  const whitenoise = anti_denom_dither(ctx);
  const fft = new FFTNode(ctx);
  const clipdetect = createAudioMeter(ctx);
  const chPrograms = new Array(16);
  let mini_input = props.mini_input;
  if (!mini_input) {
    mini_input = mkeventsPipe();
    mini_input.onmessage(async (data) => {
      const [a, b, c] = data;
      const [cmd, ch, v1, v2] = [a & 0xf0, a & 0x0f, b, c];
      let bid;
      switch (cmd) {
        case midi_ch_cmds.change_program: {
          const pid = v1;
          if (drumsChannmel.includes(ch)) bid = 128;
          else bid = 0;
          const program = sf2Service.loadProgram(pid, bid);
          if (!program) throw "program not found " + pid + ":" + bid;
          chPrograms[ch] = program;
          await spinner.shipProgram(program, pid | bid);
          break;
        }
        case midi_ch_cmds.note_on: {
          const zones = chPrograms[ch].filterKV(v1, v2);
          zones.map((zone, i) => {
            if (zone.arr)
              spinner.port.postMessage([
                midi_ch_cmds.note_on |
                ch,
                v1,
                v2,
                zone.arr
              ]);
          });
          break;
        }
        default:
          spinner.port.postMessage(data);
          break;
      }

    })
  }

  whitenoise.connect(spinner);
  whitenoise.start();
  for (const id of channelIds) {
    spinner.connect(mastGain, id);
  }
  mastGain.connect(fft);
  mastGain.connect(clipdetect);
  mastGain.connect(ctx.destination);
  return {
    spinner,
    get sf2() {
      return sf2Service
    },
    async loadsf2(sf2url) {
      sf2Service.load();
    },
    async loadProgram(pid, bankid) {
      const p = sf2Service.loadProgram(pid, bankid);
      await spinner.shipProgram(p, pid | bankid);
      return p;
    },
    connect(destination, outputNumber, destinationInputNumber) {
      spinner.connect(destination, outputNumber, destinationInputNumber);
    },
    get msgPort() {
      return mini_input;
    },
    detectClips(canvas) {
      const timer = drawLoops(canvas, clipdetect);
      spinner.connect(clipdetect, 18);
      return function cleanup() {
        cancelAnimationFrame(timer);
      };
    },
    get analysis() {
      return {
        get waveForm() {
          return fft.getWaveForm();
        },
        get frequencyBins() {
          return fft.getFloatFrequencyData();
        },
      };
    },
    querySpState: async function aa(channelId) {
      spinner.port.postMessage({query: channelId});
      return await new Promise((resolve, reject) => {
        setTimeout(reject, 100);
        spinner.port.onmessage = ({data}) => {
          if (data.queryResponse) resolve(data.queryResponse);
        };
      });
    },
    loadPreset: spinner.shipProgram,
    eq_set(channel, freq, gain) {
      EQ.setGainAtFreq(channel, 8.176 * Math.pow(2, cents / 1200), Q / 10);
    },
    silenceAll() {
      mastGain.gain.linearRampToValueAtTime(0, ctx.baseLatency);
    },
    async mute(channel, bool) {
      this.startAudio();
      const ramp = bool ? [60, 44, 2] : [33, 55, 80];
      while (ramp.length) {
        midi_input.postMessage([
          midi_ch_cmds.continuous_change | channel,
          7,
          ramp.shift(),
        ]);
        await new Promise((r) => setTimeout(r, 5));
      }
    },
    async startAudio() {
      if (!ctx instanceof OfflineAudioContext && ctx.state !== "running")
        await ctx.resume();
    },
    ctrl_bar(container) {
      mkdiv(
        "select",
        {
          onselect: (e) => {
            spinner.port.postMessage({cmd: e.target.value});
          },
          placeholder: "send midi gm",
          value: null,
        },
        "cmd:|gm_reset|debug|panic".split("|").map((c) => new Option(c))
      ).attachTo(container);

      mkdiv("label", {for: "masterGainSlider"}, "master gain").attachTo(
        container
      );
      mkdiv("input", {
        type: "range",
        min: -260,
        max: 220,
        ariaLabel: "master g",
        oninput: (e) =>
          mastGain.gain.linearRampToValueAtTime(
            Math.pow(10, e.target.value / 200),
            ctx.baseLatency
          ),
        value: 0,
        title: "master G",
        step: 1,
      }).attachTo(container);
    },
    subscribeNextMsg: async function (precateFn) {
      return await new Promise((resolve, reject) => {
        setTimeout(reject, 2000);
        spinner.port.onmessage = ({data}) => {
          if (precateFn(data)) resolve(data);
        };
      });
    },
    bindReactiveElems: () => {
      const subscribers = Array.from(
        document.querySelectorAll("*[data-path_zdx]")
      );
      listenerMaps = subscribers.reduce((map, element) => {
        const channelId = element.dataset.p1;
        const zoneAttr = element.dataset.path_zdx;
        const zoneAttrIndex = attributeKeys.indexOf(zoneAttr);
        map[channelId] ||= [];
        map[channelId][zoneAttrIndex] ||= [];
        map[channelId][zoneAttrIndex].push(element);
        return map;
      }, {});
    },
    set_ch_zone(ch, zone) {
      for (let i = 0;i < 60;i++) {
        if (!listenerMaps[ch][i]) continue;
        for (const elem of listenerMaps[ch][i]) {
          elem.dataset.msb ? (elem.value = zone.arr[i] << 7) : zone.arr[i];
        }
      }
    },
    bindToolbar: function () {
      const inputboxes = document.querySelectorAll("[data-path_cmd]");
      inputboxes.forEach((b) => {
        if (!b.dataset.path_cmd) return;
        let cmd = b.dataset.path_cmd;
        let p1 = parseInt(b.dataset.p1 || "0");

        const run_cmd = (e) => {
          let value = b.type == "checkbox" ? b.checked : b.value;
          switch (cmd) {
            case "solo":
              {
                channelIds.forEach((id) => id != p1 && this.mute(id, value));
                const cc = midi_effects.volumecoarse;
                const sched_send_vals = [0, 50, 10, 99, 15, 126];
                sendSequence(sched_send_vals, p1, cc);
              }
              break;
            case "mute":
              this.mute(p1, value);
              break;
            case "gear":
              document
                .querySelector(`#setting_${p1}`)
                .setAttribute("checked", true);
              break;
            default:
              spinner.port.postMessage({
                cmd: b.dataset.cmd,
              });
              break;
          }
        };
        b.type == "button"
          ? b.addEventListener("click", run_cmd)
          : b.addEventListener("input", run_cmd);
      });
    },

    bindKeyboard: function (get_active_channel_fn) {
      const keys = ["a", "w", "s", "e", "d", "f", "t", "g", "y", "h", "u", "j"];
      window.onkeydown = (e) => {
        if (e.repeat) return;
        if (e.isComposing) return;
        const channel = get_active_channel_fn();
        const baseOctave = 48;

        const index = keys.indexOf(e.key);
        if (index < 0) return;
        const key = index + baseOctave;

        e.target.addEventListener(
          "keyup",
          () => {
            mini_input.postMessage([0x80 | channel, key, 55]);
          },
          {once: true}
        );
        console.log(key)
        mini_input.postMessage([0x90 | channel, key, 55]);
      };
    },
  };

  function sendSequence(sched_send_vals, p1, cc) {
    while (sched_send_vals.length) {
      const [sleepms, nextval] = [
        sched_send_vals.shift(),
        sched_send_vals.shift(),
      ];
      delay(sleepms);
      midi_input.postMessage([msgcc, p1, cc, nextval]);
    }
  }
}
