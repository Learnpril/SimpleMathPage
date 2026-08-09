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

/**
 * A colour key, with room for a live value beside each entry.
 *
 * Needed whenever a scene draws several things in several colours. Each entry keeps its name in the
 * text it is handed rather than only in its swatch, so it still reads for someone who cannot tell
 * the colours apart - and so the numbers have something to attach to.
 */
export function addKey(
  el: HTMLElement,
  colors: number[],
): (texts: string[]) => void {
  const row = document.createElement("div");
  row.className = "demo-key";
  const labels = colors.map((color) => {
    const item = document.createElement("span");
    item.className = "demo-key-item";
    const swatch = document.createElement("span");
    swatch.className = "demo-swatch";
    swatch.style.background = `#${color.toString(16).padStart(6, "0")}`;
    const text = document.createElement("span");
    item.append(swatch, text);
    row.appendChild(item);
    return text;
  });
  el.appendChild(row);
  return (texts: string[]) => {
    texts.forEach((t, i) => {
      if (labels[i]) labels[i].textContent = t;
    });
  };
}

/**
 * A line through a list of points, safe to hand a **different number of points** each redraw.
 *
 * That is the whole reason it exists. `BufferGeometry.setFromPoints` allocates its buffer on the
 * first call and cannot grow it afterwards, so a path whose length changes - an arc that gets
 * longer as a slider moves, a trajectory that lands sooner - silently stops updating and logs
 * `Buffer size too small`. Reallocating when the count changes costs nothing at slider rates.
 *
 * Hiding is done with `visible`, never by passing an empty list: an empty list either poisons the
 * buffer for good or leaves the previous points in place and still drawn.
 */
export function addPolyline(
  scene: THREE.Scene,
  color: number,
  opts: { dashed?: boolean; dashSize?: number; gapSize?: number } = {},
): (points: THREE.Vector3[]) => void {
  const geom = new THREE.BufferGeometry();
  const mesh = new THREE.Line(
    geom,
    opts.dashed
      ? new THREE.LineDashedMaterial({
          color,
          dashSize: opts.dashSize ?? 0.2,
          gapSize: opts.gapSize ?? 0.16,
        })
      : new THREE.LineBasicMaterial({ color }),
  );
  scene.add(mesh);

  let capacity = 0;
  return (points: THREE.Vector3[]) => {
    mesh.visible = points.length > 1;
    if (!mesh.visible) return;
    if (points.length !== capacity) {
      geom.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(points.length * 3, 3),
      );
      capacity = points.length;
    }
    const position = geom.getAttribute("position") as THREE.BufferAttribute;
    points.forEach((p, i) => position.setXYZ(i, p.x, p.y, p.z));
    position.needsUpdate = true;
    geom.setDrawRange(0, points.length);
    geom.computeBoundingSphere();
    if (opts.dashed) mesh.computeLineDistances();
  };
}

/**
 * Stacked intervals on one shared axis, drawn flat under the scene.
 *
 * For comparing ranges of a parameter this beats drawing them into the 3D scene, and the
 * slab demo is why the helper exists: bars laid along the ray in 3D were foreshortened by
 * whatever angle the camera happened to be at, and any part of an interval before zero
 * appeared behind the ray's start, so three intervals that share an axis looked like three
 * unrelated line segments. Flat and stacked, an overlap is impossible to misread.
 *
 * Each row's label carries its own name and numbers, so the picture is a bonus rather than
 * the only way to read it.
 */
export function addTimeline(
  el: HTMLElement,
  title: string,
  colors: number[],
  from: number,
  to: number,
): (
  rows: Array<{ text: string; span: { from: number; to: number } | null }>,
) => void {
  const span = to - from;
  const at = (v: number) =>
    `${((Math.min(Math.max(v, from), to) - from) / span) * 100}%`;

  const wrap = document.createElement("div");
  wrap.className = "demo-timeline";

  const heading = document.createElement("div");
  heading.className = "demo-tl-title";
  heading.textContent = title;
  wrap.appendChild(heading);

  const items = colors.map((color) => {
    const row = document.createElement("div");
    row.className = "demo-tl-row";
    const label = document.createElement("span");
    label.className = "demo-tl-label";
    const track = document.createElement("span");
    track.className = "demo-tl-track";
    const zero = document.createElement("span");
    zero.className = "demo-tl-zero";
    zero.style.left = at(0);
    const bar = document.createElement("span");
    bar.className = "demo-tl-bar";
    bar.style.background = `#${color.toString(16).padStart(6, "0")}`;
    track.append(zero, bar);
    row.append(label, track);
    wrap.appendChild(row);
    return { label, bar };
  });

  // One axis under the stack, with a tick where the ray starts.
  const axis = document.createElement("div");
  axis.className = "demo-tl-row demo-tl-axis";
  const axisPad = document.createElement("span");
  axisPad.className = "demo-tl-label";
  const axisTrack = document.createElement("span");
  axisTrack.className = "demo-tl-track";
  for (const [value, text] of [
    [from, `${from} m`],
    [0, "0, the start"],
    [to, `${to} m`],
  ] as const) {
    const tick = document.createElement("span");
    tick.className = "demo-tl-tick";
    tick.style.left = at(value);
    tick.textContent = text;
    axisTrack.appendChild(tick);
  }
  axis.append(axisPad, axisTrack);
  wrap.appendChild(axis);

  el.appendChild(wrap);
  return (rows) => {
    rows.forEach((r, i) => {
      if (!items[i]) return;
      items[i].label.textContent = r.text;
      const bar = items[i].bar;
      if (r.span === null || r.span.to <= from || r.span.from >= to) {
        bar.style.display = "none";
        return;
      }
      const lo = Math.max(r.span.from, from);
      const hi = Math.min(r.span.to, to);
      bar.style.display = hi > lo ? "block" : "none";
      bar.style.left = at(lo);
      bar.style.width = `${((hi - lo) / span) * 100}%`;
    });
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
