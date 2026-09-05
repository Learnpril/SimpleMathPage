/** A Bezier with draggable handles, and de Casteljau's repeated lerping built in front of you. */
import {
  makeCanvas2D,
  addDragTargets,
  dot as fillDot,
  label,
  line,
} from "../canvas2d.ts";
// From `controls.ts`, not `ui.ts`: the latter imports Three.js and this track must not.
import {
  addButtonRow,
  addCheckbox,
  addReadout,
  addSlider,
} from "../controls.ts";
import { deCasteljau } from "../../../gamedev2d/bezier2d.ts";
import {
  PRESETS,
  VIEW,
  clampToBounds,
  outline,
  screenOf,
  worldOf,
} from "./path-shared.ts";
import type { MountFn } from "../runner.ts";

const CURVE = "#58a6ff";
const HULL = "#3b4552";
const ANCHOR = "#7ee787";
const HANDLE = "#d2a8ff";
const BUILD = "#f0883e";
const HERE = "#ffd866";
const TEXT = "#9198a1";
const DIM = "#636c76";

const mount: MountFn = (el) => {
  const { ctx, canvas, clear } = makeCanvas2D(el, VIEW.height);

  let points = PRESETS[0].points.map((p) => ({ ...p }));

  const show = addReadout(el);
  const note = addReadout(el);
  const time = addSlider(el, "t", 0, 1, 0.35, draw, "", 0.01);
  const building = addCheckbox(
    el,
    "show de Casteljau's construction (the lerps that find the point)",
    true,
    draw,
  );
  const setActive = addButtonRow(
    el,
    PRESETS.map((preset, index) => ({
      label: preset.name,
      apply: () => {
        points = preset.points.map((p) => ({ ...p }));
        setActive(index);
        draw();
      },
    })),
  );
  setActive(0);

  // Dragging is the natural way in; the preset buttons above are the keyboard path to the same shapes.
  const stopDragging = addDragTargets(
    canvas,
    () => points.map(screenOf),
    (index, x, y) => {
      points[index] = clampToBounds(worldOf(x, y));
      draw();
    },
  );

  function draw() {
    clear();
    const t = time();
    const at = (p: { x: number; y: number }) => screenOf(p);

    // The control polygon. The curve leans toward it and stays inside it, never crossing out.
    for (let i = 1; i < points.length; i += 1) {
      line(ctx, at(points[i - 1]), at(points[i]), HULL, {
        dashed: true,
        width: 1,
      });
    }

    // The curve itself.
    ctx.save();
    ctx.strokeStyle = CURVE;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    outline(points).forEach((p, i) => {
      const q = at(p);
      if (i === 0) ctx.moveTo(q.x, q.y);
      else ctx.lineTo(q.x, q.y);
    });
    ctx.stroke();
    ctx.restore();

    /* Every intermediate level of the construction. The last pair before the answer is the tangent
       line, which is why the facing direction in the next scene is not a separate idea. */
    const { levels, point } = deCasteljau(points, t);
    if (building()) {
      levels.slice(1, -1).forEach((level) => {
        for (let i = 1; i < level.length; i += 1) {
          line(ctx, at(level[i - 1]), at(level[i]), BUILD, { width: 1.2 });
        }
        for (const p of level) {
          const q = at(p);
          fillDot(ctx, q.x, q.y, 3, BUILD);
        }
      });
    }

    // The control points. Ends the curve passes through, handles it only leans toward.
    points.forEach((p, i) => {
      const q = at(p);
      const isEnd = i === 0 || i === points.length - 1;
      fillDot(ctx, q.x, q.y, isEnd ? 6 : 5, isEnd ? ANCHOR : HANDLE);
      label(ctx, `P${i}`, q.x + 9, q.y - 8, isEnd ? ANCHOR : HANDLE);
    });

    const here = at(point);
    fillDot(ctx, here.x, here.y, 5.5, HERE);
    label(ctx, `t = ${t.toFixed(2)}`, here.x + 10, here.y + 16, HERE);

    label(
      ctx,
      "drag any point \u00b7 green ends are on the curve, purple handles are not",
      12,
      VIEW.height - 10,
      DIM,
    );

    const degree = points.length - 1;
    show(
      `${degree === 2 ? "quadratic" : "cubic"}, ${points.length} control points \u00b7 ` +
        `${levels.length - 1} rounds of lerping, ${levels.slice(1).reduce((n, level) => n + level.length, 0)} lerps in all`,
    );
    note(
      building()
        ? "each orange level is the one above it, lerped by t \u2014 the last orange segment is the curve's tangent"
        : `the curve touches P0 and P${degree} and leans toward the rest, which is why the handles are a shape you steer with rather than points you route through`,
    );
  }

  draw();

  return stopDragging;
};

export default mount;
