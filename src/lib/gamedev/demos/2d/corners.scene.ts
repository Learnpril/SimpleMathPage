/** The region a circle's centre can be in and still touch a box: rounded corners, not square ones. */
import { makeCanvas2D, dot as fillDot, label, line } from "../canvas2d.ts";
// From `controls.ts`, not `ui.ts`: the latter imports Three.js and this track must not.
import { addCheckbox, addReadout, addSlider } from "../controls.ts";
import {
  CORNER_BOX,
  RADIUS_RANGE,
  UNIT,
  VIEW,
  cornerErrorArea,
  errorFraction,
  naiveRegion,
  screenOf,
} from "./shapes-shared.ts";
import type { MountFn } from "../runner.ts";

const BOX = "#7d8590";
const TRUE_REGION = "#7ee787";
const NAIVE = "#ff7b72";
const PROBE = "#ffd866";
const DIM = "#636c76";

const mount: MountFn = (el) => {
  const { ctx, clear } = makeCanvas2D(el, VIEW.height);

  const show = addReadout(el);
  const note = addReadout(el);
  const radius = addSlider(
    el,
    "the circle's radius",
    RADIUS_RANGE.min,
    RADIUS_RANGE.max,
    1.1,
    draw,
    "",
    0.05,
  );
  const probe = addCheckbox(
    el,
    "put a circle at the worst point the naive test accepts",
    true,
    draw,
  );

  function draw() {
    clear();
    const r = radius();
    const box = CORNER_BOX;
    const grown = naiveRegion(r);
    const a = screenOf(box.min);
    const b = screenOf(box.max);
    const left = Math.min(a.x, b.x);
    const right = Math.max(a.x, b.x);
    const top = Math.min(a.y, b.y);
    const bottom = Math.max(a.y, b.y);
    const pad = r * UNIT;

    /* The four corner squares the naive test wrongly accepts, shaded before either outline so both
       outlines stay legible on top of them. Each is a square minus a quarter-disc. */
    ctx.save();
    ctx.fillStyle = "rgba(255, 123, 114, 0.18)";
    for (const [cx, cy, sx, sy] of [
      [right, top, 1, -1],
      [right, bottom, 1, 1],
      [left, bottom, -1, 1],
      [left, top, -1, -1],
    ] as const) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + sx * pad, cy);
      ctx.lineTo(cx + sx * pad, cy + sy * pad);
      ctx.lineTo(cx, cy + sy * pad);
      ctx.closePath();
      // Cut the quarter-disc back out, leaving exactly the region the two tests disagree on.
      ctx.arc(cx, cy, pad, 0, Math.PI * 2, true);
      ctx.fill("evenodd");
    }
    ctx.restore();

    // The box itself.
    ctx.save();
    ctx.strokeStyle = BOX;
    ctx.lineWidth = 2;
    ctx.strokeRect(left, top, right - left, bottom - top);
    ctx.restore();

    // What the naive test accepts: the box grown by the radius, corners and all.
    const ga = screenOf(grown.min);
    const gb = screenOf(grown.max);
    ctx.save();
    ctx.strokeStyle = NAIVE;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(
      Math.min(ga.x, gb.x),
      Math.min(ga.y, gb.y),
      Math.abs(gb.x - ga.x),
      Math.abs(gb.y - ga.y),
    );
    ctx.restore();

    // What is actually true: the same box with rounded corners of exactly the radius.
    ctx.save();
    ctx.strokeStyle = TRUE_REGION;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(left, top - pad);
    ctx.lineTo(right, top - pad);
    ctx.arc(right, top, pad, -Math.PI / 2, 0);
    ctx.lineTo(right + pad, bottom);
    ctx.arc(right, bottom, pad, 0, Math.PI / 2);
    ctx.lineTo(left, bottom + pad);
    ctx.arc(left, bottom, pad, Math.PI / 2, Math.PI);
    ctx.lineTo(left - pad, top);
    ctx.arc(left, top, pad, Math.PI, (3 * Math.PI) / 2);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    /* A circle sitting at the naive region's corner: the furthest the wrong test accepts. Its distance
       from the box corner is r*sqrt(2), so it clears the corner by r*(sqrt(2) - 1) and touches nothing. */
    if (probe()) {
      const worst = { x: grown.max.x, y: grown.max.y };
      const w = screenOf(worst);
      ctx.save();
      ctx.strokeStyle = PROBE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(w.x, w.y, pad, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      fillDot(ctx, w.x, w.y, 3.5, PROBE);
      // The gap it leaves, drawn from the box's corner toward the circle's centre.
      const corner = screenOf(box.max);
      line(ctx, corner, w, PROBE, { dashed: true, width: 1.2 });
      label(ctx, "accepted, and touching nothing", w.x + 10, w.y - 8, PROBE);
    }

    label(ctx, "the box", left + 8, bottom - 8, BOX);
    label(ctx, "actually touching: rounded", 12, 16, TRUE_REGION);
    label(ctx, "the naive test: square", 12, 30, NAIVE);
    label(ctx, "the difference is the bug", 12, VIEW.height - 8, DIM);

    show(
      `radius ${r.toFixed(2)} \u00b7 the wrong region is bigger by ` +
        `${cornerErrorArea(r).toFixed(3)} square units, which is (4 \u2212 \u03C0)r\u00B2 \u00b7 ` +
        `${(errorFraction(r) * 100).toFixed(2)}% of everything it accepts`,
    );
    note(
      `at a corner it over-reaches by r(\u221A2 \u2212 1) = ${(r * (Math.SQRT2 - 1)).toFixed(3)} units \u2014 ` +
        "41.42% of the radius, whatever the radius is, and whatever the box is",
    );
  }

  draw();

  return () => {};
};

export default mount;
