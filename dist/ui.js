const daw = document.createElement("table");
const rowheight = 40, colwidth = 80;
const pixelPerDecibel = rowheight;
const pixelPerSec = colwidth / 2;
export class TrackUI {
  constructor(container) {
    container.innerHTML += `<tr>
  <td>
    <select></select>
  </td>
  <td><input type="checkbox" /></td>
  <td>
    <meter value="0" min="0" max="127" step="1"></meter>
  </td>
  <td>
    <meter value="0" min="0" max="127" step="1"></meter>
  </td>
  <td>
    <input type="range" value="0" min="0" max="127" step="1" />
  </td>
  <td><input type="range" value="0" min="0" max="127" step="1" /></td>
  <td><input type="number" maxlength="2" size="4" value="0" /></td>
  <td>
    <svg width="80" height="30">
      <polyline points="" stroke="black" stroke-width="1"></polyline>
    </svg>
  </td>
  <td>
    <svg width="80" height="30">
      <polyline points="" stroke="black" stroke-width="1"></polyline>
    </svg>
  </td>
</tr>
`;
    this.preset = container.querySelector("select");
    this.meters = container.querySelectorAll("meter");
    this.led = container.querySelector("input[type=checkbox");
    this.polylines = Array.from(container.querySelectorAll("meter"));
  }
  set pid(id) {
    this.preset.value = id;
  }
  onload() {
    this.preset.append(datalist());
  }
  set midi(v) {
    this.meters[0].value = v;
  }
  set velocity(v) {
    this.meters[1].value = v;
  }
  set active(b) {
    b
      ? this.led.setAttribute("checked", "checked")
      : this.led.removeAttribute("checked");
  }
  set env1({ phases: [a, d, s, r], peak }) {
    const points = [
      [0, 0],
      [a, 1],
      [a + d, (100 - s) / 100],
      [a + d + r, 0],
    ]
      .map(([x, y]) => [x * pixelPerSec, rowheight - y * rowheight].join(","))
      .join(" ");
    console.log(points);
    this.polylines[0].setAttribute("points", points);
  }
  set env2({ phases: [a, d, s, r], peak }) {
    const points = [
      [0, 0],
      [a, 1],
      [a + d, (100 - s) / 100],
      [a + d + r, 0],
    ]
      .map(([x, y]) => x * pixelPerSec + "," + y * pixelPerDecibel)
      .join(" ");
    console.log(points);
    this.polylines[1].setAttribute("points", points);
  }
  set zone(z) {
    this.env1 = {
      phases: [z.VolEnvAttack, z.VolEnvDecay, z.VolEnvSustain, z.VolEnvRelease],
      peak: 100 - z.Attenuation / 10,
    };
  }
}
export function mkui() {
  return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(
    (t) => new TrackUI(daw)
  );
}
export const insts = "acoustic_grand_piano,bright_acoustic_piano,electric_grand_piano,honkytonk_piano,electric_piano_1,electric_piano_2,harpsichord,clavinet,celesta,glockenspiel,music_box,vibraphone,marimba,xylophone,tubular_bells,dulcimer,drawbar_organ,percussive_organ,rock_organ,church_organ,reed_organ,accordion,harmonica,tango_accordion,acoustic_guitar_nylon,acoustic_guitar_steel,electric_guitar_jazz,electric_guitar_clean,electric_guitar_muted,overdriven_guitar,distortion_guitar,guitar_harmonics,acoustic_bass,electric_bass_finger,electric_bass_pick,fretless_bass,slap_bass_1,slap_bass_2,synth_bass_1,synth_bass_2,violin,viola,cello,contrabass,tremolo_strings,pizzicato_strings,orchestral_harp,timpani,string_ensemble_1,string_ensemble_2,synth_strings_1,synth_strings_2,choir_aahs,voice_oohs,synth_choir,orchestra_hit,trumpet,trombone,tuba,muted_trumpet,french_horn,brass_section,synth_brass_1,synth_brass_2,soprano_sax,alto_sax,tenor_sax,baritone_sax,oboe,english_horn,bassoon,clarinet,piccolo,flute,recorder,pan_flute,blown_bottle,shakuhachi,whistle,ocarina,lead_1_square,lead_2_sawtooth,lead_3_calliope,lead_4_chiff,lead_5_charang,lead_6_voice,lead_7_fifths,lead_8_bass__lead,pad_1_new_age,pad_2_warm,pad_3_polysynth,pad_4_choir,pad_5_bowed,pad_6_metallic,pad_7_halo,pad_8_sweep,fx_1_rain,fx_2_soundtrack,x_3_crystal,fx_4_atmosphere,fx_5_brightness,fx_6_goblins,fx_7_echoes,fx_8_scifi,sitar,banjo,shamisen,koto,kalimba,bagpipe,fiddle,shanai,tinkle_bell,agogo,steel_drums,woodblock,taiko_drum,melodic_tom,synth_drum,reverse_cymbal,guitar_fret_noise,breath_noise,seashore,bird_tweet,telephone_ring,helicopter,applause,gunshot".split(",");
export function datalist() {
    const instSelect = document.createElement("datalist");
    insts.forEach((v, idx) => instSelect.appendChild(new Option(v, `${idx}`)));
    return instSelect;
}
