/** Two places and the displacement between them, with an origin you can move out from under both. */
import {
  makeCanvas2D,
  addDragTargets,
  arrow,
  dot,
  label,
  line,
} from "../canvas2d.ts";
// From `controls.ts`, not `ui.ts`: the latter imports Three.js and this track must not.
import { addSlider, addReadout, addButtonRow } from "../controls.ts";
import {
  pixelsPerUnit,
  screenToWorld,
  worldToScreen,
} from "../../../gamedev2d/screen.ts";
import {
  START_A,
  START_B,
  VIEW,
  WORLD_HEIGHT,
  readings,
} from "./arrow-shared.ts";
import type { MountFn } from "../runner.ts";

const GRID = "#252b33";
const ORIGIN = "#f0883e";
const PLACE = "#d2a8ff";
const BETWEEN = "#39d3c3";
const TEXT = "#9198a1";

const mount: MountFn = (el) => {
  const { ctx, canvas, width, height, clear } = makeCanvas2D(el, 330);

  let a = { ...START_A };
  let b = { ...START_B };
  let picked = 0;

  const show = addReadout(el);
  const note = addReadout(el);
  const mark = addButtonRow(el, [
    { label: "move A", apply: () => pick(0) },
    { label: "move B", apply: () => pick(1) },
  ]);
  const px = addSlider(
    el,
    "x of the picked place",
    0,
    16,
    START_A.x,
    fromSliders,
    "",
    0.1,
  );
  const py = addSlider(
    el,
    "y of the picked place",
    0,
    8.7,
    START_A.y,
    fromSliders,
    "",
    0.1,
  );
  const shift = addSlider(
    el,
    "slide the origin sideways",
    -6,
    6,
    0,
    draw,
    " units",
    0.5,
  );

  function pick(which: number) {
    picked = which;
    const p = which === 0 ? a : b;
    px.set(p.x);
    py.set(p.y);
    draw();
  }

  function fromSliders() {
    const p = { x: px(), y: py() };
    if (picked === 0) a = p;
    else b = p;
    draw();
  }

  // Dragging is a convenience; the sliders above are the accessible path to the same values.
  const stopDragging = addDragTargets(
    canvas,
    () => [worldToScreen(a, VIEW), worldToScreen(b, VIEW)],
    (index, x, y) => {
      const world = screenToWorld({ x, y }, VIEW);
      const clamped = {
        x: Math.min(Math.max(world.x, 0), 16),
        y: Math.min(Math.max(world.y, 0), WORLD_HEIGHT),
      };
      if (index === 0) a = clamped;
      else b = clamped;
      picked = index;
      px.set(clamped.x);
      py.set(clamped.y);
      draw();
    },
  );

  function draw() {
    clear();
    const scale = pixelsPerUnit(VIEW);
    const origin = { x: shift(), y: 0 };

    for (let u = 0; u <= 16; u += 1) {
      const x = u * scale;
      line(ctx, { x, y: 0 }, { x, y: height }, GRID, { width: 1 });
    }
    for (let v = 0; v <= Math.ceil(WORLD_HEIGHT); v += 1) {
      const y = height - v * scale;
      line(ctx, { x: 0, y }, { x: width, y }, GRID, { width: 1 });
    }

    // The origin everything is measured from, drawn where it currently sits.
    const originAt = worldToScreen(origin, VIEW);
    arrow(ctx, originAt, { x: originAt.x + 52, y: originAt.y }, ORIGIN, 1.4);
    arrow(ctx, originAt, { x: originAt.x, y: originAt.y - 52 }, ORIGIN, 1.4);
    dot(ctx, originAt.x, originAt.y, 4, ORIGIN);
    label(ctx, "origin", originAt.x + 6, originAt.y + 14, ORIGIN);

    const r = readings(a, b, origin);
    const aAt = worldToScreen(a, VIEW);
    const bAt = worldToScreen(b, VIEW);

    // Each place, as a measurement from the origin.
    for (const [p, at, name] of [
      [r.a, aAt, "A"],
      [r.b, bAt, "B"],
    ] as const) {
      line(ctx, originAt, at, PLACE, { dashed: true, width: 1 });
      dot(ctx, at.x, at.y, 6, PLACE);
      label(
        ctx,
        `${name} (${p.x.toFixed(1)}, ${p.y.toFixed(1)})`,
        at.x + 10,
        at.y - 8,
        PLACE,
      );
    }

    // The displacement, which belongs to neither place.
    arrow(ctx, aAt, bAt, BETWEEN, 2.4);
    label(
      ctx,
      `B - A = (${r.between.x.toFixed(1)}, ${r.between.y.toFixed(1)})`,
      (aAt.x + bAt.x) / 2 + 8,
      (aAt.y + bAt.y) / 2 + 16,
      BETWEEN,
    );
    label(ctx, "drag either place, or use the sliders", 8, 16, TEXT);

    mark(picked);
    show(
      `A and B read (${r.a.x.toFixed(1)}, ${r.a.y.toFixed(1)}) and (${r.b.x.toFixed(1)}, ${r.b.y.toFixed(1)}) \u00B7 ` +
        `the arrow between them is (${r.between.x.toFixed(1)}, ${r.between.y.toFixed(1)})`,
    );
    note(
      `slide the origin and both places get new numbers, the arrow keeps its own \u00B7 ` +
        `A + B would be (${r.sum.x.toFixed(1)}, ${r.sum.y.toFixed(1)}), which moves too, which is why it means nothing`,
    );
  }

  draw();

  return stopDragging;
};

export default mount;
