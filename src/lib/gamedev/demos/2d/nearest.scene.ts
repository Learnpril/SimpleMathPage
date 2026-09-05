/** The closest point on a wall, with and without the clamp that stops it running off the ends. */
import {
  makeCanvas2D,
  addDragTargets,
  dot as fillDot,
  label,
  line,
} from "../canvas2d.ts";
// From `controls.ts`, not `ui.ts`: the latter imports Three.js and this track must not.
import { addCheckbox, addReadout, addSlider } from "../controls.ts";
import { pointOn } from "../../../gamedev2d/segment2d.ts";
import { normalize } from "../../../gamedev2d/length2d.ts";
import { displacement } from "../../../gamedev2d/vectors2d.ts";
import {
  BOUNDS,
  NEAREST_WALL,
  START,
  VIEW,
  nearestReport,
  screenOf,
  worldOf,
} from "./sight-shared.ts";
import type { MountFn } from "../runner.ts";

const WALL = "#7d8590";
const LINE = "#3b4552";
const ON_SEGMENT = "#7ee787";
const ON_LINE = "#ff7b72";
const POINT = "#58a6ff";
const BEYOND = "rgba(255, 123, 114, 0.10)";
const DIM = "#636c76";

const mount: MountFn = (el) => {
  const { ctx, canvas, clear } = makeCanvas2D(el, VIEW.height);

  const show = addReadout(el);
  const note = addReadout(el);
  const px = addSlider(el, "x", -BOUNDS.x, BOUNDS.x, START.x, draw, "", 0.05);
  const py = addSlider(el, "y", -BOUNDS.y, BOUNDS.y, START.y, draw, "", 0.05);
  const unclamped = addCheckbox(
    el,
    "also show the answer without the clamp",
    true,
    draw,
  );

  // Dragging is the natural way in; the two sliders are the keyboard path to the same position.
  const stopDragging = addDragTargets(
    canvas,
    () => [screenOf({ x: px(), y: py() })],
    (_index, sx, sy) => {
      const world = worldOf(sx, sy);
      px.set(Math.min(Math.max(world.x, -BOUNDS.x), BOUNDS.x));
      py.set(Math.min(Math.max(world.y, -BOUNDS.y), BOUNDS.y));
      draw();
    },
  );

  /* The two regions where `t` leaves [0, 1], shaded. Their boundaries are the perpendiculars at the
     wall's ends, so drawing them is how "past the end" stops being a phrase and becomes a place. */
  function shadeBeyond() {
    const along = normalize(displacement(NEAREST_WALL.a, NEAREST_WALL.b));
    if (along === null) return;
    const across = { x: -along.y, y: along.x };
    const far = 24;
    ctx.save();
    ctx.fillStyle = BEYOND;
    for (const [end, sign] of [
      [NEAREST_WALL.a, -1],
      [NEAREST_WALL.b, 1],
    ] as const) {
      const corners = [
        { x: end.x + across.x * far, y: end.y + across.y * far },
        { x: end.x - across.x * far, y: end.y - across.y * far },
        {
          x: end.x - across.x * far + along.x * sign * far,
          y: end.y - across.y * far + along.y * sign * far,
        },
        {
          x: end.x + across.x * far + along.x * sign * far,
          y: end.y + across.y * far + along.y * sign * far,
        },
      ];
      ctx.beginPath();
      corners.forEach((c, i) => {
        const q = screenOf(c);
        if (i === 0) ctx.moveTo(q.x, q.y);
        else ctx.lineTo(q.x, q.y);
      });
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function draw() {
    clear();
    const p = { x: px(), y: py() };
    const r = nearestReport(p);

    shadeBeyond();

    // The infinite line the wall lies on, which is what dropping the clamp measures against.
    line(
      ctx,
      screenOf(pointOn(NEAREST_WALL, -6)),
      screenOf(pointOn(NEAREST_WALL, 7)),
      LINE,
      {
        dashed: true,
        width: 1,
      },
    );

    // The wall itself, and its ends, which are the only difference between the two answers.
    line(ctx, screenOf(NEAREST_WALL.a), screenOf(NEAREST_WALL.b), WALL, {
      width: 3,
    });
    for (const [end, name] of [
      [NEAREST_WALL.a, "t = 0"],
      [NEAREST_WALL.b, "t = 1"],
    ] as const) {
      const q = screenOf(end);
      fillDot(ctx, q.x, q.y, 3.5, WALL);
      label(ctx, name, q.x + 7, q.y + 14, DIM);
    }

    const here = screenOf(p);

    // The unclamped answer, drawn first so the correct one sits on top of it.
    if (unclamped() && r.clampMattered) {
      const off = screenOf(r.onLine);
      line(ctx, here, off, ON_LINE, { dashed: true, width: 1.5 });
      fillDot(ctx, off.x, off.y, 4.5, ON_LINE);
      label(ctx, "nearest on the line", off.x + 8, off.y - 8, ON_LINE);
    }

    // The answer, on the segment.
    const on = screenOf(r.onSegment);
    line(ctx, here, on, ON_SEGMENT, { width: 1.8 });
    fillDot(ctx, on.x, on.y, 5, ON_SEGMENT);
    label(ctx, "nearest on the wall", on.x + 8, on.y + 16, ON_SEGMENT);

    fillDot(ctx, here.x, here.y, 5.5, POINT);
    label(ctx, "drag me", here.x + 10, here.y - 8, POINT);

    label(ctx, "shaded: past an end, where t leaves 0 to 1", 12, 18, DIM);

    show(
      `t = ${r.raw.toFixed(3)} \u2192 clamped to ${r.clamped.toFixed(3)} \u00b7 ` +
        `${r.toSegment.toFixed(3)} from the wall, ${r.toLine.toFixed(3)} from its infinite line`,
    );
    note(
      r.clampMattered
        ? `past an end, so the clamp is doing the work \u2014 without it the answer is ${(r.toSegment / Math.max(r.toLine, 1e-6)).toFixed(1)}\u00D7 too close`
        : "between the ends, so the clamp changes nothing and both answers agree exactly",
    );
  }

  draw();

  return stopDragging;
};

export default mount;
