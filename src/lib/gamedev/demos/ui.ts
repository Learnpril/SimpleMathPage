/**
 * The boring parts of a scene: making a canvas, adding a labelled slider, adding a
 * checkbox, adding a line of text under the picture.
 *
 * These live here so the scene files shown in the lessons stay short and stay about the
 * maths. Every control is a real `<input>` with a visible label, so it works by keyboard.
 */
import * as THREE from "three";

const DARK_BG = 0x0d1117;
const LIGHT_BG = 0xf8f9fa;

/** A sized, theme-aware canvas appended to the panel. */
export function makeCanvas(el: HTMLElement, height = 300) {
  const width = Math.min(el.clientWidth || 620, 620);
  const isDark = document.documentElement.dataset.theme !== "light";
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  el.appendChild(renderer.domElement);
  return {
    renderer,
    width,
    height,
    isDark,
    background: new THREE.Color(isDark ? DARK_BG : LIGHT_BG),
  };
}

/**
 * A labelled slider with a live numeric readout.
 *
 * Returns a getter for its value, with a `.set()` attached so a preset button can move it.
 * Setting does not fire the input event, so the caller redraws once after setting them all
 * rather than once per slider.
 */
export type Slider = (() => number) & { set: (v: number) => void };

export function addSlider(
  el: HTMLElement,
  label: string,
  min: number,
  max: number,
  value: number,
  onInput: () => void,
  suffix = "\u00B0",
  step = 1,
): Slider {
  const row = document.createElement("div");
  row.className = "demo-row";
  const id = `demo-${label.replace(/\W+/g, "-").toLowerCase()}`;

  const text = document.createElement("label");
  text.textContent = label;
  text.htmlFor = id;

  const input = document.createElement("input");
  input.type = "range";
  input.id = id;
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);

  const out = document.createElement("output");
  const show = () => {
    out.textContent = `${input.value}${suffix}`;
  };
  input.addEventListener("input", () => {
    show();
    onInput();
  });
  show();

  row.append(text, input, out);
  el.appendChild(row);

  const get = (() => parseFloat(input.value)) as Slider;
  get.set = (v: number) => {
    input.value = String(v);
    show();
  };
  return get;
}

/** A labelled checkbox. Returns a getter for its state. */
export function addCheckbox(
  el: HTMLElement,
  label: string,
  checked: boolean,
  onChange: () => void,
): () => boolean {
  const wrap = document.createElement("label");
  wrap.className = "demo-check";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = checked;
  input.addEventListener("change", onChange);
  const text = document.createElement("span");
  text.textContent = label;
  wrap.append(input, text);
  el.appendChild(wrap);
  return () => input.checked;
}

/**
 * A grid of numbers under the scene, for showing a matrix as it changes.
 *
 * Cells are tagged by region so CSS can colour the translation column separately from the
 * rotation-and-scale block. Seeing which numbers move when you drag a slider is most of
 * what makes a matrix stop feeling arbitrary.
 */
export function addMatrixGrid(
  el: HTMLElement,
  cols: number,
  regionOf: (row: number, col: number) => string,
): (rows: number[][]) => void {
  const wrap = document.createElement("div");
  wrap.className = "demo-matrix";
  wrap.style.setProperty("--demo-matrix-cols", String(cols));
  el.appendChild(wrap);

  const cells: HTMLElement[] = [];
  return (rows: number[][]) => {
    if (cells.length === 0) {
      rows.forEach((r, ri) =>
        r.forEach((_, ci) => {
          const cell = document.createElement("span");
          cell.className = "demo-cell";
          cell.dataset.region = regionOf(ri, ci);
          wrap.appendChild(cell);
          cells.push(cell);
        }),
      );
    }
    let n = 0;
    for (const r of rows) {
      for (const v of r) {
        // Round away the dust so a rotation reads as 0.71 rather than 0.7071067811865476.
        cells[n].textContent = (Math.abs(v) < 5e-3 ? 0 : v).toFixed(2);
        n += 1;
      }
    }
  };
}

/** One line of text under the picture. Returns a setter. */
export function addReadout(el: HTMLElement): (text: string) => void {
  const div = document.createElement("div");
  div.className = "demo-readout";
  el.appendChild(div);
  return (text: string) => {
    div.textContent = text;
  };
}

/**
 * A row of preset buttons, for jumping a scene to an interesting configuration.
 *
 * Worth having when a scene has several sliders: finding "a rotation by 45 degrees" by
 * dragging four of them is not a thing anyone will do, so hand it over directly.
 */
export function addButtonRow(
  el: HTMLElement,
  presets: Array<{ label: string; apply: () => void }>,
): (active: number) => void {
  const row = document.createElement("div");
  row.className = "demo-presets";
  const buttons: HTMLButtonElement[] = [];
  for (const p of presets) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "demo-btn";
    b.textContent = p.label;
    b.addEventListener("click", p.apply);
    row.appendChild(b);
    buttons.push(b);
  }
  el.appendChild(row);

  /* Only a caller that uses this gets `aria-pressed`, because on a row of one-shot presets
     a permanently-false pressed state would be a lie told to a screen reader. */
  return (active: number) => {
    buttons.forEach((b, i) =>
      b.setAttribute("aria-pressed", String(i === active)),
    );
  };
}

/**
 * A plain push button.
 *
 * Note there is deliberately no "hold these keys" control here. A reader with a mouse has
 * one pointer, so any demo that needs two inputs at once is unusable for most people -
 * which is why the movement demo sweeps a direction with a slider instead.
 */
export function addButton(
  el: HTMLElement,
  label: string,
  onClick: () => void,
): void {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "demo-btn";
  b.textContent = label;
  b.addEventListener("click", onClick);
  el.appendChild(b);
}

/** The eight corners of a unit cube centred on the origin. */
const BOX_CORNERS: ReadonlyArray<readonly [number, number, number]> = [
  [-0.5, -0.5, -0.5],
  [0.5, -0.5, -0.5],
  [0.5, -0.5, 0.5],
  [-0.5, -0.5, 0.5],
  [-0.5, 0.5, -0.5],
  [0.5, 0.5, -0.5],
  [0.5, 0.5, 0.5],
  [-0.5, 0.5, 0.5],
];

/** Its twelve edges, as pairs of corner indices. */
const BOX_EDGES: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];

/** Where a corner of the box ends up once a transform has been applied to it. */
export type Place = (
  corner: readonly [number, number, number],
) => [number, number, number];

/**
 * A wireframe box in a scene, redrawn by handing it a function that places its corners.
 *
 * Keeping the corner list here rather than in each scene means a scene file reads as the
 * transform it is demonstrating instead of twenty lines of cube vertices.
 */
export function addBoxWire(
  scene: THREE.Scene,
  color: number,
  opts: { dashed?: boolean } = {},
): (place: Place) => void {
  const geom = new THREE.BufferGeometry();
  geom.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(BOX_EDGES.length * 6), 3),
  );
  const mesh = new THREE.LineSegments(
    geom,
    opts.dashed
      ? new THREE.LineDashedMaterial({
          color,
          dashSize: 0.12,
          gapSize: 0.1,
        })
      : new THREE.LineBasicMaterial({ color }),
  );
  scene.add(mesh);

  return (place: Place) => {
    const pts: THREE.Vector3[] = [];
    for (const [a, b] of BOX_EDGES) {
      pts.push(
        new THREE.Vector3(...place(BOX_CORNERS[a])),
        new THREE.Vector3(...place(BOX_CORNERS[b])),
      );
    }
    geom.setFromPoints(pts);
    if (opts.dashed) mesh.computeLineDistances();
  };
}
