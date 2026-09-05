/** A sprite travelling the same curve, facing along the tangent, stepping by t or by distance. */
import {
  makeCanvas2D,
  addDragTargets,
  arrow,
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
import {
  arcTable,
  facingAt,
  fractionAtT,
  pointAt,
  tAtFraction,
} from "../../../gamedev2d/bezier2d.ts";
// The facing arrow is drawn from the angle rather than from the tangent, so a wrong angle shows.
import { directionFromAngle } from "../../../gamedev2d/angles2d.ts";
import {
  MARKS,
  PRESETS,
  VIEW,
  clampToBounds,
  markPoints,
  outline,
  screenOf,
  travelReport,
  worldOf,
} from "./path-shared.ts";
import type { MountFn } from "../runner.ts";

const CURVE = "#3b4552";
const MARK = "#58a6ff";
const SPRITE = "#7ee787";
const FACING = "#ffd866";
const BROKEN = "#ff7b72";
const HANDLE = "#636c76";
const DIM = "#636c76";

const mount: MountFn = (el) => {
  const { ctx, canvas, clear } = makeCanvas2D(el, VIEW.height);

  let points = PRESETS[1].points.map((p) => ({ ...p }));

  const show = addReadout(el);
  const note = addReadout(el);
  const progress = addSlider(el, "progress", 0, 1, 0.5, draw, "", 0.01);
  const byDistance = addCheckbox(
    el,
    "step by distance instead of by t (constant speed)",
    false,
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
  setActive(1);

  // Dragging explores; the presets are the keyboard path to the configurations worth seeing.
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
    const s = progress();
    const even = byDistance();
    const at = (p: { x: number; y: number }) => screenOf(p);
    const table = arcTable(points);
    // The one line that separates the two behaviours, and the whole Section is about it.
    const t = even ? tAtFraction(table, s) : s;

    // The path, drawn dim: it is the stage here rather than the subject.
    ctx.save();
    ctx.strokeStyle = CURVE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    outline(points).forEach((p, i) => {
      const q = at(p);
      if (i === 0) ctx.moveTo(q.x, q.y);
      else ctx.lineTo(q.x, q.y);
    });
    ctx.stroke();
    ctx.restore();

    for (const p of points) {
      const q = at(p);
      fillDot(ctx, q.x, q.y, 3, HANDLE);
    }

    /* Eleven marks at equal steps of whichever quantity is selected. Bunched marks are slow going and
       spread marks are fast, so the picture is the speed profile rather than a claim about it. */
    for (const p of markPoints(points, even)) {
      const q = at(p);
      fillDot(ctx, q.x, q.y, 2.6, MARK);
    }

    const here = at(pointAt(points, t));
    const angle = facingAt(points, t);
    if (angle === null) {
      // No tangent means no facing. Drawn as an absence rather than as an arrow pointing east.
      fillDot(ctx, here.x, here.y, 7, BROKEN);
      label(ctx, "no facing here", here.x + 12, here.y - 10, BROKEN);
    } else {
      const direction = directionFromAngle(angle);
      arrow(
        ctx,
        here,
        { x: here.x + direction.x * 38, y: here.y - direction.y * 38 },
        FACING,
        2.4,
      );
      fillDot(ctx, here.x, here.y, 6, SPRITE);
    }

    label(
      ctx,
      `${MARKS} marks at equal steps of ${even ? "distance" : "t"} \u00b7 drag any grey point`,
      12,
      VIEW.height - 10,
      DIM,
    );

    const r = travelReport(points, even);
    show(
      `length ${r.length.toFixed(2)} \u00b7 ` +
        `${
          even
            ? `${(s * 100).toFixed(0)}% of the distance is at t = ${t.toFixed(3)}`
            : `t = ${t.toFixed(2)} is only at ${(fractionAtT(points, t, table) * 100).toFixed(1)}% of the distance`
        } \u00b7 widest gap over narrowest ${r.evenness.toFixed(3)}`,
    );
    note(
      even
        ? "the marks are evenly spaced, so equal time now means equal ground covered"
        : `the marks bunch where the curve is slow and spread where it is fast \u2014 the fastest part of this ` +
            `curve moves ${r.spread.toFixed(2)} times as fast as the slowest`,
    );
  }

  draw();

  return stopDragging;
};

export default mount;
