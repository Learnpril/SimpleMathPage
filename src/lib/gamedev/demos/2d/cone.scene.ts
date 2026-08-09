/** A guard's vision cone, with a checkbox that removes the normalize and breaks it. */
import {
  makeCanvas2D,
  arrow,
  dot as fillDot,
  label,
  line,
} from "../canvas2d.ts";
// From `controls.ts`, not `ui.ts`: the latter imports Three.js and this track must not.
import { addCheckbox, addReadout, addSlider } from "../controls.ts";
import { GUARD, RANGE, report, targetAt } from "./cone-shared.ts";
import type { MountFn } from "../runner.ts";

const CONE = "#7ee787";
const MISS = "#ff7b72";
const AXIS = "#30363d";
const TEXT = "#9198a1";

const mount: MountFn = (el) => {
  const { ctx, width, height, clear } = makeCanvas2D(el, 300);

  const show = addReadout(el);
  const note = addReadout(el);
  const half = addSlider(el, "cone half-angle", 5, 90, 45, draw);
  const bearing = addSlider(el, "target angle off facing", -180, 180, 60, draw);
  const distance = addSlider(el, "target distance", 1, 10, 3, draw, " m", 0.5);
  const normalized = addCheckbox(
    el,
    "normalize first (uncheck for the bug)",
    true,
    draw,
  );

  function draw() {
    clear();
    // The guard sits left of centre so the whole cone fits when it is wide.
    const ox = 90;
    const oy = height / 2;
    const unit = 24;
    // World y is up, so drawing negates it. Section 1.1's one conversion, in one place.
    const at = (p: { x: number; y: number }) => ({
      x: ox + p.x * unit,
      y: oy - p.y * unit,
    });

    line(ctx, { x: 0, y: oy }, { x: width, y: oy }, AXIS);
    line(ctx, { x: ox, y: 0 }, { x: ox, y: height }, AXIS);

    const r = report(half(), bearing(), distance(), normalized());
    const colour = r.seen ? CONE : MISS;

    // The cone as a filled wedge, drawn in canvas angles, so both edges are negated.
    const edge = (half() * Math.PI) / 180;
    ctx.save();
    ctx.fillStyle = r.seen
      ? "rgba(126, 231, 135, 0.16)"
      : "rgba(255, 123, 114, 0.12)";
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.arc(ox, oy, RANGE * unit, -edge, edge);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // The range limit, so a target failing on distance rather than angle is legible.
    ctx.save();
    ctx.strokeStyle = AXIS;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(ox, oy, RANGE * unit, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // The guard, and the direction it is facing.
    arrow(ctx, at(GUARD), at({ x: 2.4, y: 0 }), TEXT, 2);
    fillDot(ctx, at(GUARD).x, at(GUARD).y, 5, TEXT);
    label(ctx, "guard", at(GUARD).x - 6, at(GUARD).y + 20, TEXT, "center");

    // The target, and the displacement the test measures.
    const target = at(r.target);
    line(ctx, at(GUARD), target, colour, { dashed: !r.seen });
    fillDot(ctx, target.x, target.y, 5, colour);
    label(
      ctx,
      r.seen ? "seen" : r.inRange ? "outside the cone" : "out of range",
      target.x + 9,
      target.y + 4,
      colour,
    );

    // The cone edges, labelled, since the wedge alone does not say what its angle is.
    for (const sign of [-1, 1]) {
      const e = targetAt(sign * half(), RANGE);
      line(ctx, at(GUARD), at(e), CONE, { width: 1 });
    }
    label(ctx, `half-angle ${half()}\u00B0`, 10, 18, CONE);
    label(ctx, `range ${RANGE} m`, 10, 32, TEXT);

    show(
      `${normalized() ? "dot of unit directions" : "dot of the raw displacement"} ` +
        `${r.measured.toFixed(3)} vs threshold ${r.threshold.toFixed(3)} \u2192 ` +
        `${r.inCone ? "inside" : "outside"} the cone, ${r.seen ? "seen" : "not seen"}`,
    );
    note(
      normalized()
        ? `at ${Math.abs(bearing())}\u00B0 off the facing the answer does not change with distance`
        : `without the normalize the number grows with distance: at ${distance().toFixed(1)} m it is ` +
            `${r.measured.toFixed(2)}, so moving further away makes the guard more likely to "see" you`,
    );
  }

  draw();

  return () => {};
};

export default mount;
