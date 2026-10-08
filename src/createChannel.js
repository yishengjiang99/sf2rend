import { DRUMSCHANNEL, midi_ch_cmds, midi_effects } from "./constants.js";

/** presetId key: bank * 128 + pid (banks other than 0/128 must not collide). */
export const presetIdFor = (pid, bankId) => bankId * 128 + (pid & 0x7f);
export const pidOf = (presetId) => presetId % 128;
export const bankOf = (presetId) => Math.floor(presetId / 128);

export function createChannel(channelId, sf2, apath, hooks = {}) {
  let currentSf2 = sf2;
  let program = null;
  let bankMSB = channelId === DRUMSCHANNEL ? 1 : 0;
  let bankLSB = 0;
  let bankId = bankMSB * 128 + bankLSB;
  let loadToken = 0;
  let programChangePending = false;
  const spinner = apath.spinner;
  const activeNotes = new Map(); // key -> overlapping note-on count

  function notify(name, payload) {
    hooks[name]?.(payload);
  }

  function totalActiveNotes() {
    let total = 0;
    for (const count of activeNotes.values()) total += count;
    return total;
  }

  async function doSetProgram(pid, nextBankId, token) {
    if (!currentSf2) {
      notify("onProgramMissing", { pid, bankId: nextBankId });
      return null;
    }

    const nextProgram = currentSf2.loadProgram(pid, nextBankId);
    if (!nextProgram) {
      notify("onProgramMissing", { pid, bankId: nextBankId });
      return null;
    }

    // Network/sample download happens here; callers must not await this in
    // the MIDI hot path (the pipe fires and forgets).
    await spinner.shipProgram(nextProgram, presetIdFor(pid, nextBankId));
    if (token !== loadToken) {
      return null; // superseded by a newer program change
    }
    program = nextProgram;
    notify("onProgramLoaded", {
      bankId: nextBankId,
      name: nextProgram.name,
      pid,
      presetId: presetIdFor(pid, nextBankId),
      zone: nextProgram.filterKV(-1, -1)[0] ?? null,
    });
    return nextProgram;
  }

  return {
    getBankId() {
      return bankId;
    },
    /** True once a program has actually finished loading (not React state). */
    hasProgram() {
      return !!program;
    },
    isProgramChangePending() {
      return programChangePending;
    },
    getProgram() {
      return program;
    },
    setSF2(nextSf2) {
      currentSf2 = nextSf2;
      program = null;
    },
    setProgram(pid, nextBankId = bankId) {
      const token = ++loadToken;
      bankId = nextBankId;
      programChangePending = true;
      const job = doSetProgram(pid, nextBankId, token).finally(() => {
        if (token === loadToken) programChangePending = false;
      });
      // Swallow here; callers that care can still observe via hooks.
      job.catch(() => {});
      return job;
    },
    setCC({ cc, value }) {
      if (cc === midi_effects.bankselectcoarse) {
        bankMSB = value & 0x7f;
      } else if (cc === midi_effects.bankselectfine) {
        bankLSB = value & 0x7f;
      } else {
        notify("onCCChange", { bankId, cc, value });
        return;
      }
      bankId = bankMSB * 128 + bankLSB;
      notify("onCCChange", { bankId, cc, value });
    },
    keyOn(key, velocity, atTime) {
      if (!program) {
        return null;
      }
      const zones = program.filterKV(key, velocity);
      if (!zones.length) {
        return null;
      }
      // The zone already lives in worklet-owned WASM memory; send the
      // preset/zone reference, never the raw array. atTime (AudioContext
      // clock) enables lookahead scheduling; undefined plays immediately.
      const presetId = presetIdFor(program.pid, bankId);
      zones.forEach((zone) => {
        spinner.port.postMessage([
          midi_ch_cmds.note_on,
          channelId,
          key,
          velocity,
          presetId,
          zone.ref,
          atTime,
        ]);
      });
      const zone = zones[0] ?? null;
      activeNotes.set(key, (activeNotes.get(key) ?? 0) + 1);
      notify("onKeyOn", {
        activeNotes: totalActiveNotes(),
        key,
        velocity,
        zone,
      });
      return zone;
    },
    keyOff(key, velocity) {
      const count = activeNotes.get(key) ?? 0;
      if (count <= 0) {
        return;
      }
      // Overlapping note-ons on the same key need matching note-offs.
      if (count === 1) activeNotes.delete(key);
      else activeNotes.set(key, count - 1);
      spinner.port.postMessage([midi_ch_cmds.note_off, channelId, key, velocity]);
      notify("onKeyOff", {
        activeNotes: totalActiveNotes(),
        key,
        velocity,
      });
    },
    /** Keys currently sounding (for keyboard highlight). */
    soundingKeys() {
      return [...activeNotes.keys()];
    },
    releaseAllKeys() {
      for (const key of [...activeNotes.keys()]) {
        const count = activeNotes.get(key) ?? 0;
        for (let i = 0; i < count; i++) {
          spinner.port.postMessage([
            midi_ch_cmds.note_off,
            channelId,
            key,
            0,
          ]);
        }
      }
      activeNotes.clear();
      notify("onKeyOff", { activeNotes: 0, key: -1, velocity: 0 });
    },
  };
}
