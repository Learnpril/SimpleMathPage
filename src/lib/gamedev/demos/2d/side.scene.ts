/** A point moving across a directed line, with the cross product's sign flipping as it crosses. */
import {
  makeCanvas2D,
  arrow,
  dot as fillDot,
  label,
  line,
} from "../canvas2d.ts";
// From `controls.ts`, not `ui.ts`: the latter imports Three.js and this track must not.
import { addCheckbox, addReadout, addSlider } from "../controls.ts";
import { perpLeft } from "../../../gamedev2d/cross2d.ts";
import { normalize } from "../../../gamedev2d/length2d.ts";
import { displacement, movedBy } from "../../../gamedev2d/vectors2d.ts";
import { footOnLine, parallelogramCorners, reading } from "./side-shared.ts";
import type { MountFn } from "../runner.ts";

const LEFT = "#7ee787";
const RIGHT = "#ff7b72";
const LINE = "#58a6ff";
const AREA = "#d2a8ff";
const GRID = "#252b33";
const TEXT = "#9198a1";

const mount: MountFn = (el) => {
  const { ctx, width, height, clear } = makeCanvas2D(el, 310);

  const show = addReadout(el);
  const note = addReadout(el);
  const py = addSlider(el, "point y", -4, 4, 2, draw, "", 0.1);
  const px = addSlider(el, "point x", -7, 7, 2.5, draw, "", 0.1);
  const angle = addSlider(el, "line angle", -90, 90, 20, draw);
  const shade = addCheckbox(el, "shade the parallelogram", true, draw);
  const reversed = addCheckbox(el, "read the line backwards", false, draw);

  function draw() {
    clear();
    const unit = 30;
    const ox = width / 2;
    const oy = height / 2;
    // World Y is up, so drawing negates it. Section 1.1's one conversion, in one place.
    const at = (p: { x: number; y: number }) => ({
      x: ox + p.x * unit,
      y: oy - p.y * unit,
    });

    line(ctx, { x: 0, y: oy }, { x: width, y: oy }, GRID, { width: 1 });
    line(ctx, { x: ox, y: 0 }, { x: ox, y: height }, GRID, { width: 1 });

    const r = reading(angle(), px(), py(), reversed());
    const colour = r.side > 0 ? LEFT : r.side < 0 ? RIGHT : TEXT;
    const direction = normalize(displacement(r.from, r.to)) ?? { x: 1, y: 0 };

    // The line is infinite, so it is drawn running off both edges. Only the segment is solid.
    const far = 40;
    line(
      ctx,
      at(movedBy(r.from, { x: -direction.x * far, y: -direction.y * far })),
      at(movedBy(r.to, { x: direction.x * far, y: direction.y * far })),
      LINE,
      { dashed: true, width: 1 },
    );

    if (shade()) {
      const corners = parallelogramCorners(r).map(at);
      ctx.save();
      ctx.fillStyle = "rgba(210, 168, 255, 0.14)";
      ctx.strokeStyle = AREA;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(corners[0].x, corners[0].y);
      for (const c of corners.slice(1)) ctx.lineTo(c.x, c.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // The segment, drawn as an arrow because which side depends on which way it points.
    arrow(ctx, at(r.from), at(r.to), LINE, 2.4);
    label(ctx, "A", at(r.from).x - 12, at(r.from).y + 4, LINE);
    label(ctx, "B", at(r.to).x + 8, at(r.to).y + 4, LINE);

    // Which way "left" is, since it is a claim about the line's direction and not about the canvas.
    const middle = movedBy(r.from, {
      x: displacement(r.from, r.to).x / 2,
      y: displacement(r.from, r.to).y / 2,
    });
    const normal = perpLeft(direction);
    arrow(
      ctx,
      at(middle),
      at(movedBy(middle, { x: normal.x * 1.1, y: normal.y * 1.1 })),
      LEFT,
      1.4,
    );
    label(
      ctx,
      "left",
      at(movedBy(middle, { x: normal.x * 1.5, y: normal.y * 1.5 })).x,
      at(movedBy(middle, { x: normal.x * 1.5, y: normal.y * 1.5 })).y,
      LEFT,
      "center",
    );

    // The perpendicular the signed distance measures.
    const foot = footOnLine(r);
    line(ctx, at(foot), at(r.p), colour, { dashed: true, width: 1 });

    const point = at(r.p);
    fillDot(ctx, point.x, point.y, 6, colour);
    label(
      ctx,
      `P (${r.p.x.toFixed(1)}, ${r.p.y.toFixed(1)})`,
      point.x + 10,
      point.y - 8,
      colour,
    );
    label(
      ctx,
      r.side > 0 ? "left" : r.side < 0 ? "right" : "on the line",
      point.x + 10,
      point.y + 8,
      colour,
    );

    show(
      `(B \u2212 A) \u00D7 (P \u2212 A) = ${r.raw.toFixed(2)} \u2192 ` +
        `${r.side > 0 ? "positive, so P is left of A\u2192B" : r.side < 0 ? "negative, so P is right of A\u2192B" : "zero, so P is on the line"}` +
        ` \u00B7 ${Math.abs(r.distance).toFixed(2)} units from it`,
    );
    note(
      reversed()
        ? "reading the line B\u2192A instead flips the sign of every point, and changes neither the distance nor the area"
        : `\u007C cross \u007C ${r.parallelogram.toFixed(2)} is the shaded parallelogram's area, and half of it, ` +
            `${r.triangle.toFixed(2)}, is triangle ABP's`,
    );
  }

  draw();

  return () => {};
};

export default mount;
