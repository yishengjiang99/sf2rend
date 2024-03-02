import { mkdiv } from "../mkdiv/mkdiv.js";

export function fa_switch_btn({ icons, id, ...etc }) {
  const [icn_on, icn_off] = icons;
  return mkdiv("div", { class: "toggle_fa" }, [
    mkdiv("input", { type: "checkbox", id, ...etc }),
    `<label class="toggle" for="${id}">
      <i class='fas fa-circle ${icn_on}' style='font-size:22px'></i>
      <i class='fas ${icn_off}' style='font-size:22px'></i>
    </label>`,
  ]);
}

export function grid_tbl() {
  return `<svg width="2200" height="200">
      <defs>
        <pattern
          id="tenthGrid"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 10 0 L 0 0 0 10"
            fill="none"
            stroke="silver"
            stroke-width="0.5"
          />
        </pattern>
        <pattern
          id="grid"
          width="100"
          height="100"
          patternUnits="userSpaceOnUse"
        >
          <rect width="100" height="100" fill="url(#tenthGrid)" />
          <path
            d="M 100 0 L 0 0 0 100"
            fill="none"
            stroke="gray"
            stroke-width="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>`;
}
