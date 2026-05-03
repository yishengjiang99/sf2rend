import { DRUMSCHANNEL, midi_ch_cmds, midi_effects } from "./constants.js";

export function createChannel(channelId, sf2, apath, hooks = {}) {
  let currentSf2 = sf2;
  let program = null;
  let bankId = channelId === DRUMSCHANNEL ? 128 : 0;
  const spinner = apath.spinner;
  const activeNotes = new Set();

  function notify(name, payload) {
    hooks[name]?.(payload);
  }

  return {
    getBankId() {
      return bankId;
    },
    setSF2(nextSf2) {
      currentSf2 = nextSf2;
    },
    async setProgram(pid, nextBankId = bankId) {
      bankId = nextBankId;
      if (!currentSf2) {
        notify("onProgramMissing", { pid, bankId });
        return null;
      }

      const nextProgram = currentSf2.loadProgram(pid, bankId);
      if (!nextProgram) {
        notify("onProgramMissing", { pid, bankId });
        return null;
      }

      await spinner.shipProgram(nextProgram, pid | bankId);
      program = nextProgram;
      notify("onProgramLoaded", {
        bankId,
        name: nextProgram.name,
        pid,
        presetId: pid | bankId,
        zone: nextProgram.filterKV(-1, -1)[0] ?? null,
      });
      return nextProgram;
    },
    setCC({ cc, value }) {
      if (cc === midi_effects.bankselectcoarse) {
        bankId = value << 7;
      } else if (cc === midi_effects.bankselectfine) {
        bankId |= value;
      }
      notify("onCCChange", { bankId, cc, value });
    },
    keyOn(key, velocity) {
      if (!program) {
        return null;
      }
      const zones = program.filterKV(key, velocity);
      if (!zones.length) {
        return null;
      }
      zones.forEach((zone) => {
        spinner.port.postMessage([
          midi_ch_cmds.note_on,
          channelId,
          key,
          velocity,
          zone.arr,
        ]);
      });
      const zone = zones[0] ?? null;
      activeNotes.add(key);
      notify("onKeyOn", {
        activeNotes: activeNotes.size,
        key,
        velocity,
        zone,
      });
      return zone;
    },
    keyOff(key, velocity) {
      if (!activeNotes.has(key)) {
        return;
      }
      spinner.port.postMessage([midi_ch_cmds.note_off, channelId, key, velocity]);
      activeNotes.delete(key);
      notify("onKeyOff", {
        activeNotes: activeNotes.size,
        key,
        velocity,
      });
    },
  };
}
